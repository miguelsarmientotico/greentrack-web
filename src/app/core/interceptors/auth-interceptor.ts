import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. OMITIR EL LOGIN (Y REGISTRO SI TIENES)
  // Si la URL contiene '/auth/login', pasamos la petición limpia sin tocar nada.
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // 2. VALIDAR EL TOKEN
  // Asegurarse que existe y no es basura antes de enviarlo
  if (token && token.trim() !== '') {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('authReq', authReq);
    return next(authReq);
  }

  return next(req);
};
