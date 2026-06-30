import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-signup',
  imports: [
    FormField,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  private apiService = inject(ApiService);
  private router = inject(Router);

  // 1. Raw form model managed via a Writable Signal
  signupModel = signal({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // 2. Build form tree & handle validation schemas
  signupForm = form(this.signupModel, (schemaPath) => {

    // Name rules
    required(schemaPath.name, { message: 'Name is required' });
    minLength(schemaPath.name, 3, { message: 'Must be at least 3 characters' });

    // Email rules
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Invalid email format' });

    // Mobile rules
    required(schemaPath.mobile, { message: 'Mobile No. is required' });
    minLength(schemaPath.mobile, 10, { message: 'Must be a 10-digit mobile number' });
    maxLength(schemaPath.mobile, 10, { message: 'Must be a 10-digit mobile number' });

    // Password rules
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 6, { message: 'Must be at least 6 characters' });

    // Confirm Password rules
    required(schemaPath.confirmPassword, { message: 'Please confirm your password' });

    // Cross-field Validation: Ensure confirmPassword matches password
    validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
      // 1. Invoke value() as a function to get the string
      const confirmPasswordValue = value();

      // 2. valueOf() already returns the raw unwrapped value (string)
      const originalPassword = valueOf(schemaPath.password);

      if (confirmPasswordValue !== originalPassword) {
        return { kind: 'mismatch', message: 'Passwords do not match' };
      }
      return null;
    });
  });

  // 3. Form Submission handler
  onSubmit(event: Event) {
    event.preventDefault(); // Stop native HTML page reload!

    if (this.signupForm().valid()) {
      console.log('Account registered successfully!', this.signupModel());
      // Call your backend API service here
      this.router.navigate(['/dashboard']);
    }
  }
}
