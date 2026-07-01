import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-session-extend-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './session-extend-dialog.html',
  styleUrl: './session-extend-dialog.css',
})
export class SessionExtendDialogComponent {
  private dialogRef = inject(MatDialogRef<SessionExtendDialogComponent>);

  onExtend(): void {
    this.dialogRef.close(true); // User wants to refresh
  }

  onLogout(): void {
    this.dialogRef.close(false); // User wants to leave
  }
}
