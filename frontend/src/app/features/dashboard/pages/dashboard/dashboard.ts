// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-dashboard',
//   imports: [],
//   templateUrl: './dashboard.html',
//   styleUrl: './dashboard.css',
// })
// export class Dashboard {}

import { Component, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormDialog } from '../../../users/models/user-form-dialog/user-form-dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../../../users/models/confirm-dialog/confirm-dialog';
import { Auth } from '../../../auth/services/auth';
import { TokenService } from '../../../../core/services/token';
import { UserService } from '../../../users/services/user.service';

export interface UserElement {
  id: number;
  username: string;
  email: string;
  mobile: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements AfterViewInit {
  private authService = inject(Auth);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // 1. Session signals
  loggedInUser = signal(this.tokenService.getUserName());

  // 2. Filter criteria signals
  filterColumn = signal<keyof UserElement | 'all'>('all');
  filterValue = signal('');

  // 3. User local dataset managed by an Angular Signal
  usersList = signal<UserElement[]>([]);

  // Material Table configuration references
  displayedColumns: string[] = ['id', 'username', 'email', 'mobile', 'actions'];
  dataSource = new MatTableDataSource<UserElement>(this.usersList());

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        this.usersList.set(res);
        this.refreshTable();
      },
      error: (err) => {
        this.snackBar.open('Failed to load users!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Custom filtering strategy to handle individual columns or global matching
    this.dataSource.filterPredicate = (data: UserElement, filter: string) => {
      const col = this.filterColumn();
      const search = filter.trim().toLowerCase();

      if (col === 'all') {
        return (
          data.username.toLowerCase().includes(search) ||
          data.email.toLowerCase().includes(search) ||
          data.mobile.includes(search)
        );
      } else {
        return String(data[col]).toLowerCase().includes(search);
      }
    };
  }

  // 4. Filtering Logic
  applyFilter() {
    this.dataSource.filter = this.filterValue();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  addUser() {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '400px',
      data: null // Sending null lets the modal know it's a fresh entry
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Generate a new incremental numerical ID safely
        const nextId = this.usersList().length ? Math.max(...this.usersList().map(u => u.id)) + 1 : 1;

        const newUser: UserElement = {
          id: nextId,
          username: result.username,
          email: result.email,
          mobile: result.mobile
        };

        this.usersList.update(list => [...list, newUser]);
        this.refreshTable();
      }
    });
  }

  editUser(user: UserElement) {
    const dialogRef = this.dialog.open(UserFormDialog, {
      width: '400px',
      data: user // Pass the current selected user to populate fields
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.usersList.update(list =>
          list.map(u => u.id === user.id
            ? { ...u, username: result.username, email: result.email, mobile: result.mobile }
            : u
          )
        );
        this.refreshTable();

        // Trigger Success SnackBar for Edit User
        this.snackBar.open('User updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  deleteUser(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '350px',
      data: { message: 'Are you sure you want to delete this record?' }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.userService.deleteUser(id).subscribe({
          next: (res) => {this.deleteUser
            this.usersList.update(list => list.filter(u => u.id !== id));
            this.refreshTable();

            this.snackBar.open('User deleted successfully.', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          },
          error: (err) => {
            this.snackBar.open('Failed to delete user!', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
        });
      }
    });
  }

  private refreshTable() {
    this.dataSource.data = this.usersList();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout() // Fail-safe client clearance
    });
  }

  private finalizeLogout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
    this.snackBar.open("User logged out successfully!", 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
