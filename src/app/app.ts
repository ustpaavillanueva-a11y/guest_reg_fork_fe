import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RealtimeService } from './core/services/realtime.service';
import { AuthService } from './core/services/auth.service';
import { PwaInstallBannerComponent } from './shared/components/pwa-install-banner/pwa-install-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private realtime = inject(RealtimeService);
  private authService = inject(AuthService);

  constructor() {
    // Covers hard refresh / deep link where a token already exists in
    // localStorage. No-ops under SSR and when there's no stored token.
    this.realtime.connect();

    // Re-sync the cached user (localStorage, possibly stale/from an older
    // app version) with the server on every app boot, so fields added after
    // the user's last login - like their signature - show up without
    // needing to log out and back in.
    if (this.authService.isAuthenticated()) {
      this.authService.getProfile().subscribe({ error: () => {} });
    }
  }
}
