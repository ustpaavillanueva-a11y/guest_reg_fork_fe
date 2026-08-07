import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (pwaInstall.canInstall() && !dismissed()) {
      <div class="pwa-banner">
        <mat-icon>install_mobile</mat-icon>
        <span class="pwa-banner-text">Install this app on your device for quick, offline-ready access.</span>
        <button mat-raised-button color="accent" (click)="install()">Install</button>
        <button mat-icon-button (click)="dismiss()" aria-label="Dismiss">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }
  `,
  styles: `
    .pwa-banner {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #1a1a2e;
      color: #ffffff;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.25);

      mat-icon:first-child {
        color: #C41E3A;
        flex-shrink: 0;
      }
    }

    .pwa-banner-text {
      flex: 1;
      font-size: 14px;
    }

    .pwa-banner button[mat-icon-button] {
      color: #ffffff;
      flex-shrink: 0;
    }
  `,
})
export class PwaInstallBannerComponent {
  dismissed = signal(false);

  constructor(public pwaInstall: PwaInstallService) {}

  install(): void {
    this.pwaInstall.installApp();
  }

  dismiss(): void {
    this.dismissed.set(true);
  }
}
