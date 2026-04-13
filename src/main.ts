import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

// Register service worker for PWA support
if (environment.production && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ngsw-worker.js').catch((err) => {
    console.error('Service Worker registration failed:', err);
  });
}
