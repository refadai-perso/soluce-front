import { inject, Injectable } from '@angular/core';
import { ProblemService } from './problem.service';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Problem } from '../model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DBProblemService extends ProblemService {
  private httpClient = inject(HttpClient);
  constructor() {
    super();
  }

  public override fetchProblemsOfUserGroups(): Observable<Problem[]> {
    return this.fetchProblems(
      'http://localhost:3000/problem',
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

  private fetchProblems(
    url: string,
    errorMessage: string
  ): Observable<Problem[]> {
    return this.httpClient.get<Problem[]>(url).pipe(
      catchError((error) => {
        console.log(error);
        return throwError(() => new Error(errorMessage));
      })
    );
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
