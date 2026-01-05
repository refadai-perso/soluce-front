/**
 * Base service for managing groups.
 * Provides a mock implementation for development without a backend.
 */

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
}

