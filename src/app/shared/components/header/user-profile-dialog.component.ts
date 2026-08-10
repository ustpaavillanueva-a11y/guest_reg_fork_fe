import { Component, Inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  signature?: string | null;
}

const MAX_SIGNATURE_FILE_SIZE = 2 * 1024 * 1024; // 2MB

@Component({
  selector: 'app-user-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
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

        <div class="profile-field">
          <label>My Signature</label>
          <p class="sig-hint">Used automatically as your Front Desk signature when you register a guest. PNG image only.</p>

          @if (pendingPreview(); as preview) {
            <div class="signature-preview">
              <img [src]="preview" alt="Signature to save" />
            </div>
            <div class="sig-form-actions">
              <button mat-button (click)="cancelPending()" [disabled]="saving()">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveSignature()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save Signature' }}
              </button>
            </div>
          } @else if (savedSignature()) {
            <div class="signature-preview">
              <img [src]="savedSignature()" alt="Your saved signature" />
            </div>
            <input #fileInput type="file" accept="image/png" hidden (change)="onFileSelected($event)" />
            <button mat-stroked-button (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Change Signature
            </button>
          } @else {
            <input #fileInput type="file" accept="image/png" hidden (change)="onFileSelected($event)" />
            <button mat-stroked-button (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Upload Signature (PNG)
            </button>
          }
        </div>
      </div>

      <mat-divider class="my-divider"></mat-divider>

      <div class="dialog-actions">
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
      max-height: 500px;
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

    .sig-hint {
      font-size: 12px;
      color: #888;
      margin-bottom: 10px !important;
      text-transform: none;
    }

    .signature-preview {
      border: 1px solid #eee;
      border-radius: 8px;
      background: #fff;
      padding: 8px;
      margin-bottom: 10px;

      img {
        display: block;
        max-width: 100%;
        max-height: 120px;
      }
    }

    .sig-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 10px;
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
  savedSignature = signal<string | null>(null);
  pendingPreview = signal<string | null>(null);
  saving = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: User,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    this.savedSignature.set(data.signature ?? null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.type !== 'image/png') {
      this.snackBar.open('Please upload a PNG image', 'Close', { duration: 3000 });
      return;
    }

    if (file.size > MAX_SIGNATURE_FILE_SIZE) {
      this.snackBar.open('Image is too large (max 2MB)', 'Close', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.pendingPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  cancelPending(): void {
    this.pendingPreview.set(null);
  }

  saveSignature(): void {
    const dataUrl = this.pendingPreview();
    if (!dataUrl) return;

    this.saving.set(true);
    this.authService.updateSignature(dataUrl).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.savedSignature.set(user.signature ?? null);
        this.data.signature = user.signature;
        this.pendingPreview.set(null);
        this.snackBar.open('Signature saved', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'Failed to save signature', 'Close', { duration: 3000 });
      },
    });
  }

  onClose(): void {
    // MatDialog closes automatically when backdrop is clicked
    // This is just for explicit close button
  }
}
