import { Component, computed, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models';
import { UserProfileDialogComponent } from '../header/user-profile-dialog.component';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles: UserRole[];
  children?: { label: string; route: string }[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatDialogModule,
  ],
  template: `
    <div class="sidebar-header">
               <img src="./dashboard-logo.png" alt="">

    </div>

    <mat-divider />

    <mat-nav-list>
      @for (item of visibleNavItems(); track item.label) {
        @if (item.children) {
          <mat-expansion-panel class="nav-expansion" [class.mat-elevation-z0]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </mat-panel-title>
            </mat-expansion-panel-header>
            @for (child of item.children; track child.label) {
              <a
                mat-list-item
                [routerLink]="child.route"
                routerLinkActive="active-link"
                (click)="menuItemClick.emit()"
              >
                {{ child.label }}
              </a>
            }
          </mat-expansion-panel>
        } @else {
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active-link"
            (click)="menuItemClick.emit()"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      }
    </mat-nav-list>

    <div class="sidebar-footer">
      <mat-divider />
      <mat-nav-list>
        <a mat-list-item (click)="openProfileModal()" class="clickable-item">
          <mat-icon matListItemIcon>person</mat-icon>
          <span>Profile</span>
        </a>
        <a mat-list-item (click)="onLogout()">
          <mat-icon matListItemIcon>logout</mat-icon>
          <span>Logout</span>
        </a>
      </mat-nav-list>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: #ffffff;
    }

    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    
    mat-nav-list {
      flex: 1;
    }

    mat-nav-list a {
      color: #ffffff !important;
    }

    mat-nav-list a mat-icon {
      color: #ffffff !important;
    }

    mat-nav-list a span {
      color: #ffffff !important;
    }

    .active-link {
      background: rgba(196, 30, 58, 0.3) !important;
      color: #FFD700 !important;
      border-left: 3px solid #C41E3A;
    }

    .active-link mat-icon,
    .active-link span {
      color: #FFD700 !important;
    }

    .nav-expansion {
      background: transparent !important;
      color: #ffffff !important;
      --mat-list-list-item-label-text-color: #ffffff;
      --mat-sys-on-surface: #ffffff;
    }

    .nav-expansion mat-panel-title {
      color: #ffffff !important;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-expansion mat-panel-title mat-icon {
      color: #ffffff !important;
    }

    .nav-expansion mat-panel-title span {
      color: #ffffff !important;
    }

    .nav-expansion a {
      color: #ffffff !important;
      --mat-list-list-item-label-text-color: #ffffff !important;
    }

    .nav-expansion a span {
      color: #ffffff !important;
    }

    .nav-expansion ::ng-deep .mdc-list-item__content {
      color: #ffffff !important;
    }

    .nav-expansion ::ng-deep .mdc-list-item {
      color: #ffffff !important;
    }

    .nav-expansion ::ng-deep .mat-mdc-list-item {
      --mdc-theme-text-primary-on-background: #ffffff;
      --mdc-typography-body2-color: #ffffff;
    }

    ::ng-deep .nav-expansion a {
      color: #ffffff !important;
    }

    ::ng-deep .nav-expansion .mdc-list-item__primary-text {
      color: #ffffff !important;
    }

    .clickable-item {
      cursor: pointer;
    }

    .sidebar-footer {
      margin-top: auto;
    }
  `,
})
export class SidebarComponent {
  menuItemClick = output<void>();

  constructor(private authService: AuthService, private dialog: MatDialog) {}

  private navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'super_admin'],
    },
    {
      label: 'Guest Registration',
      icon: 'edit_note',
      route: '/guest-registration',
      roles: ['front_desk', 'super_admin'],
    },
    {
      label: 'My Registrations',
      icon: 'assignment',
      route: '/my-registrations',
      roles: ['front_desk'],
    },
    {
      label: 'Guests',
      icon: 'groups',
      roles: ['admin', 'super_admin'],
      children: [
        { label: 'All Guests', route: '/guests' },
        { label: 'Today', route: '/guests/today' },
        { label: 'This Week', route: '/guests/week' },
        { label: 'This Month', route: '/guests/month' },
      ],
    },
    {
      label: 'Front Desk Activity',
      icon: 'work_history',
      roles: ['admin', 'super_admin'],
      children: [
        { label: 'Today', route: '/activity/today' },
        { label: 'This Week', route: '/activity/week' },
        { label: 'This Month', route: '/activity/month' },
        { label: 'This Year', route: '/activity/year' },
      ],
    },
    {
      label: 'User Management',
      icon: 'manage_accounts',
      roles: ['super_admin'],
      children: [
        { label: 'All Users', route: '/users' },
        { label: 'Add User', route: '/users/add' },
      ],
    },
    {
      label: 'Room Types',
      icon: 'hotel',
      route: '/room-types',
      roles: ['super_admin'],
    },
    {
      label: 'Policy Management',
      icon: 'policy',
      route: '/policies',
      roles: ['super_admin'],
    },
    {
      label: 'Hotel Settings',
      icon: 'settings',
      route: '/settings',
      roles: ['super_admin'],
    },
  ];

  visibleNavItems = computed(() =>
    this.navItems.filter((item) => this.authService.hasRole(...item.roles))
  );

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
