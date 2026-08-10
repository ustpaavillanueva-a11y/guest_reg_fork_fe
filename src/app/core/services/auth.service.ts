import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { RealtimeService } from './realtime.service';
import { LoginRequest, LoginResponse, LogoutRequest, User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);
  private api = inject(ApiService);
  private router = inject(Router);
  private realtime = inject(RealtimeService);

  private currentUser = signal<User | null>(this.storage.getUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  constructor() {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        this.storage.setAuth(res.accessToken, res.refreshToken, res.sessionId, res.user);
        this.currentUser.set(res.user);
        this.realtime.connect();
      })
    );
  }

  logout(): void {
    const sessionId = this.storage.getSessionId();
    if (sessionId) {
      this.api.post('/auth/logout', { sessionId } as LogoutRequest).subscribe();
    }
    this.storage.clear();
    this.currentUser.set(null);
    this.realtime.disconnect();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.storage.getRefreshToken();
    return this.api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => this.storage.setAccessToken(res.accessToken))
    );
  }

  getProfile(): Observable<User> {
    return this.api.get<User>('/auth/profile').pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.storage.setUser(user);
      })
    );
  }

  updateSignature(signature: string): Observable<User> {
    return this.api.patch<User>('/auth/profile', { signature }).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.storage.setUser(user);
      })
    );
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  getRedirectPath(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case 'front_desk':
        return '/guest-registration';
      case 'admin':
      case 'super_admin':
        return '/dashboard';
      default:
        return '/login';
    }
  }
}
