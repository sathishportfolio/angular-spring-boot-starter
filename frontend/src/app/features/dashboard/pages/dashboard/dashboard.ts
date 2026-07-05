import { Component, inject, signal, ViewChild, AfterViewInit, effect } from '@angular/core';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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

  loggedInUser = signal(this.tokenService.getUserName());

  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  // Pagination & Sort State Signals
  pageSize = signal(5);
  pageOffset = signal(0);
  sortBy = signal('username');
  sortDir = signal('desc');

  // Total record server count (vital for MatPaginator math)
  totalRecords = signal(0);
  isLoading = signal(false);

  displayedColumns: string[] = ['id', 'username', 'email', 'mobile', 'actions'];
  dataSource = new MatTableDataSource<UserElement>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {

    this.searchSubject.pipe(
      debounceTime(400),        // Wait 400ms after the last keystroke before making a move
      distinctUntilChanged()    // Prevent duplicate API calls if the user types then backspaces quickly
    ).subscribe((searchValue) => {
      // Minimum character check: only search if length >= 3 OR if it's completely empty (so they can clear it)
      if (searchValue.length >= 3 || searchValue.length === 0) {
        this.searchTerm.set(searchValue);
      }
    });
    
    // 2. The Reactive Sync Engine
    // Whenever any of these inner signals update, fetch fresh, targeted datasets instantly.
    effect(() => {
      this.fetchBackendData(
        this.searchTerm(),
        this.sortBy(),
        this.sortDir(),
        this.pageSize(),
        this.pageOffset()
      );
    });
  }

  ngAfterViewInit() {
    // Bind Material Sort interactions to our reactive signals
    this.sort.sortChange.subscribe((sortState) => {
      if (sortState.direction) {
        this.sortBy.set(sortState.active);
        this.sortDir.set(sortState.direction);
      } else {
        // Fallback defaults when sorting is toggled completely off
        this.sortBy.set('id');
        this.sortDir.set('asc');
      }
      this.resetToFirstPage();
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearchChange(newValue: string) {
    this.searchSubject.next(newValue);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  // 3. Centralized REST Network Trigger
  private fetchBackendData(search: string, sortBy: string, sortDir: string, limit: number, offset: number) {
    this.isLoading.set(true);
    this.userService.getAllUsers({ search, sortBy, sortDir, limit, offset }).subscribe({
      next: (res) => {
        // Expecting backend signature: { total: number, data: UserElement[] }
        // If your API returns raw arrays directly, handle fallback arrays safely.
        if (res && res.data) {
          this.dataSource.data = res.data;
          this.totalRecords.set(res.total);
        } else {
          this.dataSource.data = res;
          this.totalRecords.set(res.length);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load real-time users data!', 'Close', { duration: 3000 });
      }
    });
  }

  // 4. Handle UI Interaction Hooks
  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    // Dynamic offset calculations: pageIndex * pageSize (e.g., page 2 * limit 5 = offset 10)
    this.pageOffset.set(event.pageIndex * event.pageSize);
  }

  applyFilter() {
    this.resetToFirstPage();
  }

  private resetToFirstPage() {
    this.pageOffset.set(0);
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
  }

  // Remaining dialog logic modifications to run DB mutations instead of client mocks:
  addUser() {
    const dialogRef = this.dialog.open(UserFormDialog, { width: '400px', data: null });
    dialogRef.afterClosed().subscribe(() => {
      this.fetchBackendData(this.searchTerm(), this.sortBy(), this.sortDir(), this.pageSize(), this.pageOffset());
    });
  }

  editUser(user: UserElement) {
    this.dialog.open(UserFormDialog, { width: '400px', data: user });
  }

  deleteUser(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialog, { width: '350px', data: { message: 'Are you sure?' } });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.fetchBackendData(this.searchTerm(), this.sortBy(), this.sortDir(), this.pageSize(), this.pageOffset());
            this.snackBar.open('User deleted successfully.', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Deletion failed.', 'Close', { duration: 3000 })
        });
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout()
    });
  }

  private finalizeLogout(): void {
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
    this.snackBar.open("User logged out successfully!", 'Close', { duration: 3000 });
  }
}