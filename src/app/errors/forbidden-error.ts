import { ApiHttpError } from './api-http-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents HTTP 403 (Forbidden) errors coming from the backend.
 *
 * @remarks
 * Typically indicates the user is authenticated but not authorized for the requested action.
 */
export class ForbiddenError extends ApiHttpError {
  /**
   * Creates a new {@link ForbiddenError}.
   *
   * @param params Initialization parameters.
   * @param params.userMessage Safe, user-facing message.
   * @param params.statusText Status text (browser-dependent).
   * @param params.url Request URL.
   * @param params.method HTTP method.
   * @param params.backendBody Raw backend payload.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: {
    readonly userMessage: string;
    readonly statusText: string;
    readonly url: string;
    readonly method: string;
    readonly backendBody: unknown;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super({
      name: 'ForbiddenError',
      userMessage: params.userMessage,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.ERROR,
      isRetryable: false,
      status: 403,
      statusText: params.statusText,
      url: params.url,
      method: params.method,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

