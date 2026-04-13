import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

@Component({
  selector: 'app-user-profile-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <div class="profile-dialog">
      <div class="dialog-header">
        <h2>User Profile</h2>
        <mat-icon class="close-icon">account_circle</mat-icon>
      </div>

      <mat-divider class="my-divider"></mat-divider>

      <div class="profile-content">
        <div class="profile-field">
          <label>First Name</label>
          <p>{{ data.firstName }}</p>
        </div>

        <div class="profile-field">
          <label>Last Name</label>
          <p>{{ data.lastName }}</p>
        </div>

        <div class="profile-field">
          <label>Email</label>
          <p>{{ data.email }}</p>
        </div>

        <div class="profile-field">
          <label>Role</label>
          <p>{{ (data.role ?? 'N/A') | titlecase }}</p>
        </div>

        <div class="profile-field">
          <label>User ID</label>
          <p>{{ data.id }}</p>
        </div>
      </div>

      <mat-divider class="my-divider"></mat-divider>

      <div class="dialog-actions">
        <button mat-raised-button color="primary">Edit Profile</button>
        <button mat-button (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styles: `
    .profile-dialog {
      padding: 20px 0;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      margin-bottom: 12px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
      }

      .close-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #C41E3A;
      }
    }

    .my-divider {
      margin: 12px 0;
    }

    .profile-content {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    }

    .profile-field {
      margin-bottom: 16px;

      label {
        display: block;
        font-weight: 600;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        color: #1a1a2e;
        font-size: 14px;
        word-break: break-word;
      }
    }

    .dialog-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding: 20px;
    }
  `
})
export class UserProfileDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: User) {}

  onClose(): void {
    // MatDialog closes automatically when backdrop is clicked
    // This is just for explicit close button
  }
}
