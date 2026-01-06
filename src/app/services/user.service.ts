/**
 * Base service for managing users.
 * Provides a mock implementation for development without a backend.
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreateUserDto } from '@shared/dto/user/create-user.dto';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';
import { User } from '../model/model';

@Injectable({ providedIn: 'root' })
export class UserService {
  /**
   * Fetches all available users.
   * Base mock implementation used in development without a backend.
   *
   * @returns An observable emitting an array of {@link User} objects.
   */
  public fetchUsers(): Observable<User[]> {
    // Mock data - will be overridden by backend service
    const mockUsers: User[] = [
      { 
        id: 1, 
        email: 'admin@example.com', 
        firstName: 'Admin', 
        surname: 'User',
        creationDate: new Date('2024-01-01'),
        admin: true
      },
      { 
        id: 2, 
        email: 'user@example.com', 
        firstName: 'Regular', 
        surname: 'User',
        creationDate: new Date('2024-01-15'),
        admin: false
      }
    ];
    return of(mockUsers);
  }

  /**
   * Creates a new user.
   * Base mock implementation used in development without a backend.
   *
   * @param user The {@link CreateUserDto} payload for creating a user.
   * @returns An observable emitting the created {@link User} object.
   */
  public createUser(user: CreateUserDto): Observable<User> {
    // Mock implementation - will be overridden by backend service
    const createdUser: User = {
      id: Date.now(),
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      creationDate: new Date(),
      admin: user.admin || false
    };
    return of(createdUser);
  }

  /**
   * Updates an existing user.
   * Base mock implementation used in development without a backend.
   *
   * @param id The ID of the user to update.
   * @param user The {@link UpdateUserDto} payload with optional fields for partial updates.
   * @returns An observable emitting the updated {@link User} object.
   */
  public updateUser(id: number, user: UpdateUserDto): Observable<User> {
    // Mock implementation - will be overridden by backend service
    const updatedUser: User = {
      id: id,
      email: user.email,
      firstName: user.firstName,
      surname: user.surname,
      admin: user.admin
    };
    return of(updatedUser);
  }

  /**
   * Deletes a user by ID.
   * Base mock implementation used in development without a backend.
   *
   * @param id The ID of the user to delete.
   * @returns An observable emitting void when the deletion is complete.
   */
  public deleteUser(id: number): Observable<void> {
    // Mock implementation - will be overridden by backend service
    return of(void 0);
  }
}

