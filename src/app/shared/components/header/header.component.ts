import { Component, output, computed } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileDialogComponent } from './user-profile-dialog.component';

@Component({
  selector: 'app-header',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatDialogModule],
  template: `
    <mat-toolbar color="primary" class="header">
      <button mat-icon-button (click)="toggleSidenav.emit()">
        <mat-icon>menu</mat-icon>
      </button>

      <span class="spacer"></span>

      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu">
        <div class="user-info">
          <strong>{{ userName() }}</strong>
          <small>{{ userRole() }}</small>
        </div>
        <mat-divider />
        <button mat-menu-item (click)="openProfileModal()">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="onLogout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: `
    .header {
      background: #1a1a2e;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      small {
        color: #666;
        text-transform: capitalize;
      }
    }
  `,
})
export class HeaderComponent {
  toggleSidenav = output<void>();

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  userRole = computed(() => {
    const role = this.authService.userRole();
    return role?.replace('_', ' ') ?? '';
  });

  openProfileModal(): void {
    this.dialog.open(UserProfileDialogComponent, {
      width: '400px',
      data: this.authService.user()
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
