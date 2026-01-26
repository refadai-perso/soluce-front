import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

import { ErrorService } from '../services/error.service';
import { NotificationService } from '../services/notification.service';
import { AppError } from '../errors/app-error';
import { UnauthorizedError } from '../errors/unauthorized-error';
import { LocaleService } from '../services/locale.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from './skip-global-error-handling.token';

/**
 * Global HTTP interceptor converting failures into {@link AppError} and surfacing them to the user.
 *
 * @remarks
 * - Converts any {@link HttpErrorResponse} to a typed {@link AppError} via {@link ErrorService}.
 * - Shows a toast via {@link NotificationService}.
 * - Redirects to login on {@link UnauthorizedError}.
 * - Can be disabled per-request using {@link SKIP_GLOBAL_ERROR_HANDLING}.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next): Observable<HttpEvent<unknown>> => {
  // Resolve dependencies via Angular DI (functional interceptor style).
  const errorService: ErrorService = inject(ErrorService);
  const notificationService: NotificationService = inject(NotificationService);
  const localeService: LocaleService = inject(LocaleService);

  // Allow callers to opt out of global toasts/redirects for expected failures (e.g., whoami on startup).
  if (req.context.get(SKIP_GLOBAL_ERROR_HANDLING) === true) {
    return next(req);
  }

  // Forward the request and convert any downstream failure into a typed AppError with user feedback.
  return next(req).pipe(
    catchError((err: unknown): Observable<never> => {
      // Best-effort correlation id extraction for troubleshooting (header name can be adjusted to backend).
      const correlationId: string | undefined = err instanceof HttpErrorResponse ? err.headers?.get('x-correlation-id') ?? undefined : undefined;

      // Map low-level error shapes into a stable error hierarchy, enriched with request metadata.
      const appError: AppError = errorService.createAppError(err, req, correlationId);

      // Show a consistent toast for all errors (message is already i18n-ready via ErrorService).
      notificationService.showErrorFromAppError(appError);

      // For expired/missing sessions, navigate to login (localized route).
      if (appError instanceof UnauthorizedError) {
        void localeService.navigateWithLocale(['login']);
      }

      // Re-throw as AppError so components can still handle it (e.g., instanceof ValidationError).
      return throwError((): unknown => appError);
    })
  );
};

