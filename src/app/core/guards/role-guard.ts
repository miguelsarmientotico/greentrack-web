import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const expectedRole = route.data['role'];

  const userRole = authService.userRole();

  if (userRole === expectedRole) {
    return true;
  }

  snackBar.open('Acceso denegado: No tienes permisos de Administrador', 'Cerrar', {
    duration: 3000,
    panelClass: ['error-snackbar']
  });

  router.navigate(['/dashboard']);

  return false;
};
