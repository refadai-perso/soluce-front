/**
 * Base service for managing groups.
 * Provides a mock implementation for development without a backend.
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreateGroupDto } from '@shared/dto/group/create-group.dto';
import { UpdateGroupDto } from '@shared/dto/group/update-group.dto';
import { Group } from '../model/model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  /**
   * Fetches all available groups.
   * Base mock implementation used in development without a backend.
   *
   * @returns An observable emitting an array of {@link Group} objects.
   */
  public fetchGroups(): Observable<Group[]> {
    // Mock data - will be overridden by backend service
    const mockGroups: Group[] = [
      { id: 1, name: 'Administrators', description: 'System administrators with full access' },
      { id: 2, name: 'Developers', description: 'Development team members' },
      { id: 3, name: 'Viewers', description: 'Read-only access for stakeholders' },
      { id: 4, name: 'QA Team', description: 'Quality assurance team members' },
      { id: 5, name: 'Product Managers', description: 'Product management team' },
      { id: 6, name: 'Designers', description: 'UI/UX design team' },
      { id: 7, name: 'Stakeholders', description: 'External stakeholders and clients' },
      { id: 8, name: 'Support Team', description: 'Customer support representatives' }
    ];
    return of(mockGroups);
  }

  /**
   * Creates a new group.
   * Base mock implementation used in development without a backend.
   *
   * @param group The {@link CreateGroupDto} payload for creating a group.
   * @returns An observable emitting the created {@link Group} object.
   */
  public createGroup(group: CreateGroupDto): Observable<Group> {
    // Mock implementation - will be overridden by backend service
    const createdGroup: Group = {
      id: Date.now(),
      name: group.name,
      description: group.description,
      memberIds: group.memberIds || []
    };
    return of(createdGroup);
  }

  /**
   * Updates an existing group.
   * Base mock implementation used in development without a backend.
   *
   * @param id The ID of the group to update.
   * @param group The {@link UpdateGroupDto} payload with optional fields for partial updates.
   * @returns An observable emitting the updated {@link Group} object.
   */
  public updateGroup(id: number, group: UpdateGroupDto): Observable<Group> {
    // Mock implementation - will be overridden by backend service
    const updatedGroup: Group = {
      id: id,
      name: group.name,
      description: group.description,
      memberIds: group.memberIds
    };
    return of(updatedGroup);
  }

  /**
   * Deletes a group by ID.
   * Base mock implementation used in development without a backend.
   *
   * @param id The ID of the group to delete.
   * @returns An observable emitting void when the deletion is complete.
   */
  public deleteGroup(id: number): Observable<void> {
    // Mock implementation - will be overridden by backend service
    return of(void 0);
  }
}

