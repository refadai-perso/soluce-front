import { ApiHttpError } from './api-http-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents HTTP 404 (Not Found) errors coming from the backend.
 *
 * @remarks
 * Indicates the requested resource does not exist or is not visible to the user.
 */
export class NotFoundError extends ApiHttpError {
  /**
   * Creates a new {@link NotFoundError}.
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
      name: 'NotFoundError',
      userMessage: params.userMessage,
      category: ErrorCategory.NOT_FOUND,
      severity: ErrorSeverity.WARNING,
      isRetryable: false,
      status: 404,
      statusText: params.statusText,
      url: params.url,
      method: params.method,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

