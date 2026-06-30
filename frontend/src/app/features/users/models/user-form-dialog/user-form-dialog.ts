import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserElement } from '../../../dashboard/pages/dashboard/dashboard';

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
  private dialogRef = inject(MatDialogRef<UserFormDialog>);
  // Inject passing data from the dashboard (if editing, a user object arrives here)
  public data = inject<UserElement | null>(MAT_DIALOG_DATA);

  isEdit = !!this.data;

  // Initialize the signal model with existing data if editing, or blank fields if adding
  userModel = signal({
    name: this.data?.name || '',
    email: this.data?.email || '',
    mobile: this.data?.mobile || ''
  });

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.name);

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
    if (this.userForm().valid()) {
      // Close the modal and send the raw form data back to the dashboard component
      this.dialogRef.close(this.userModel());
    }
  }
}
