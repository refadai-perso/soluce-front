import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { UserDto } from '@shared/dto/user/user.dto';
import { CreateUserDto } from '@shared/dto/user/create-user.dto';
import { UpdateUserDto } from '@shared/dto/user/update-user.dto';
import { User } from '../model/model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class DBUserService extends UserService {
  private readonly httpClient: HttpClient = inject(HttpClient);
  private readonly API_BASE_URL: string = 'http://localhost:3000';

  constructor() {
    super();
  }

  /**
   * Fetches all available users from the backend API.
   *
   * @returns Observable emitting an array of {@link User} objects.
   */
  public override fetchUsers(): Observable<User[]> {
    const url: string = `${this.API_BASE_URL}/user`;
    return this.httpClient.get<UserDto[]>(url).pipe(
      map((backendUsers: UserDto[]): User[] => {
        console.log('Backend users response:', backendUsers);
        const mappedUsers: User[] = backendUsers.map((backendUser: UserDto): User => {
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.firstName,
            surname: backendUser.surname,
            creationDate: backendUser.creationDate ? new Date(backendUser.creationDate) : undefined,
            admin: backendUser.admin
          };
          return user;
        });
        console.log('Mapped users:', mappedUsers);
        return mappedUsers;
      }),
      catchError((error: unknown) => {
        console.log('Error fetching users:', error);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
  }

  /**
   * Creates a new user by POSTing to the API.
   *
   * @param userData The {@link CreateUserDto} payload for creating a user.
   * @returns Observable emitting the created {@link User} object.
   */
  public override createUser(userData: CreateUserDto): Observable<User> {
    const url: string = `${this.API_BASE_URL}/user`;
    console.log('Backend service - creating user:', userData);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const body: CreateUserDto = {
      email: userData.email,
      firstName: userData.firstName,
      surname: userData.surname,
      password: userData.password,
      admin: userData.admin || false
    };
    return this.httpClient.post<UserDto>(url, body, { headers }).pipe(
      map((backendUser: UserDto): User => {
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName,
          surname: backendUser.surname,
          creationDate: backendUser.creationDate ? new Date(backendUser.creationDate) : undefined,
          admin: backendUser.admin
        };
        return user;
      }),
      catchError((error: unknown) => {
        console.log('Error creating user:', error);
        return throwError(() => new Error('Failed to create user'));
      })
    );
  }

  /**
   * Updates an existing user by PATCHing to the API.
   *
   * @param id The ID of the user to update.
   * @param userData The {@link UpdateUserDto} payload with optional fields for partial updates.
   * @returns Observable emitting the updated {@link User} object.
   */
  public override updateUser(id: number, userData: UpdateUserDto): Observable<User> {
    const url: string = `${this.API_BASE_URL}/user/${id}`;
    console.log('Backend service - updating user:', id, 'with data:', userData);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.patch<UserDto>(url, userData, { headers }).pipe(
      map((backendUser: UserDto): User => {
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName,
          surname: backendUser.surname,
          creationDate: backendUser.creationDate ? new Date(backendUser.creationDate) : undefined,
          admin: backendUser.admin
        };
        return user;
      }),
      catchError((error: unknown) => {
        console.log('Error updating user:', error);
        return throwError(() => new Error('Failed to update user'));
      })
    );
  }
}

