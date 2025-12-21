import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'accessToken';
  private http = inject(HttpClient);
  private authUrl = inject(APP_SETTINGS).apiUrl + '/auth/login';

  private accessToken = signal<string>(localStorage.getItem(this.TOKEN_KEY) || '');

  userRole = computed(() => {
    const token = this.accessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return `ROLE_${decoded.role}` || null;
    } catch (e) {
      return null;
    }
  });

  isLoggedIn = computed(() => !!this.accessToken());

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.authUrl, { username, password }).pipe(
      tap(response => {
        const token = response.accessToken;
        this.accessToken.set(token);
        localStorage.setItem(this.TOKEN_KEY, token);
      })
    );
  }

  logout() {
    this.accessToken.set('');
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string {
    return this.accessToken();
  }

  hasRole(expectedRole: string): boolean {
    return this.userRole() === expectedRole;
  }
}
