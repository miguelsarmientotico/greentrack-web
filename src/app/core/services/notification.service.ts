import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  constructor() { }

  success(message: string) {
    this.show(message, 'success-snackbar');
  }

  error(message: string) {
    this.show(message, 'error-snackbar');
  }

  info(message: string) {
    this.show(message, 'info-snackbar');
  }

  warning(message: string) {
    this.show(message, 'warning-snackbar');
  }

  private show(message: string, panelClass: string) {
    const config: MatSnackBarConfig = {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass]
    };
    this.snackBar.open(message, 'Cerrar', config);
  }
}
