import { HttpClient, HttpParams, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { User } from '../models/User';
import { Observable, map, of, tap, catchError, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';
import { Pagination } from '../models/Pagination';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersUrl = inject(APP_SETTINGS).apiUrl + '/users';
  private users: User[] = [];

  constructor(private http: HttpClient) { }

  getUsers(page?: number, limit?: number): Observable<Pagination<User>> {
    const options = new HttpParams()
    .set('page', page || 1)
    .set('limit', limit || 10);
    return this.http.get<Pagination<User>>(this.usersUrl, {
      params: options
    }).pipe(
        catchError(this.handleError)
      );
  }

  getUser(id: string): Observable<User> {
    const user = this.users.find(p => p.id === id);
    return of(user!);
  }

  addUser(newUser: Partial<User>): Observable<User> {
    return this.http.post<User>(this.usersUrl, newUser).pipe(
      map(user => {
        this.users.push(user);
        return {
          ...user,
          userStatus: 'ACTIVO'
        };
      })
    );
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.usersUrl}/${id}`, {
      ...userData
    }).pipe(
      map(user => {
        const index = this.users.findIndex(p => p.id === id);
        this.users[index] = {
            ...this.users[index],
            ...userData
        }
        return user;
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`).pipe(
      tap(() => {
        const index = this.users.findIndex(p => p.id === id);
        this.users.splice(index, 1);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let message = '';

    switch(error.status) {
      case 0:
        message = 'Client error';
        break;
      case HttpStatusCode.InternalServerError:
        message = 'Server error';
        break;
      case HttpStatusCode.BadRequest:
        message = 'Request error';
        break;
      default:
        message = 'Unknown error';
    }

    console.error(message, error.error);

    return throwError(() => error);
  }

}
