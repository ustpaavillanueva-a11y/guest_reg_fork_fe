import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-management',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2>User Management</h2>

    <!-- Add User Form -->
    @if (showForm()) {
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ editingUser() ? 'Edit User' : 'Add New User' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="userForm" (ngSubmit)="onSave()" class="user-form">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" />
                @if (editingUser()) {
                  <mat-hint>Leave blank to keep the current password</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="front_desk">Front Desk</mat-option>
                  <mat-option value="admin">Admin</mat-option>
                  <mat-option value="super_admin">Super Admin</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelForm()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid">
                {{ editingUser() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <!-- User List -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>All Users</mat-card-title>
        <button mat-raised-button color="primary" (click)="openAddForm()">
          <mat-icon>person_add</mat-icon> Add User
        </button>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="users()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let user">{{ user.firstName }} {{ user.lastName }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip>{{ user.role.replace('_', ' ') }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let user">
              <mat-slide-toggle
                [checked]="user.isActive"
                (change)="toggleActive(user)"
                color="primary"
              />
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button color="primary" (click)="editUser(user)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteUser(user)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    h2 { margin-bottom: 24px; color: #1a1a2e; }
    .form-card { margin-bottom: 24px; }
    .user-form { padding: 16px 0; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
    .form-actions { display: flex; gap: 12px; margin-top: 16px; }
    .full-width { width: 100%; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
  `,
})
export class UserManagementComponent implements OnInit {
  users = signal<User[]>([]);
  showForm = signal(false);
  editingUser = signal<User | null>(null);
  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  userForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.minLength(6)],
    role: ['front_desk' as import('../../../core/models').UserRole, Validators.required],
  });

  constructor() {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe((users) => this.users.set(users));
  }

  openAddForm(): void {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'front_desk' });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.userForm.patchValue(user as any);
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingUser.set(null);
  }

  onSave(): void {
    if (this.userForm.invalid) return;

    const raw = this.userForm.getRawValue();
    const data: any = { ...raw, role: raw.role as import('../../../core/models').UserRole };
    const editing = this.editingUser();

    if (editing && !data.password) {
      delete data.password;
    }

    const obs = editing
      ? this.userService.update(editing.id, data)
      : this.userService.create(data);

    obs.subscribe({
      next: () => {
        this.snackBar.open(editing ? 'User updated' : 'User created', 'Close', { duration: 3000 });
        this.showForm.set(false);
        this.loadUsers();
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Failed', 'Close', { duration: 3000 }),
    });
  }

  toggleActive(user: User): void {
    const obs = user.isActive
      ? this.userService.deactivate(user.id)
      : this.userService.activate(user.id);

    obs.subscribe({
      next: () => this.loadUsers(),
      error: () => this.snackBar.open('Toggle failed', 'Close', { duration: 3000 }),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete user "${user.firstName} ${user.lastName}"?`)) return;

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.snackBar.open('User deleted', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 }),
    });
  }
}
