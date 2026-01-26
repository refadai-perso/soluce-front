import { ApiHttpError } from './api-http-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Represents HTTP 5xx (Server Error) responses coming from the backend.
 *
 * @remarks
 * Indicates an unexpected backend failure. Retrying may succeed later.
 */
export class ServerError extends ApiHttpError {
  /**
   * Creates a new {@link ServerError}.
   *
   * @param params Initialization parameters.
   * @param params.status Actual HTTP 5xx status code.
   * @param params.userMessage Safe, user-facing message.
   * @param params.statusText Status text (browser-dependent).
   * @param params.url Request URL.
   * @param params.method HTTP method.
   * @param params.backendBody Raw backend payload.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   */
  public constructor(params: {
    readonly status: number;
    readonly userMessage: string;
    readonly statusText: string;
    readonly url: string;
    readonly method: string;
    readonly backendBody: unknown;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super({
      name: 'ServerError',
      userMessage: params.userMessage,
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.CRITICAL,
      isRetryable: true,
      status: params.status,
      statusText: params.statusText,
      url: params.url,
      method: params.method,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }
}

