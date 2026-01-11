import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { GroupDto } from '@shared/dto';
import { Group } from '../model/model';
import { GroupService } from './group.service';

@Injectable({ providedIn: 'root' })
export class DBGroupService extends GroupService {
  private readonly httpClient: HttpClient = inject(HttpClient);
  private readonly API_BASE_URL: string = 'http://localhost:3000';

  constructor() {
    super();
  }

  /**
   * Fetches all available groups from the backend API.
   *
   * @returns Observable emitting an array of {@link Group} objects.
   */
  public override fetchGroups(): Observable<Group[]> {
    const url: string = `${this.API_BASE_URL}/group`;
    return this.httpClient.get<GroupDto[]>(url).pipe(
      map((backendGroups: GroupDto[]): Group[] => {
        console.log('Backend groups response:', backendGroups);
        const mappedGroups: Group[] = backendGroups.map((backendGroup: GroupDto): Group => {
          const group: Group = {
            id: backendGroup.id,
            name: backendGroup.name,
            description: backendGroup.description
          };
          return group;
        });
        console.log('Mapped groups:', mappedGroups);
        return mappedGroups;
      }),
      catchError((error: unknown) => {
        console.log('Error fetching groups:', error);
        return throwError(() => new Error('Failed to fetch groups'));
      })
    );
  }
}

