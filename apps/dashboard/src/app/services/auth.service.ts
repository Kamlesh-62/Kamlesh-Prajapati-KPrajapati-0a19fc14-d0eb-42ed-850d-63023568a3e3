import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, of, switchMap, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse, AuthUser } from '../models/auth.models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<AuthUser | null>(this.loadUser());
  private readonly tokenSignal = signal<string | null>(this.loadToken());
  private csrfReady = false;

  readonly user = computed(() => this.userSignal());
  readonly token = computed(() => this.tokenSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  login(email: string, password: string) {
    return this.ensureCsrf().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
          email,
          password,
        })
      )
    );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    organizationId: string;
  }) {
    return this.ensureCsrf().pipe(
      switchMap(() =>
        this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload)
      )
    );
  }

  handleLoginSuccess(response: AuthResponse) {
    this.setSession(response);
    this.router.navigateByUrl('/tasks');
  }

  logout() {
    this.clearSession();
    this.router.navigateByUrl('/login');
  }

  private setSession(response: AuthResponse) {
    this.tokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private clearSession() {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private loadToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private ensureCsrf() {
    if (this.csrfReady) return of(null);
    return this.http.get<{ csrfToken: string | null }>(`${API_BASE_URL}/auth/csrf`).pipe(
      tap(() => {
        this.csrfReady = true;
      }),
      map(() => null)
    );
  }
}
