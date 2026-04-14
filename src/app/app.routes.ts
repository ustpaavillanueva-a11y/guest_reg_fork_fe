import { Routes, CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthService } from './core/services/auth.service';
import { UserRole } from './core/models';

function roleMatch(...roles: UserRole[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    return auth.hasRole(...roles);
  };
}

export const routes: Routes = [
  // Auth layout (no sidebar)
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Front Desk layout (no sidebar) - Front Desk only
  {
    path: '',
    canActivate: [authGuard],
    canMatch: [roleMatch('front_desk')],
    loadComponent: () =>
      import('./layouts/front-desk-layout/front-desk-layout.component').then((m) => m.FrontDeskLayoutComponent),
    children: [
      {
        path: 'guest-registration',
        loadComponent: () =>
          import('./features/front-desk/guest-registration/guest-registration.component').then((m) => m.GuestRegistrationComponent),
      },
      {
        path: 'guest-registration/pdf-upload',
        loadComponent: () =>
          import('./features/front-desk/guest-registration/pdf-upload.component').then((m) => m.PdfUploadComponent),
      },
      {
        path: 'guest-registration/signature',
        loadComponent: () =>
          import('./features/front-desk/guest-registration/guest-registration.component').then((m) => m.GuestRegistrationComponent),
      },
      {
        path: 'my-registrations',
        loadComponent: () =>
          import('./features/front-desk/my-registrations/my-registrations.component').then((m) => m.MyRegistrationsComponent),
      },
      {
        path: 'registration/:id',
        loadComponent: () =>
          import('./features/front-desk/registration-pdf/registration-pdf.component').then((m) => m.RegistrationPdfComponent),
      },
    ],
  },

  // Main layout (with sidebar) - Admin & Super Admin
  {
    path: '',
    canActivate: [authGuard],
    canMatch: [roleMatch('admin', 'super_admin')],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      // Guest Registration - Super Admin
      {
        path: 'guest-registration',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/front-desk/guest-registration/guest-registration.component').then((m) => m.GuestRegistrationComponent),
      },

      // PDF Upload - Super Admin
      {
        path: 'guest-registration/pdf-upload',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/front-desk/guest-registration/pdf-upload.component').then((m) => m.PdfUploadComponent),
      },

      // Guest Registration Signature - Super Admin
      {
        path: 'guest-registration/signature',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/front-desk/guest-registration/guest-registration.component').then((m) => m.GuestRegistrationComponent),
      },

      // Registration PDF View
      {
        path: 'registration/:id',
        loadComponent: () =>
          import('./features/front-desk/registration-pdf/registration-pdf.component').then((m) => m.RegistrationPdfComponent),
      },

      // Guest List
      {
        path: 'guests',
        loadComponent: () => import('./features/admin/guest-list/guest-list.component').then((m) => m.GuestListComponent),
      },
      {
        path: 'guests/:period',
        loadComponent: () => import('./features/admin/guest-list/guest-list.component').then((m) => m.GuestListComponent),
      },

      // Front Desk Activity
      {
        path: 'activity/:period',
        loadComponent: () =>
          import('./features/admin/front-desk-activity/front-desk-activity.component').then((m) => m.FrontDeskActivityComponent),
      },

      // User Management - Super Admin
      {
        path: 'users',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/super-admin/user-management/user-management.component').then((m) => m.UserManagementComponent),
      },
      {
        path: 'users/add',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/super-admin/user-management/user-management.component').then((m) => m.UserManagementComponent),
      },

      // Room Types - Super Admin
      {
        path: 'room-types',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/super-admin/room-types/room-types.component').then((m) => m.RoomTypesComponent),
      },

      // Policies - Super Admin
      {
        path: 'policies',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/super-admin/policies/policies.component').then((m) => m.PoliciesComponent),
      },

      // Hotel Settings - Super Admin
      {
        path: 'settings',
        canActivate: [roleGuard('super_admin')],
        loadComponent: () =>
          import('./features/super-admin/settings/hotel-settings.component').then((m) => m.HotelSettingsComponent),
      },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: 'login' },
];
