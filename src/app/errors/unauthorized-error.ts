import { ApiHttpError } from './api-http-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents HTTP 401 (Unauthorized) errors coming from the backend.
 *
 * @remarks
 * Typically indicates an expired session or missing authentication.
 */
export class UnauthorizedError extends ApiHttpError {
  /**
   * Creates a new {@link UnauthorizedError}.
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
      name: 'UnauthorizedError',
      userMessage: params.userMessage,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      isRetryable: false,
      status: 401,
      statusText: params.statusText,
      url: params.url,
      method: params.method,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

