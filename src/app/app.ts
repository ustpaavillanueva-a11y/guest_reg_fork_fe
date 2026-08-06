import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RealtimeService } from './core/services/realtime.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private realtime = inject(RealtimeService);

  constructor() {
    // Covers hard refresh / deep link where a token already exists in
    // localStorage. No-ops under SSR and when there's no stored token.
    this.realtime.connect();
  }
}
