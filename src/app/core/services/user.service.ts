import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, of, map } from 'rxjs';

import { User } from '../models/User';
import { Pagination } from '../models/Pagination';
import { UserFilter } from '../models/user-filter.model';
import { APP_SETTINGS } from '../config/app.settings';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private settings = inject(APP_SETTINGS);
  private http = inject(HttpClient);
  private notifier = inject(NotificationService);

  private usersUrl = `${this.settings.apiUrl}/users`;

  // --- STATE MANAGEMENT ---
  // Guardamos la paginación completa, no solo el array
  private usersState = new BehaviorSubject<Pagination<User> | null>(null);

  // Selector del estado completo (útil para debug o casos avanzados)
  public state$ = this.usersState.asObservable();

  // Selector para la tabla (Array de usuarios)
  public users$ = this.usersState.pipe(
    map(pagination => pagination?.content || [])
  );

  // Selector para el paginador (Total de elementos)
  public totalUsers$ = this.usersState.pipe(
    map(pagination => pagination?.totalElements || 0)
  );

  // Selector para el total de páginas
  public totalPages$ = this.usersState.pipe(
    map(pagination => pagination?.totalPages || 0)
  );

  // --- API METHODS ---

  getUsers(filter: UserFilter = {}, page: number = 0, size: number = 10): Observable<Pagination<User>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'id,asc');

    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof UserFilter];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<Pagination<User>>(this.usersUrl, { params }).pipe(
      tap(response => {
        this.usersState.next(response);
      })
    );
  }

  getUser(id: string, forceRefresh: boolean = false): Observable<User> {
    if (!forceRefresh) {
      // Buscamos de forma segura dentro del content del estado actual
      const cachedUser = this.usersState.getValue()?.content?.find(u => u.id === id);
      if (cachedUser) {
        return of(cachedUser);
      }
    }
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }

  addUser(newUser: Partial<User>): Observable<User> {
    return this.http.post<User>(this.usersUrl, newUser).pipe(
      tap(() => {
        // No agregamos manualmente al state local por temas de ordenamiento en paginación.
        // El componente deberá recargar la tabla.
        this.notifier.success("Usuario creado exitosamente!");
      })
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.usersUrl}/${id}`, userData).pipe(
      tap(updatedUser => {
        const currentState = this.usersState.getValue();

        if (!currentState) return; // Seguridad

        const updatedList = currentState.content.map(u =>
          u.id === id ? updatedUser : u
        );

        // Emitimos nuevo estado conservando la info de paginación
        this.usersState.next({
          ...currentState,
          content: updatedList
        });
      }),
      tap(() => this.notifier.success("Usuario actualizado exitosamente!"))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`).pipe(
      tap(() => {
        const currentState = this.usersState.getValue();

        if (!currentState) return;

        // 1. Filtramos
        const filteredList = currentState.content.filter(u => u.id !== id);

        // 2. Actualizamos estado y reducimos el contador total
        this.usersState.next({
          ...currentState,
          content: filteredList,
          totalElements: currentState.totalElements - 1
        });
      }),
      tap(() => this.notifier.success("Usuario eliminado exitosamente!"))
    );
  }
}
