import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';
import { DashboardSummary } from '../models/Dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Asegúrate de que APP_SETTINGS esté bien configurado en tu app
  private dashboardUrl = inject(APP_SETTINGS).apiUrl + '/dashboard';

  constructor(private http: HttpClient) { }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.dashboardUrl).pipe(
      catchError(error => {
        console.error('Error obteniendo dashboard:', error);
        return throwError(() => error);
      })
    );
  }
}
