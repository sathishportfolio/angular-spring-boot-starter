import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Auth } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { timeout } from 'rxjs';

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

  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  errorMessage: string = '';
  isLoading = signal(false);

  // 1. Raw form model managed via a Writable Signal
  signupModel = signal({
    username: 'Sathishkumar00',
    email: 'rsathishkumar00@gmail.com',
    mobile: '9629992643',
    password: '123456',
    confirmPassword: '123456'
  });

  // 2. Build form tree & handle validation schemas
  signupForm = form(this.signupModel, (schemaPath) => {

    // Name rules
    required(schemaPath.username, { message: 'Name is required' });
    minLength(schemaPath.username, 3, { message: 'Must be at least 3 characters' });

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
    event.preventDefault();
    this.isLoading.set(true);
    this.errorMessage = '';

    if (this.signupForm().valid()) {
      this.auth.signup(this.signupModel()).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.isLoading.set(false);
            this.snackBar.open(response.message, 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });

            this.router.navigate(['/login']);
          }, 1000);
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading.set(false);

            this.errorMessage = err.error?.error || 'An unexpected error occurred during signup.';

            this.snackBar.open(this.errorMessage, 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }, 1000);
        }
      });
    }
  }
}
