import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

import { AppError } from '../errors/app-error';
import { BadRequestError } from '../errors/bad-request-error';
import { ConflictError } from '../errors/conflict-error';
import { ForbiddenError } from '../errors/forbidden-error';
import { NetworkError } from '../errors/network-error';
import { NotFoundError } from '../errors/not-found-error';
import { ServerError } from '../errors/server-error';
import { UnauthorizedError } from '../errors/unauthorized-error';
import { UnexpectedError } from '../errors/unexpected-error';
import { ValidationError } from '../errors/validation-error';
import { FieldError } from '../errors/field-error';

/**
 * Normalized backend error body extracted from the raw HTTP payload.
 *
 * @remarks
 * NestJS commonly returns `{ statusCode, message, error }` for {@link HttpErrorResponse#error}.
 * Some backends (or custom exception filters) may also return extra details (often under a key like `errors`).
 *
 * This type uses clearer property names:
 * - `errorSummary` maps the backend's `error` field (short description, e.g. "Bad Request")
 * - `details` maps the backend's `errors` (optional, non-standard) for structured validation errors
 */
type BackendErrorBody = {
  readonly statusCode?: number;
  readonly message?: string | string[];
  readonly errorSummary?: string;
  readonly details?: unknown;
};

/**
 * Maps low-level HTTP/network errors into typed {@link AppError} instances.
 *
 * @remarks
 * This service is used by the global HTTP interceptor to:
 * - convert {@link HttpErrorResponse} into consistent error subclasses
 * - extract safe, user-friendly messages
 * - keep backend payload available for debugging when needed
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  /**
   * Converts any error into an {@link AppError} (typed when possible).
   *
   * @param error The original error thrown by HttpClient or application code.
   * @param request The originating {@link HttpRequest} (used to enrich error context).
   * @param correlationId Optional correlation id (when provided by backend/gateway).
   * @returns A typed {@link AppError} suitable for UI feedback and logging.
   */
  public createAppError(error: unknown, request: HttpRequest<unknown>, correlationId: string | undefined): AppError {
    if (error instanceof HttpErrorResponse) {
      return this.createFromHttpErrorResponse(error, request, correlationId);
    }
    if (error instanceof AppError) {
      return error;
    }
    const fallbackMessage: string = $localize`An unexpected error occurred. Please try again.`;
    return new UnexpectedError({ userMessage: fallbackMessage, correlationId: correlationId, cause: error });
  }

  private createFromHttpErrorResponse(error: HttpErrorResponse, request: HttpRequest<unknown>, correlationId: string | undefined): AppError {
    const status: number = error.status;
    const statusText: string = error.statusText ?? '';
    const backendBody: unknown = error.error;
    const requestUrl: string = request.urlWithParams;
    const requestMethod: string = request.method;
    switch (status) {
      case 0: {
        const message: string = $localize`Unable to reach the server. Please check your internet connection.`;
        return new NetworkError({ userMessage: message, correlationId: correlationId, cause: error });
      }
      case 400:
        return this.createBadRequestError({ statusText: statusText, backendBody: backendBody, request: request, correlationId: correlationId, cause: error });
      case 401: {
        const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`Your session has expired. Please sign in again.`;
        return new UnauthorizedError({
          userMessage: message,
          statusText: statusText,
          url: requestUrl,
          method: requestMethod,
          backendBody: backendBody,
          correlationId: correlationId,
          cause: error
        });
      }
      case 403: {
        const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`You do not have permission to perform this action.`;
        return new ForbiddenError({
          userMessage: message,
          statusText: statusText,
          url: requestUrl,
          method: requestMethod,
          backendBody: backendBody,
          correlationId: correlationId,
          cause: error
        });
      }
      case 404: {
        const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`The requested resource was not found.`;
        return new NotFoundError({
          userMessage: message,
          statusText: statusText,
          url: requestUrl,
          method: requestMethod,
          backendBody: backendBody,
          correlationId: correlationId,
          cause: error
        });
      }
      case 409: {
        const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`A conflict occurred. Please refresh and try again.`;
        return new ConflictError({
          userMessage: message,
          statusText: statusText,
          url: requestUrl,
          method: requestMethod,
          backendBody: backendBody,
          correlationId: correlationId,
          cause: error
        });
      }
      default: {
        if (status >= 500 && status <= 599) {
          const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`A server error occurred. Please try again later.`;
          return new ServerError({
            status: status,
            userMessage: message,
            statusText: statusText,
            url: requestUrl,
            method: requestMethod,
            backendBody: backendBody,
            correlationId: correlationId,
            cause: error
          });
        }
        const message: string = this.extractPrimaryMessage(backendBody) ?? $localize`Request failed. Please try again.`;
        return new UnexpectedError({ userMessage: message, correlationId: correlationId, cause: error });
      }
    }
  }

  /**
   * Creates an {@link AppError} for HTTP 400 responses.
   *
   * @remarks
   * - If the backend provides structured field errors, returns a {@link ValidationError} so the UI can show
   *   precise form feedback.
   * - Otherwise returns a generic {@link BadRequestError}.
   *
   * @param params Method parameters.
   * @param params.statusText Status text (browser-dependent).
   * @param params.backendBody Raw backend payload (shape may vary).
   * @param params.request The originating {@link HttpRequest}.
   * @param params.correlationId Optional correlation id.
   * @param params.cause Original error.
   * @returns A typed {@link AppError} representing the bad request.
   */
  private createBadRequestError(params: {
    readonly statusText: string;
    readonly backendBody: unknown;
    readonly request: HttpRequest<unknown>;
    readonly correlationId: string | undefined;
    readonly cause: unknown;
  }): AppError {
    const fieldErrors: ReadonlyArray<FieldError> = this.extractFieldErrors(params.backendBody);
    const primaryMessage: string = this.extractPrimaryMessage(params.backendBody) ?? $localize`Please check your input and try again.`;
    const requestUrl: string = params.request.urlWithParams;
    const requestMethod: string = params.request.method;
    if (fieldErrors.length > 0) {
      return new ValidationError({
        status: 400,
        statusText: params.statusText,
        url: requestUrl,
        method: requestMethod,
        backendBody: params.backendBody,
        userMessage: primaryMessage,
        fieldErrors: fieldErrors,
        correlationId: params.correlationId,
        cause: params.cause
      });
    }
    return new BadRequestError({
      userMessage: primaryMessage,
      statusText: params.statusText,
      url: requestUrl,
      method: requestMethod,
      backendBody: params.backendBody,
      correlationId: params.correlationId,
      cause: params.cause
    });
  }

  /**
   * Extracts a single best-effort message from typical NestJS error payload shapes.
   *
   * @param backendBody Backend error payload (any shape).
   * @returns A message when it can be extracted, otherwise undefined.
   */
  private extractPrimaryMessage(backendBody: unknown): string | undefined {
    if (backendBody === null || backendBody === undefined) {
      return undefined;
    }
    if (typeof backendBody === 'string') {
      return backendBody;
    }
    if (typeof backendBody !== 'object') {
      return undefined;
    }
    const body: BackendErrorBody = this.parseBackendErrorBody(backendBody);
    const message: string | string[] | undefined = body.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.join(' ');
    }
    if (typeof body.errorSummary === 'string' && body.errorSummary !== '') {
      return body.errorSummary;
    }
    return undefined;
  }

  /**
   * Extracts field-level errors when the backend provides them in a structured array.
   *
   * @param backendBody Backend error payload (any shape).
   * @returns Array of {@link FieldError} for form display.
   */
  private extractFieldErrors(backendBody: unknown): ReadonlyArray<FieldError> {
    if (backendBody === null || backendBody === undefined) {
      return [];
    }
    if (typeof backendBody !== 'object') {
      return [];
    }
    const body: BackendErrorBody = this.parseBackendErrorBody(backendBody);
    const details: unknown = body.details;
    if (!Array.isArray(details)) {
      return [];
    }
    const fieldErrors: FieldError[] = [];
    for (const err of details) {
      if (err === null || err === undefined) {
        continue;
      }
      if (typeof err !== 'object') {
        continue;
      }
      const errRecord: Record<string, unknown> = err as Record<string, unknown>;
      const field: unknown = errRecord['field'];
      const message: unknown = errRecord['message'];
      if (typeof field !== 'string' || typeof message !== 'string') {
        continue;
      }
      fieldErrors.push({ field: field, message: message });
    }
    return fieldErrors;
  }

  /**
   * Normalizes a raw backend error payload into a {@link BackendErrorBody}.
   *
   * @remarks
   * `HttpErrorResponse#error` is not strongly typed and Swagger does not define an error schema in this project.
   * This method therefore performs **safe, best-effort** extraction from common NestJS keys:
   * - `statusCode`
   * - `message` (string or string[])
   * - `error` (short summary string)
   * - `errors` (optional structured details; non-standard)
   *
   * @param backendBody Raw backend payload (any shape).
   * @returns A normalized {@link BackendErrorBody}. Missing fields remain undefined.
   */
  private parseBackendErrorBody(backendBody: unknown): BackendErrorBody {
    // Guard against null/undefined payloads.
    if (backendBody === null || backendBody === undefined) {
      return {};
    }
    // Guard against non-object payloads (string/number/etc).
    if (typeof backendBody !== 'object') {
      return {};
    }
    // Treat as a record for dynamic key access (runtime payload can vary).
    const raw: Record<string, unknown> = backendBody as Record<string, unknown>;

    // Extract known NestJS fields when types match the expected shape.
    const statusCode: number | undefined = typeof raw['statusCode'] === 'number' ? (raw['statusCode'] as number) : undefined;
    const message: string | string[] | undefined = typeof raw['message'] === 'string' || Array.isArray(raw['message']) ? (raw['message'] as string | string[]) : undefined;

    // `error` is usually a short summary string (e.g., "Bad Request").
    const errorSummary: string | undefined = typeof raw['error'] === 'string' ? (raw['error'] as string) : undefined;

    // Optional non-standard details (some apps return structured validation data under `errors`).
    const details: unknown = raw['errors'];

    return {
      statusCode: statusCode,
      message: message,
      errorSummary: errorSummary,
      details: details
    };
  }
}

