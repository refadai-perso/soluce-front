import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { UserDto } from '@shared/dto/user/user.dto';

/**
 * Dummy user ID constant used when authentication is not available.
 * This should only be used in development/noauth mode.
 */
export const DUMMY_USER_ID: number = -9999;

/**
 * Interface for signin request payload.
 */
export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * Service for managing user authentication and retrieving current user information.
 * 
 * @remarks
 * This service communicates with the backend API for authentication.
 * Uses session-based authentication (cookies) managed by the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly httpClient: HttpClient = inject(HttpClient);
  private readonly API_BASE_URL: string = 'http://localhost:3000';
  private readonly AUTH_SIGNIN_URL: string = `${this.API_BASE_URL}/auth/signin`;
  private readonly AUTH_SIGNOUT_URL: string = `${this.API_BASE_URL}/auth/signout`;
  private readonly AUTH_WHOAMI_URL: string = `${this.API_BASE_URL}/auth/whoami`;

  /**
   * Key used to store the current user in localStorage as a cache.
   */
  private readonly USER_STORAGE_KEY: string = 'current-user';

  /**
   * Sign in a user with email and password.
   * 
   * @param email The user's email address.
   * @param password The user's password.
   * @returns Observable emitting the authenticated user information.
   */
  public signIn(email: string, password: string): Observable<UserDto> {
    const signInRequest: SignInRequest = { email, password };
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<UserDto>(this.AUTH_SIGNIN_URL, signInRequest, {
      headers,
      withCredentials: true // Required for session cookies
    }).pipe(
      map((user: UserDto): UserDto => {
        // Cache user information in localStorage
        this.cacheCurrentUser(user);
        return user;
      }),
      catchError((error: unknown) => {
        console.log('Sign in failed:', error);
        return throwError(() => new Error('Failed to sign in. Please check your credentials.'));
      })
    );
  }

  /**
   * Sign out the current user.
   * 
   * @returns Observable that completes when signout is successful.
   */
  public signOut(): Observable<void> {
    return this.httpClient.post<void>(this.AUTH_SIGNOUT_URL, {}, {
      withCredentials: true // Required for session cookies
    }).pipe(
      map((): void => {
        // Clear cached user information
        this.clearCachedUser();
      }),
      catchError((error: unknown) => {
        console.log('Sign out failed:', error);
        // Clear cache even if request fails
        this.clearCachedUser();
        return throwError(() => new Error('Failed to sign out'));
      })
    );
  }

  /**
   * Get the current authenticated user from the backend.
   * 
   * @returns Observable emitting the current user, or null if not authenticated.
   */
  public getCurrentUser(): Observable<UserDto | null> {
    return this.httpClient.get<UserDto>(this.AUTH_WHOAMI_URL, {
      withCredentials: true // Required for session cookies
    }).pipe(
      map((user: UserDto): UserDto => {
        // Cache user information
        this.cacheCurrentUser(user);
        return user;
      }),
      catchError((error: unknown) => {
        // If not authenticated, clear cache and return null
        console.log('Not authenticated:', error);
        this.clearCachedUser();
        return of(null);
      })
    );
  }

  /**
   * Get the current authenticated user's ID.
   * First checks localStorage cache, then calls backend if needed.
   * 
   * @returns The user ID if available, or null if not authenticated.
   */
  public getCurrentUserId(): number | null {
    const cachedUser: UserDto | null = this.getCachedUser();
    if (cachedUser !== null && cachedUser.id !== undefined) {
      return cachedUser.id;
    }
    return null;
  }

  /**
   * Check if a user is currently authenticated.
   * 
   * @returns True if a user ID is available (from cache), false otherwise.
   */
  public isAuthenticated(): boolean {
    return this.getCurrentUserId() !== null;
  }

  /**
   * Cache the current user in localStorage.
   * 
   * @param user The user to cache.
   */
  private cacheCurrentUser(user: UserDto): void {
    try {
      window.localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error: unknown) {
      console.log('Failed to cache user:', error);
    }
  }

  /**
   * Get the cached user from localStorage.
   * 
   * @returns The cached user, or null if not found or invalid.
   */
  private getCachedUser(): UserDto | null {
    try {
      const stored: string | null = window.localStorage.getItem(this.USER_STORAGE_KEY);
      if (stored === null || stored === '') {
        return null;
      }
      const user: UserDto = JSON.parse(stored) as UserDto;
      return user;
    } catch (error: unknown) {
      console.log('Failed to retrieve cached user:', error);
      return null;
    }
  }

  /**
   * Clear the cached user from localStorage.
   */
  private clearCachedUser(): void {
    try {
      window.localStorage.removeItem(this.USER_STORAGE_KEY);
    } catch (error: unknown) {
      console.log('Failed to clear cached user:', error);
    }
  }
}
