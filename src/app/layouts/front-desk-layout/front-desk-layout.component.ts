import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-front-desk-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-toolbar class="toolbar">
      <div class="toolbar-left">
       <img src="./header.png" alt="Header Image">
      </div>

      <nav class="toolbar-nav">
        <a mat-button routerLink="/guest-registration" routerLinkActive="active-link">
          <mat-icon>edit_note</mat-icon> Register Guest
        </a>
        <a mat-button routerLink="/my-registrations" routerLinkActive="active-link">
          <mat-icon>list_alt</mat-icon> My Registrations
        </a>
      </nav>

      <div class="toolbar-right">
        <div class="user-badge">
          <mat-icon>account_circle</mat-icon>
          <span class="user-name">{{ userName() }}</span>
        </div>
        <button mat-icon-button (click)="authService.logout()" matTooltip="Sign out">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .toolbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      opacity: 0.9;
    }
    .hotel-name {
      font-weight: 700;
      font-size: 18px;
      letter-spacing: 0.3px;
    }
    .toolbar-nav {
      display: flex;
      gap: 4px;
    }
    .toolbar-nav a {
      color: rgba(255,255,255,0.75);
      border-radius: 8px;
      font-size: 13px;
      transition: all 0.2s;
    }
    .toolbar-nav a:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }
    .toolbar-nav .active-link {
      color: white;
      background: rgba(255,255,255,0.15);
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      font-size: 13px;
    }
    .user-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      opacity: 0.8;
    }
    .user-name {
      opacity: 0.9;
    }
    .content {
      padding: 28px 32px;
      background: #f0f2f5;
      min-height: calc(100vh - 60px);
    }
    @media (max-width: 768px) {
      .hotel-name { display: none; }
      .user-name { display: none; }
      .content { padding: 16px; }
    }
  `,
})
export class FrontDeskLayoutComponent {
  authService = inject(AuthService);

  userName = () => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  };
}
