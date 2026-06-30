import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { form, FormField, required, email, minLength, FormRoot } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormField, FormRoot, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {

  private apiService = inject(ApiService);
  private router = inject(Router);

  // private cdr = inject(ChangeDetectorRef);

  response = signal('Loading...');

  ngOnInit() {
    this.apiService.getHome().subscribe({
      next: (data) => {
        this.response.set(data);
        console.log(this.response());

      },
      error: (err) => {
        this.response.set('Backend not reachable');
        console.error(this.response());
        console.error(err);
      }
    });
  }

  userModel = signal({
    email: '',
    password: ''
  });

  loginForm = form(
    this.userModel,
    (formdata) => {
      required(formdata.email, { message: 'Email is required' });
      email(formdata.email, { message: 'Invalid email format' });
      required(formdata.password, { message: 'Password is required' });
      minLength(formdata.password, 6, { message: 'Must be at least 6 characters' });
    },
    {
      submission: {
        action: async () => {
          console.log('Form Submitted Safely via FormRoot!', this.userModel());
          this.router.navigate(['/dashboard']);
        }
      }
    }
  );

}