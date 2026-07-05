import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { form, FormField, required, email, minLength, FormRoot } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenService } from '../../../core/services/token';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormField, FormRoot, MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login {

  showSessionExpiredMessage = false;

  private authService = inject(Auth);
  private tokenservice = inject(TokenService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'jwt_token_expired') {
        this.showSessionExpiredMessage = true;
      }
    });
  }

  errorMessage: string = '';
  isLoading = signal(false);

  userModel = signal({
    email: 'rsathishkumar4@gmail.com',
    password: '123456'
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
          this.isLoading.set(true);
          this.errorMessage = '';

          this.authService.login(this.userModel()).subscribe({
            next: (response) => {

              this.tokenservice.saveTokens(response.username, response.accessToken, response.refreshToken);

              setTimeout(() => {
                this.isLoading.set(false);
                this.snackBar.open('User logged in successfully!', 'Close', {
                  duration: 3000,
                  horizontalPosition: 'center',
                  verticalPosition: 'bottom'
                });

                this.router.navigate(['/dashboard']);
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
  );

}