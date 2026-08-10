import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    SidebarComponent,
    HeaderComponent,
  ],
  template: `
    <mat-sidenav-container class="main-layout">
      <mat-sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpened()"
        (openedChange)="sidenavOpened.set($event)"
        class="sidenav"
      >
        <app-sidebar (menuItemClick)="onMenuItemClick()" />
      </mat-sidenav>

      <mat-sidenav-content>
        <app-header (toggleSidenav)="toggleSidenav()" />
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .main-layout {
      height: 100vh;
    }

    .sidenav {
      width: 280px;
      background: #1a1a2e;
    }

    .content {
      padding: 24px;
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 960px) {
      .content {
        padding: 16px;
      }
    }
  `,
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  sidenavOpened = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 960px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ matches }) => {
        this.sidenavMode.set(matches ? 'over' : 'side');
        this.sidenavOpened.set(!matches);
      });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((v) => !v);
  }

  onMenuItemClick(): void {
    if (this.sidenavMode() === 'over') {
      this.sidenavOpened.set(false);
    }
  }
}
