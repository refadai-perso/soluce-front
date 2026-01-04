import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Authorization } from '@shared/dto/group/authorization.enum';
import { UpdateProblemDto } from '@shared/dto';

import { Problem, GroupAuthorization } from '../model';
import { ProblemService } from './problem.service';

@Injectable({ providedIn: 'root' })
export class DBProblemService extends ProblemService {
  private httpClient = inject(HttpClient);
  constructor() {
    super();
  }

  public override fetchProblemsOfUserGroups(): Observable<Problem[]> {
    return this.fetchProblems(
      'http://localhost:3000/problem?includeCreator=true&includeAuthorizations=true',
      'error favorite places'
    );
  }

  /**
   * Create a new {@link Problem} by POSTing to the API.
   *
   * Expects the minimal backend contract:
   * { name: string; description?: string; open: boolean }
   *
   * @param body The creation payload sent to the backend.
   * @returns Observable emitting the created {@link Problem} as returned by the API.
   */
  public override createProblem(body: { name: string; description?: string; open: boolean }): Observable<Problem> {
    const url: string = 'http://localhost:3000/problem';
    console.log('Backend service - sending body:', body);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.post<Problem>(url, body, { headers }).pipe(
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error('Failed to create problem'));
      })
    );
  }

  /**
   * Update an existing {@link Problem} by PATCHing to the API.
   *
   * Uses PATCH for partial updates with {@link UpdateProblemDto}.
   * All fields in the DTO are optional, allowing partial updates.
   *
   * @param id The ID of the problem to update
   * @param body The {@link UpdateProblemDto} payload with optional fields for partial updates.
   * @returns Observable emitting the updated {@link Problem} as returned by the API.
   */
  public override updateProblem(id: number, body: UpdateProblemDto): Observable<Problem> {
    const url: string = `http://localhost:3000/problem/${id}`;
    console.log('Backend service - updating problem:', id, 'with body:', body);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.patch<Problem>(url, body, { headers }).pipe(
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error('Failed to update problem'));
      })
    );
  }

  private fetchProblems(
    url: string,
    errorMessage: string
  ): Observable<Problem[]> {
    return this.httpClient.get<any[]>(url).pipe(
      map((backendProblems: any[]) => {
        return backendProblems.map((backendProblem: any) => {
          const problem: Problem = {
            id: backendProblem.id,
            name: backendProblem.name,
            description: backendProblem.description,
            status: backendProblem.status,
            open: backendProblem.open,
            creationDate: backendProblem.creationDate,
            creator: backendProblem.creator,
            groupAuthorizations: this.mapGroupAuthorizations(backendProblem.groupAuthorizations || [])
          };
          return problem;
        });
      }),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Maps backend GroupAuthorization objects to frontend GroupAuthorization interface.
   * Backend uses 'authorization' and 'createdAt', frontend uses 'authorizationLevel' and 'grantedDate'.
   * 
   * @param backendAuthorizations Array of backend authorization objects
   * @returns Array of mapped GroupAuthorization objects
   */
  private mapGroupAuthorizations(backendAuthorizations: any[]): GroupAuthorization[] {
    return backendAuthorizations.map((backendAuth: any) => {
      const mapped: GroupAuthorization = {
        id: backendAuth.id,
        group: backendAuth.group,
        authorizationLevel: backendAuth.authorization as Authorization,
        grantedDate: backendAuth.createdAt ? new Date(backendAuth.createdAt) : undefined
      };
      return mapped;
    });
  }

  private fetchProblemsGood(url: string, errorMessage: string) {
    return this.httpClient.get<{ problems: Problem[] }>(url).pipe(
      tap((res) => console.log('HTTP response:', res)),
      map((pbData) => pbData.problems),
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
