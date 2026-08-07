import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, EMPTY } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private storage = inject(StorageService);
  private socket: Socket | null = null;

  connect(): void {
    if (!this.isBrowser || this.socket?.connected) return;

    const token = this.storage.getAccessToken();
    if (!token) return;

    this.socket = io(environment.wsUrl, {
      // Callback form: re-reads the token from storage on every (re)connect
      // attempt, so a refreshed access token is picked up automatically.
      auth: (cb) => cb({ token: this.storage.getAccessToken() }),
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on<T = unknown>(event: string): Observable<T> {
    if (!this.isBrowser) return EMPTY;
    if (!this.socket) this.connect();
    if (!this.socket) return EMPTY;

    const socket = this.socket;
    return new Observable<T>((subscriber) => {
      const handler = (payload: T) => subscriber.next(payload);
      socket.on(event, handler);
      return () => socket.off(event, handler);
    });
  }
}
