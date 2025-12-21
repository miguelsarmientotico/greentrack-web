import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; // Para avisar
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // 1. ¿Está logueado? Si no, fuera.
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // 2. Obtener el rol que requiere la ruta (definido en app.routes.ts)
  const expectedRole = route.data['role'];

  // 3. Obtener el rol real del usuario desde el token
  const userRole = authService.userRole();

  // 4. Comparar
  if (userRole === expectedRole) {
    return true; // Pasa, tiene el rol correcto
  }

  // 5. Fallo de seguridad: Tiene token pero no el rol
  snackBar.open('Acceso denegado: No tienes permisos de Administrador', 'Cerrar', {
    duration: 3000,
    panelClass: ['error-snackbar']
  });

  // Redirigir a una ruta segura para su rol (ej. Dashboard general)
  router.navigate(['/dashboard']);

  return false;
};
