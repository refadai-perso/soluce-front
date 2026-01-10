import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { GroupDto } from '@shared/dto/group/group.dto';
import { CreateGroupDto } from '@shared/dto/group/create-group.dto';
import { UpdateGroupDto } from '@shared/dto/group/update-group.dto';
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
        console.log('Raw backend groups response:', backendGroups);
        const mappedGroups: Group[] = backendGroups.map((backendGroup: GroupDto): Group => {
          // The DTO should have creatorId directly, but if transformation didn't work, extract from creator
          const creatorId: number | undefined = backendGroup.creatorId || (backendGroup as any).creator?.id;
          
          // The DTO should have memberIds directly, but if transformation didn't work, extract from members
          const memberIds: number[] = backendGroup.memberIds || ((backendGroup as any).members?.map((member: any) => member.id) || []);
          
          // Get creatorName from the response
          // First check if creatorName is directly in the response (from DTO transformation)
          // Otherwise, construct it from the creator object
          const rawResponse: any = backendGroup as any;
          let creatorName: string | undefined = rawResponse.creatorName || backendGroup.creatorName;
          
          // If creatorName is not available, construct it from creator object
          if (!creatorName && rawResponse.creator) {
            const firstName: string = rawResponse.creator.firstName || '';
            const surname: string = rawResponse.creator.surname || '';
            creatorName = `${firstName} ${surname}`.trim() || undefined;
          }
          
          const group: Group = {
            id: backendGroup.id,
            name: backendGroup.name,
            description: backendGroup.description,
            memberIds: memberIds,
            creationDate: backendGroup.creationDate ? new Date(backendGroup.creationDate) : undefined,
            creatorId: creatorId,
            creatorName: creatorName
          };
          
          return group;
        });
        return mappedGroups;
      }),
      catchError((error: unknown) => {
        console.log('Error fetching groups:', error);
        return throwError(() => new Error('Failed to fetch groups'));
      })
    );
  }

  /**
   * Creates a new group by POSTing to the API.
   * Uses POST http://localhost:3000/group
   *
   * @param groupData The {@link CreateGroupDto} payload for creating a group.
   * @returns Observable emitting the created {@link Group} object.
   */
  public override createGroup(groupData: CreateGroupDto): Observable<Group> {
    const url: string = `${this.API_BASE_URL}/group`;
    console.log('Backend service - creating group:', groupData);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const body: CreateGroupDto = {
      name: groupData.name,
      description: groupData.description,
      creatorId: groupData.creatorId,
      memberIds: groupData.memberIds || []
    };
    // Store creatorId from request since backend might not return it
    const requestCreatorId: number | undefined = groupData.creatorId;
    
    return this.httpClient.post<GroupDto>(url, body, { headers }).pipe(
      map((backendGroup: GroupDto): Group => {
        // The DTO should have creatorId directly, but if transformation didn't work, extract from creator
        const creatorId: number | undefined = backendGroup.creatorId || (backendGroup as any).creator?.id || requestCreatorId;
        
        // The DTO should have memberIds directly, but if transformation didn't work, extract from members
        const memberIds: number[] = backendGroup.memberIds || ((backendGroup as any).members?.map((member: any) => member.id) || []);
        
        // Get creatorName from the response
        // First check if creatorName is directly in the response (from DTO transformation)
        // Otherwise, construct it from the creator object
        const rawResponse: any = backendGroup as any;
        let creatorName: string | undefined = rawResponse.creatorName || backendGroup.creatorName;
        
        // If creatorName is not available, construct it from creator object
        if (!creatorName && rawResponse.creator) {
          const firstName: string = rawResponse.creator.firstName || '';
          const surname: string = rawResponse.creator.surname || '';
          creatorName = `${firstName} ${surname}`.trim() || undefined;
        }
        
        const group: Group = {
          id: backendGroup.id,
          name: backendGroup.name,
          description: backendGroup.description,
          memberIds: memberIds,
          creationDate: backendGroup.creationDate ? new Date(backendGroup.creationDate) : undefined,
          creatorId: creatorId,
          creatorName: creatorName
        };
        return group;
      }),
      catchError((error: unknown) => {
        console.log('Error creating group:', error);
        return throwError(() => new Error('Failed to create group'));
      })
    );
  }

  /**
   * Updates an existing group by PATCHing to the API.
   * Uses PATCH http://localhost:3000/group/{id}
   *
   * @param id The ID of the group to update.
   * @param groupData The {@link UpdateGroupDto} payload with optional fields for partial updates.
   * @returns Observable emitting the updated {@link Group} object.
   */
  public override updateGroup(id: number, groupData: UpdateGroupDto): Observable<Group> {
    const url: string = `${this.API_BASE_URL}/group/${id}`;
    console.log('Backend service - updating group:', id, 'with data:', groupData);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.patch<GroupDto>(url, groupData, { headers }).pipe(
      map((backendGroup: GroupDto): Group => {
        // The DTO should have creatorId directly, but if transformation didn't work, extract from creator
        const creatorId: number | undefined = backendGroup.creatorId || (backendGroup as any).creator?.id;
        
        // The DTO should have memberIds directly, but if transformation didn't work, extract from members
        const memberIds: number[] = backendGroup.memberIds || ((backendGroup as any).members?.map((member: any) => member.id) || []);
        
        const group: Group = {
          id: backendGroup.id,
          name: backendGroup.name,
          description: backendGroup.description,
          memberIds: memberIds,
          creationDate: backendGroup.creationDate ? new Date(backendGroup.creationDate) : undefined,
          creatorId: creatorId,
          creatorName: backendGroup.creatorName
        };
        return group;
      }),
      catchError((error: unknown) => {
        console.log('Error updating group:', error);
        return throwError(() => new Error('Failed to update group'));
      })
    );
  }

  /**
   * Deletes a group by ID using DELETE request to the API.
   * Uses DELETE http://localhost:3000/group/{id}
   *
   * @param id The ID of the group to delete.
   * @returns Observable emitting void when the deletion is complete.
   */
  public override deleteGroup(id: number): Observable<void> {
    const url: string = `${this.API_BASE_URL}/group/${id}`;
    console.log('Backend service - deleting group:', id);
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.delete<void>(url, { headers }).pipe(
      catchError((error: unknown) => {
        console.log('Error deleting group:', error);
        return throwError(() => new Error('Failed to delete group'));
      })
    );
  }
}

