import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'accessToken';

  private accessToken = signal<string>(localStorage.getItem(this.TOKEN_KEY) || '');

  private authUrl = inject(APP_SETTINGS).apiUrl + '/auth/login';

  isLoggedIn = computed(() => this.accessToken() !== '');

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<string> {
    return this.http.post<string>(this.authUrl, { // Ajusté la URL aquí
      username, password
    }).pipe(
      tap(token => {
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

}
