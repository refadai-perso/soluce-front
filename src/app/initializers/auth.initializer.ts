import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Email address for automatic authentication.
 */
const AUTOMATIC_AUTH_EMAIL: string = 'toto@titi100.fr';

/**
 * Password for automatic authentication.
 */
const AUTOMATIC_AUTH_PASSWORD: string = '123456';

/**
 * Get the AUTOMATIC_AUTHENTICATION value from environment variables.
 * This is replaced at build time by webpack's DefinePlugin.
 * 
 * Accessing process.env.AUTOMATIC_AUTHENTICATION directly at module level
 * allows webpack to statically analyze and replace it with the actual value.
 * 
 * @ts-ignore - process.env is defined at build time by webpack
 */
const AUTOMATIC_AUTHENTICATION_ENV: string | undefined = process.env.AUTOMATIC_AUTHENTICATION;

/**
 * Get the AUTOMATIC_AUTHENTICATION value from environment variables.
 * Reads from process.env which is populated by webpack's DefinePlugin at build time.
 * 
 * @returns True if AUTOMATIC_AUTHENTICATION is set to 'true', false otherwise
 */
function getAutomaticAuthentication(): boolean {
  // Use the module-level constant that webpack should have replaced
  const automaticAuthValue: string | undefined = AUTOMATIC_AUTHENTICATION_ENV;
  
  // Debug logging - this will show the actual replaced value at runtime
  console.log('AUTOMATIC_AUTHENTICATION value from process.env:', automaticAuthValue);
  console.log('Type of value:', typeof automaticAuthValue);
  console.log('Raw AUTOMATIC_AUTHENTICATION_ENV constant:', AUTOMATIC_AUTHENTICATION_ENV);
  
  // Convert string to boolean (handles 'true', 'TRUE', 'True', etc.)
  // If webpack replaced it correctly, this will be the string "true" from .env.development
  const result: boolean = automaticAuthValue === 'true' || automaticAuthValue === 'TRUE' || automaticAuthValue === 'True';
  console.log('Automatic authentication enabled:', result);
  
  // If the value wasn't replaced by webpack (still undefined), it means webpack didn't process it
  // This can happen if the .env file wasn't loaded or webpack config isn't working
  if (automaticAuthValue === undefined) {
    console.warn('WARNING: process.env.AUTOMATIC_AUTHENTICATION is undefined. Webpack may not have replaced it.');
    console.warn('Check that .env.development exists and webpack.config.js is properly configured.');
    console.warn('Try restarting the dev server completely (stop and start again).');
  }
  
  return result;
}

/**
 * App initializer function that performs automatic authentication
 * if enabled in the environment configuration via AUTOMATIC_AUTHENTICATION variable.
 * 
 * @returns Promise that resolves when initialization is complete
 */
export function authInitializer(): () => Promise<void> {
  return async (): Promise<void> => {
    console.log('Auth initializer starting...');
    const authService: AuthService = inject(AuthService);
    const automaticAuth: boolean = getAutomaticAuthentication();
    
    if (automaticAuth === true) {
      console.log('Automatic authentication enabled. Signing in with:', AUTOMATIC_AUTH_EMAIL);
      try {
        const user = await firstValueFrom(authService.signIn(AUTOMATIC_AUTH_EMAIL, AUTOMATIC_AUTH_PASSWORD));
        console.log('Automatic authentication successful. User:', user);
      } catch (error: unknown) {
        console.error('Automatic authentication failed:', error);
        // Don't throw - allow app to continue even if auto-auth fails
        // User can still authenticate manually
      }
    } else {
      console.log('Automatic authentication disabled. User must authenticate manually.');
      console.log('To enable automatic authentication, set AUTOMATIC_AUTHENTICATION=true in .env.development');
      // Clear any cached user so the app is not shown as already connected
      authService.clearCachedUser();
    }
  };
}

