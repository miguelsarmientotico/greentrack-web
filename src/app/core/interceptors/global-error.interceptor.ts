import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { HttpErrorInfo } from '../models/http-error-info';
import { NotificationService } from '../services/notification.service';

export const globalErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      const apiError = error.error as HttpErrorInfo;

      const errorMessage = apiError?.message || error.message || 'Error desconocido';
      const path = apiError?.path || req.url;

      console.warn(`⛔ API ERROR en [${path}]: ${errorMessage}`);

      switch (error.status) {
        case HttpStatusCode.BadRequest: // 400
          console.error('⚠️ Datos inválidos (Bad Request):', errorMessage);
          notifier.warning(errorMessage);
          break;

        case HttpStatusCode.Unauthorized: // 401
          console.error('⛔ Sesión expirada. Redirigir al login.');
          break;

        case HttpStatusCode.Forbidden: // 403
          console.error('⛔ Acceso denegado:', errorMessage);
          notifier.error('No tienes permisos.');
          break;

        case HttpStatusCode.NotFound: // 404
          console.error('🔍 Recurso no encontrado:', errorMessage);
          notifier.info(errorMessage);
          break;

        case HttpStatusCode.InternalServerError: // 500
          console.error('🔥 Error del servidor:', errorMessage);
          break;

        case 0:
          console.error('📡 Error de conexión. Verifica tu internet o el backend.');
          break;

        default:
          console.error(`Error no manejado (${error.status}):`, errorMessage);
      }

      return throwError(() => apiError || error);
    })
  );
};
