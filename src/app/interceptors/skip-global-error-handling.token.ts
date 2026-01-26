import { HttpContextToken } from '@angular/common/http';

/**
 * Set to true to skip the global error handling (toast/redirect) for a request.
 *
 * @example
 * ```ts
 * this.http.get(url, {
 *   context: new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true)
 * });
 * ```
 */
export const SKIP_GLOBAL_ERROR_HANDLING: HttpContextToken<boolean> = new HttpContextToken<boolean>(() => false);

