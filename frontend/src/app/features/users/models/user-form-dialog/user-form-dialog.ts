import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserElement } from '../../../dashboard/pages/dashboard/dashboard';
import { UserService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-form-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormField
  ],
  templateUrl: './user-form-dialog.html',
  styleUrl: './user-form-dialog.css',
})
export class UserFormDialog {
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<UserFormDialog>);
  // Inject passing data from the dashboard (if editing, a user object arrives here)
  public data = inject<UserElement | null>(MAT_DIALOG_DATA);

  isEdit = !!this.data;
  isLoading = signal(false);

  // Initialize the signal model with existing data if editing, or blank fields if adding
  userModel = signal({
    id: this.data?.id || '',
    username: this.data?.username || '',
    email: this.data?.email || '',
    mobile: this.data?.mobile || ''
  });

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.username);

    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Invalid email format' });

    required(schemaPath.mobile, { message: 'Mobile number is required' });
    validate(schemaPath.mobile, ({ value }) => {
      const text = value();
      if (text && text.length !== 10) {
        return { kind: 'length', message: 'Must be exactly 10 digits' };
      }
      return null;
    });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);

    if (this.userForm().valid()) {
      if (this.isEdit) {
        this.updateUser();
      } else {
        this.createUser();
      }
    }
  }

  private createUser() {
    this.userService.createUser(this.userModel()).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.snackBar.open("User created successfully !", 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          this.dialogRef.close(this.userModel());
        }, 1000);
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);

          let errorMessage = err.error?.error || 'An unexpected error occurred during signup.';

          this.snackBar.open(errorMessage, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }, 1000);
      }
    });
  }
  
  private updateUser() {
    this.userService.updateUser(this.userModel().id, this.userModel()).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.isLoading.set(false);
          this.snackBar.open("User updated successfully !", 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          this.dialogRef.close(this.userModel());
        }, 1000);
      },
      error: (err) => {
        setTimeout(() => {
          this.isLoading.set(false);

          let errorMessage = err.error?.error || 'An unexpected error occurred during signup.';

          this.snackBar.open(errorMessage, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }, 1000);
      }
    });
  }
}
