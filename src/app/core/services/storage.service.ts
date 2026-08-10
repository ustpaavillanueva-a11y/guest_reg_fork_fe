import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../models';

const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SESSION_ID: 'sessionId',
  USER: 'user',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getAccessToken(): string | null {
    return this.isBrowser ? localStorage.getItem(KEYS.ACCESS_TOKEN) : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem(KEYS.REFRESH_TOKEN) : null;
  }

  getSessionId(): string | null {
    return this.isBrowser ? localStorage.getItem(KEYS.SESSION_ID) : null;
  }

  getUser(): User | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  setAuth(accessToken: string, refreshToken: string, sessionId: string, user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.SESSION_ID, sessionId);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  setAccessToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(KEYS.ACCESS_TOKEN, token);
  }

  setUser(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  clear(): void {
    if (!this.isBrowser) return;
    localStorage.clear();
  }
}
