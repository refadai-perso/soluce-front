/**
 * Component for displaying and managing groups in a card-based table layout.
 * Similar to user-card component but for group management.
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModalModule, NgbModal, NgbTooltipModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Group } from '../../../model/model';
import { GroupService } from '../../../services/group.service';
import { GroupAddComponent } from '../../Pages/group-add.component';
import { GroupDeleteConfirmComponent } from './group-delete-confirm.component';
import { UserMembershipPanelComponent } from './user-membership-panel.component';
import { UserService } from '../../../services/user.service';
import { User } from '../../../model/model';
import { Observable, Subscription, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

type SortColumn = 'id' | 'name' | 'description' | 'creationDate' | 'creator' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-group-card',
  standalone: true,
  templateUrl: './group-card.component.html',
  styleUrls: ['./group-card.component.scss'],
  imports: [CommonModule, NgbModalModule, NgbTooltipModule, NgbDropdownModule, FormsModule, UserMembershipPanelComponent]
})
export class GroupCardComponent implements OnInit {
  public groups$!: Observable<Group[] | undefined>;
  public sortColumn: SortColumn = '';
  public sortDirection: SortDirection = '';
  public filterName: string = '';
  public filterDescription: string = '';
  
  // Row highlighting for updates
  public lastUpdatedGroupId: number | null = null;

  // User membership panel state
  public membershipPanelOpen: boolean = false;
  public selectedGroupForMembership: Group | null = null;
  public availableUsers: User[] = [];

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private modalService: NgbModal
  ) {}

  public ngOnInit(): void {
    // Fetch users first, then groups
    const users$: Observable<User[]> = this.userService.fetchUsers();
    
    // Combine users and groups observables
    this.groups$ = users$.pipe(
      switchMap((users: User[]) => {
        // Store users for membership panel
        this.availableUsers = users;
        
        // Now fetch groups
        return this.groupService.fetchGroups().pipe(
          map((groups: Group[] | undefined) => this.filterAndSortGroups(groups))
        );
      })
    );
  }

  /**
   * Handles sorting when a column header is clicked.
   * @param column The column to sort by
   */
  public onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.refreshData();
  }

  /**
   * Handles filter changes.
   */
  public onFilterChange(): void {
    this.refreshData();
  }

  /**
   * Clears all filters.
   */
  public clearFilters(): void {
    this.filterName = '';
    this.filterDescription = '';
    this.refreshData();
  }

  /**
   * Refreshes the data by reapplying filters and sorting.
   */
  private refreshData(): void {
    // Ensure users are loaded, then refresh groups
    const users$: Observable<User[]> = this.userService.fetchUsers();
    
    this.groups$ = users$.pipe(
      switchMap((users: User[]) => {
        // Update available users
        this.availableUsers = users;
        
        // Fetch groups
        return this.groupService.fetchGroups().pipe(
          map((groups: Group[] | undefined) => this.filterAndSortGroups(groups))
        );
      })
    );
  }

  /**
   * Filters and sorts the groups based on current filter and sort settings.
   * @param groups The array of groups to filter and sort
   * @returns The filtered and sorted array of groups
   */
  private filterAndSortGroups(groups: Group[] | undefined): Group[] | undefined {
    if (!groups) {
      return groups;
    }

    let filteredGroups: Group[] = [...groups];

    // Apply filters
    if (this.filterName) {
      const lowerFilterName: string = this.filterName.toLowerCase();
      filteredGroups = filteredGroups.filter((group: Group) => 
        group.name?.toLowerCase().includes(lowerFilterName)
      );
    }

    if (this.filterDescription) {
      const lowerFilterDescription: string = this.filterDescription.toLowerCase();
      filteredGroups = filteredGroups.filter((group: Group) => 
        group.description?.toLowerCase().includes(lowerFilterDescription)
      );
    }

    // Apply sorting using native JavaScript
    if (this.sortColumn && this.sortDirection) {
      filteredGroups.sort((a: Group, b: Group) => {
        let aValue: any;
        let bValue: any;

        switch (this.sortColumn) {
          case 'id':
            aValue = a.id || 0;
            bValue = b.id || 0;
            break;
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'creationDate':
            aValue = a.creationDate ? new Date(a.creationDate).getTime() : 0;
            bValue = b.creationDate ? new Date(b.creationDate).getTime() : 0;
            break;
          case 'creator':
            aValue = (a.creatorName || '').toLowerCase();
            bValue = (b.creatorName || '').toLowerCase();
            break;
          default:
            aValue = '';
            bValue = '';
        }

        // Compare values
        if (aValue < bValue) {
          return this.sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return this.sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredGroups;
  }

  /**
   * Returns the sort icon class based on current sort state.
   * @param column The column to check
   * @returns The Bootstrap icon class
   */
  public getSortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  /**
   * Returns the count of members for a group.
   * @param group The Group object
   * @returns The number of members
   */
  public getMemberCount(group: Group): number {
    return group.memberIds?.length || group.members?.length || 0;
  }

  /**
   * Returns the creator name from the group.
   * Uses creatorName from the backend response only.
   * @param group The Group object
   * @returns A string with the creator name or '-' if no creator name is available
   */
  public getCreatorName(group: Group): string {
    return group.creatorName || '-';
  }

  /**
   * Checks if a group row should be highlighted as recently updated.
   * @param groupId The ID of the group to check
   * @returns True if the group was recently updated and should be highlighted
   */
  public isRowHighlighted(groupId: number | undefined): boolean {
    return groupId !== undefined && groupId === this.lastUpdatedGroupId;
  }

  /**
   * Opens the create group modal dialog.
   */
  public openCreateGroupModal(): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    const modalRef = this.modalService.open(GroupAddComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.initialValue = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        // Handle successful creation
        console.log('Group created successfully', result);
        this.refreshData();
      },
      (reason) => {
        // Handle dismissal
        console.log('Modal dismissed', reason);
      }
    );
  }

  /**
   * Opens the edit group modal dialog with existing group data.
   * @param group The group to edit
   */
  public openEditGroupModal(group: Group): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    const modalRef = this.modalService.open(GroupAddComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.initialValue = group;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result) => {
        // Handle successful update
        console.log('Group updated successfully', result);
        
        // Highlight the updated row
        this.lastUpdatedGroupId = result.id || null;
        
        this.refreshData();
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          this.lastUpdatedGroupId = null;
        }, 3000);
      },
      (reason) => {
        // Handle dismissal
        console.log('Modal dismissed', reason);
      }
    );
  }

  /**
   * Opens a confirmation dialog to delete a group.
   * @param group The group to delete
   */
  public openDeleteGroupConfirmation(group: Group): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const modalRef = this.modalService.open(GroupDeleteConfirmComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.group = group;

    modalRef.result.then(
      (result: string) => {
        if (result === 'delete' && group.id !== undefined) {
          this.deleteGroup(group.id);
        }
      },
      (reason: unknown) => {
        // Handle dismissal - do nothing
        console.log('Delete confirmation dismissed', reason);
      }
    );
  }

  /**
   * Deletes a group by ID.
   * @param groupId The ID of the group to delete
   */
  private deleteGroup(groupId: number): void {
    const sub: Subscription = this.groupService.deleteGroup(groupId).subscribe({
      next: (): void => {
        console.log('Group deleted successfully:', groupId);
        this.refreshData();
      },
      error: (error: unknown): void => {
        console.error('Error deleting group:', error);
        // Could show an error toast/alert here
      }
    });
    // Note: In a real app, you'd want to manage this subscription properly
    // For now, we'll let it complete naturally
  }

  /**
   * Opens the user membership panel for a group.
   * @param group The group to manage members for
   */
  public openMembershipPanel(group: Group): void {
    // Blur any focused element to prevent aria-hidden accessibility warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.selectedGroupForMembership = group;
    this.membershipPanelOpen = true;
  }

  /**
   * Closes the user membership panel.
   */
  public onCloseMembershipPanel(): void {
    this.membershipPanelOpen = false;
    this.selectedGroupForMembership = null;
  }

  /**
   * Handles adding a user to the group.
   * @param userId The ID of the user to add
   */
  public onUserAdded(userId: number): void {
    if (!this.selectedGroupForMembership || !this.selectedGroupForMembership.id) {
      return;
    }

    const currentMemberIds: number[] = this.selectedGroupForMembership.memberIds || [];
    if (currentMemberIds.includes(userId)) {
      return; // Already a member
    }

    const updatedMemberIds: number[] = [...currentMemberIds, userId];
    this.updateGroupMembers(this.selectedGroupForMembership.id, updatedMemberIds);
  }

  /**
   * Handles removing a user from the group.
   * @param userId The ID of the user to remove
   */
  public onUserRemoved(userId: number): void {
    if (!this.selectedGroupForMembership || !this.selectedGroupForMembership.id) {
      return;
    }

    const currentMemberIds: number[] = this.selectedGroupForMembership.memberIds || [];
    const updatedMemberIds: number[] = currentMemberIds.filter((id: number) => id !== userId);
    this.updateGroupMembers(this.selectedGroupForMembership.id, updatedMemberIds);
  }

  /**
   * Updates the group members by calling the update service.
   * @param groupId The ID of the group to update
   * @param memberIds The new list of member IDs
   */
  private updateGroupMembers(groupId: number, memberIds: number[]): void {
    const updateData: { memberIds: number[] } = { memberIds };
    const sub: Subscription = this.groupService.updateGroup(groupId, updateData).subscribe({
      next: (updated: Group): void => {
        console.log('Group members updated successfully:', updated);
        // Update the selected group reference
        if (this.selectedGroupForMembership) {
          this.selectedGroupForMembership.memberIds = updated.memberIds;
        }
        this.refreshData();
      },
      error: (error: unknown): void => {
        console.error('Error updating group members:', error);
        // Could show an error toast/alert here
      }
    });
  }

  /**
   * Gets the current member IDs for the selected group.
   * @returns Array of member IDs
   */
  public getCurrentMemberIds(): number[] {
    return this.selectedGroupForMembership?.memberIds || [];
  }
}

