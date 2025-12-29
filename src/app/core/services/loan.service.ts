import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, of, map } from 'rxjs';

import { Loan } from '../models/Loan';
import { Pagination } from '../models/Pagination';
import { LoanFilter } from '../models/loan-filter.model';
import { APP_SETTINGS } from '../config/app.settings';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class LoanService {

  private settings = inject(APP_SETTINGS);
  private http = inject(HttpClient);
  private notifier = inject(NotificationService);

  private loansUrl = `${this.settings.apiUrl}/loans`;

  // --- STATE MANAGEMENT ---
  // Guardamos la paginación completa (content, totalElements, etc.)
  private loansState = new BehaviorSubject<Pagination<Loan> | null>(null);

  // Selector del estado completo
  public state$ = this.loansState.asObservable();

  // Selector para la tabla (Array de préstamos)
  public loans$ = this.loansState.pipe(
    map(pagination => pagination?.content || [])
  );

  // Selector para el paginador (Total de elementos)
  public totalLoans$ = this.loansState.pipe(
    map(pagination => pagination?.totalElements || 0)
  );

  // Selector para el total de páginas
  public totalPages$ = this.loansState.pipe(
    map(pagination => pagination?.totalPages || 0)
  );

  // --- API METHODS ---

  getLoans(filter: LoanFilter = {}, page: number = 0, size: number = 10): Observable<Pagination<Loan>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'id,desc'); // Orden por defecto para préstamos

    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof LoanFilter];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<Pagination<Loan>>(this.loansUrl, { params }).pipe(
      tap(response => {
        // Actualizamos el estado con la nueva página obtenida
        this.loansState.next(response);
      })
    );
  }

  getLoan(id: string, forceRefresh: boolean = false): Observable<Loan> {
    if (!forceRefresh) {
      // Buscamos en el estado actual si ya tenemos el préstamo en memoria
      const cachedLoan = this.loansState.getValue()?.content?.find(l => l.id === id);
      if (cachedLoan) {
        return of(cachedLoan);
      }
    }
    return this.http.get<Loan>(`${this.loansUrl}/${id}`);
  }

  addLoan(newLoan: Partial<Loan>): Observable<Loan> {
    return this.http.post<Loan>(this.loansUrl, newLoan).pipe(
      tap(() => {
        // Igual que en DeviceService: No actualizamos el estado manual
        // porque el nuevo item podría ir en otra página.
        // El componente llamará a getLoans() tras el éxito.
        this.notifier.success("Préstamo registrado exitosamente!");
      })
    );
  }

  updateLoan(id: string, loanData: Partial<Loan>): Observable<Loan> {
    return this.http.patch<Loan>(`${this.loansUrl}/${id}`, loanData).pipe(
      tap(updatedLoan => {
        const currentState = this.loansState.getValue();

        if (!currentState) return; // Seguridad

        const updatedList = currentState.content.map(l =>
          l.id === id ? updatedLoan : l
        );

        // Emitimos nuevo estado conservando la info de paginación
        this.loansState.next({
          ...currentState,
          content: updatedList
        });
      }),
      tap(() => this.notifier.success("Préstamo actualizado exitosamente!"))
    );
  }

  deleteLoan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.loansUrl}/${id}`).pipe(
      tap(() => {
        const currentState = this.loansState.getValue();

        if (!currentState) return;

        // 1. Filtramos el item eliminado
        const filteredList = currentState.content.filter(l => l.id !== id);

        // 2. Actualizamos estado y reducimos el contador total
        this.loansState.next({
          ...currentState,
          content: filteredList,
          totalElements: currentState.totalElements - 1
        });
      }),
      tap(() => this.notifier.success("Préstamo eliminado exitosamente!"))
    );
  }

  // Método específico de Loan, tratado como un Update
  returnLoan(id: string): Observable<Loan> {
    return this.http.patch<Loan>(`${this.loansUrl}/${id}/return`, {}).pipe(
      tap(returnedLoan => {
        const currentState = this.loansState.getValue();

        if (!currentState) return;

        const updatedList = currentState.content.map(l =>
          l.id === id ? returnedLoan : l
        );

        this.loansState.next({
          ...currentState,
          content: updatedList
        });
      }),
      tap(() => this.notifier.success("Equipo devuelto exitosamente!"))
    );
  }
}
