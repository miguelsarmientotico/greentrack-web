import { HttpClient, HttpParams, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Loan, LoanStatusEnum } from '../models/Loan';
import { Observable, map, of, tap, catchError, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app.settings';
import { Pagination } from '../models/Pagination';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private loansUrl = inject(APP_SETTINGS).apiUrl + '/loans';
  private loans: Loan[] = [];

  constructor(private http: HttpClient) { }

  getLoans(page?: number, limit?: number): Observable<Pagination<Loan>> {
    const options = new HttpParams()
    .set('page', page || 1)
    .set('limit', limit || 10);
    return this.http.get<Pagination<Loan>>(this.loansUrl, {
      params: options
    }).pipe(
        catchError(this.handleError)
      );
  }

  getLoan(id: string): Observable<Loan> {
    const loan = this.loans.find(p => p.id === id);
    return of(loan!);
  }

  addLoan(newLoan: Partial<Loan>): Observable<Loan> {
    return this.http.post<Loan>(this.loansUrl, newLoan).pipe(
      map(loan => {
        console.log(loan);
        this.loans.push(loan);
        return loan;
      })
    );
  }

  updateLoan(id: string, loanData: Partial<Loan>): Observable<Loan> {
    return this.http.patch<Loan>(`${this.loansUrl}/${id}`, {
      ...loanData
    }).pipe(
        map(loan => {
          const index = this.loans.findIndex(p => p.id === id);
          this.loans[index] = {
            ...this.loans[index],
            ...loanData
          }
          return loan;
        })
      );
  }

  deleteLoan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.loansUrl}/${id}`).pipe(
      tap(() => {
        const index = this.loans.findIndex(p => p.id === id);
        this.loans.splice(index, 1);
      })
    );
  }

  returnLoan(id: string): Observable<Loan> {
    return this.http.patch<Loan>(`${this.loansUrl}/${id}/return`, {}).pipe(
      tap(() => {
        const index = this.loans.findIndex(p => p.id === id);
        this.loans[index] = {
          ...this.loans[index],
          loanStatus: LoanStatusEnum.DEVUELTO
        }
      }),
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
