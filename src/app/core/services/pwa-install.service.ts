import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  canInstall = signal(false);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private deferredPrompt: any;

  constructor() {
    if (this.isBrowser) {
      this.setupPwaPrompt();
    }
  }

  private setupPwaPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      console.log('App installed successfully');
    });
  }

  async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      alert('App installation is not available. Please use your browser menu or install from home screen.');
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.canInstall.set(false);
    }
  }
}
