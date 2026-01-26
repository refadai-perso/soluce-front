import { AppError } from './app-error';
import { ErrorCategory } from './error-category';
import { ErrorSeverity } from './error-severity';

/**
 * Base class for HTTP errors coming from the backend.
 */
export abstract class ApiHttpError extends AppError {
  /**
   * HTTP status code (e.g., 400, 401, 500).
   */
  public readonly status: number;
  /**
   * HTTP status text when available (browser-dependent).
   */
  public readonly statusText: string;
  /**
   * Request URL (including query string when available).
   */
  public readonly url: string;
  /**
   * HTTP method (GET/POST/PATCH/DELETE).
   */
  public readonly method: string;
  /**
   * Raw backend payload returned with the error (shape may vary).
   */
  public readonly backendBody: unknown;

  /**
   * Creates a new {@link ApiHttpError}.
   *
   * @param params Initialization parameters.
   */
  public constructor(params: {
    readonly name: string;
    readonly userMessage: string;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly isRetryable: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly url: string;
    readonly method: string;
    readonly backendBody: unknown;
    readonly correlationId?: string;
    readonly cause?: unknown;
  }) {
    super({
      name: params.name,
      userMessage: params.userMessage,
      category: params.category,
      severity: params.severity,
      isRetryable: params.isRetryable,
      correlationId: params.correlationId,
      cause: params.cause
    });
    this.status = params.status;
    this.statusText = params.statusText;
    this.url = params.url;
    this.method = params.method;
    this.backendBody = params.backendBody;
  }
}

