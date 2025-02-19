import { inject, Injectable } from '@angular/core';
import { ProblemService } from './problem.service';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Problem } from '../model';
import { HttpClient } from '@angular/common/http';

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
