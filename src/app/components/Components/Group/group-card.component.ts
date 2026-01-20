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
import { ConfirmationDialogComponent } from '../Common/confirmation-dialog.component';
import { UserMembershipPanelComponent } from './user-membership-panel.component';
import { DateRangeFilterComponent, DateRangeChange } from '../Common/date-range-filter.component';
import { Observable, Subscription, of } from 'rxjs';
import { map } from 'rxjs/operators';

type SortColumn = 'id' | 'name' | 'description' | 'creationDate' | 'creator' | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-group-card',
  standalone: true,
  templateUrl: './group-card.component.html',
  styleUrls: ['./group-card.component.scss'],
  imports: [CommonModule, NgbModalModule, NgbTooltipModule, NgbDropdownModule, FormsModule, UserMembershipPanelComponent, DateRangeFilterComponent]
})
export class GroupCardComponent implements OnInit {
  /**
   * Observable emitting the list of groups, filtered and sorted according to current settings.
   */
  public groups$!: Observable<Group[] | undefined>;

  /**
   * The column currently used for sorting the groups table.
   */
  public sortColumn: SortColumn = '';

  /**
   * The direction of the current sort (ascending or descending).
   */
  public sortDirection: SortDirection = '';

  /**
   * Filter text for filtering groups by name.
   * Contains the search string entered by the user to filter groups.
   * When empty string (''), no name filtering is applied and all groups are shown.
   * When populated, only groups whose name contains this text (case-insensitive) are displayed.
   * The filtering uses substring matching, so partial matches are included.
   */
  public filterName: string = '';

  /**
   * Filter text for filtering groups by description.
   * Contains the search string entered by the user to filter groups by their description.
   * When empty string (''), no description filtering is applied and all groups are shown.
   * When populated, only groups whose description contains this text (case-insensitive) are displayed.
   * The filtering uses substring matching, so partial matches are included.
   */
  public filterDescription: string = '';

  /**
   * Filter text for filtering groups by creator name.
   * Contains the search string entered by the user to filter groups by creator.
   * When empty string (''), no creator filtering is applied and all groups are shown.
   * When populated, only groups whose creator name contains this text (case-insensitive) are displayed.
   * The filtering uses substring matching, so partial matches are included.
   */
  public filterCreator: string = '';

  /**
   * Filter for creation date range - start date (from).
   * Contains the start date in YYYY-MM-DD format for filtering groups by creation date.
   * When empty string (''), no start date filtering is applied.
   */
  public filterCreationDateFrom: string = '';

  /**
   * Filter for creation date range - end date (to).
   * Contains the end date in YYYY-MM-DD format for filtering groups by creation date.
   * When empty string (''), no end date filtering is applied.
   */
  public filterCreationDateTo: string = '';
  
  /**
   * ID of the group that was last created or updated, used to highlight the row temporarily.
   */
  public lastModifiedGroupId: number | null = null;

  /**
   * Whether the user membership panel is currently open.
   */
  public membershipPanelOpen: boolean = false;

  /**
   * The group currently selected for membership management in the panel.
   */
  public selectedGroupForMembership: Group | null = null;


  /**
   * Raw groups data fetched from the server, before filtering and sorting.
   * Used to avoid unnecessary server refetches when only filters or sorting change.
   */
  private rawGroups: Group[] | undefined;

  /**
   * Service for managing group operations.
   */
  private groupService: GroupService;

  /**
   * Service for opening modal dialogs.
   */
  private modalService: NgbModal;

  constructor(
    groupService: GroupService,
    modalService: NgbModal
  ) {
    this.groupService = groupService;
    this.modalService = modalService;
  }

  public ngOnInit(): void {
    // Fetch groups - creatorName comes from backend via GroupDto
    this.groups$ = this.groupService.fetchGroups().pipe(
      map((groups: Group[] | undefined) => {
        // Store raw groups for filtering/sorting without refetch
        this.rawGroups = groups;
        return this.filterAndSortGroups(groups);
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
    this.refreshData(false); // No server refetch needed for sorting
  }

  /**
   * Handles filter changes.
   */
  public onFilterChange(): void {
    this.refreshData(false); // No server refetch needed for filtering
  }

  /**
   * Clears all filters.
   */
  public clearFilters(): void {
    this.filterName = '';
    this.filterDescription = '';
    this.filterCreator = '';
    this.filterCreationDateFrom = '';
    this.filterCreationDateTo = '';
    this.refreshData(false); // No server refetch needed for clearing filters
  }

  /**
   * Handles date range changes from the date range filter component.
   * @param change The date range change event
   */
  public onDateRangeChange(change: DateRangeChange): void {
    this.filterCreationDateFrom = change.from;
    this.filterCreationDateTo = change.to;
    this.onFilterChange();
  }

  /**
   * Refreshes the data by reapplying filters and sorting.
   * Only refetches groups from server if forceRefresh is true (for CRUD operations).
   * Otherwise, just reapplies filters/sorting to existing data.
   * @param forceRefresh If true, refetches from server. If false, only reapplies filters/sorting.
   */
  private refreshData(forceRefresh: boolean = false): void {
    if (forceRefresh || !this.rawGroups) {
      // Refetch from server (CRUD operations or initial load)
      this.groups$ = this.groupService.fetchGroups().pipe(
        map((groups: Group[] | undefined) => {
          this.rawGroups = groups;
          return this.filterAndSortGroups(groups);
        })
      );
    } else {
      // Just reapply filters/sorting to existing data (filter/sort changes)
      this.groups$ = of(this.rawGroups).pipe(
        map((groups: Group[] | undefined) => this.filterAndSortGroups(groups))
      );
    }
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

    if (this.filterCreator) {
      const lowerFilterCreator: string = this.filterCreator.toLowerCase();
      filteredGroups = filteredGroups.filter((group: Group) => {
        const creatorName: string = (group.creatorName || '').toLowerCase();
        return creatorName.includes(lowerFilterCreator);
      });
    }

    if (this.filterCreationDateFrom) {
      const fromDate: Date = new Date(this.filterCreationDateFrom);
      filteredGroups = filteredGroups.filter((group: Group) => {
        if (!group.creationDate) {
          return false;
        }
        const groupDate: Date = new Date(group.creationDate);
        return groupDate >= fromDate;
      });
    }

    if (this.filterCreationDateTo) {
      const toDate: Date = new Date(this.filterCreationDateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredGroups = filteredGroups.filter((group: Group) => {
        if (!group.creationDate) {
          return false;
        }
        const groupDate: Date = new Date(group.creationDate);
        return groupDate <= toDate;
      });
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
   * Checks if a group has members.
   * @param group The Group object
   * @returns True if the group has at least one member
   */
  public hasMembers(group: Group): boolean {
    const memberCount: number = this.getMemberCount(group);
    return memberCount > 0;
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
  /**
   * Checks if a group row should be highlighted as recently created or updated.
   * @param groupId The ID of the group to check
   * @returns True if the group was recently created or updated and should be highlighted
   */
  public isRowHighlighted(groupId: number | undefined): boolean {
    return groupId !== undefined && groupId === this.lastModifiedGroupId;
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
        
        // Highlight the newly created row
        this.lastModifiedGroupId = result.id || null;
        
        this.refreshData(true); // Refetch from server after creation
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          this.lastModifiedGroupId = null;
        }, 3000);
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
        this.lastModifiedGroupId = result.id || null;
        
        this.refreshData(true); // Refetch from server after update
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          this.lastModifiedGroupId = null;
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

    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    // Configure the confirmation dialog using the initialize method
    const groupName: string = group.name || $localize`:@@unknown:Unknown`;
    const baseMessage: string = $localize`Are you sure you want to delete this group? This action cannot be undone.`;
    const message: string = baseMessage.replace('this group', `<strong>${groupName}</strong>`);

    modalRef.componentInstance.initialize(
      $localize`Confirm Deletion`,
      message,
      $localize`Delete`,
      $localize`Cancel`,
      'btn-danger',
      'delete'
    );

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
        this.refreshData(true); // Refetch from server after deletion
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
   * Handles when group members have been updated by the membership panel.
   * Refreshes the groups list to show the updated data and highlights the updated group row.
   * @param groupId The ID of the group that was updated
   */
  public onMembersUpdated(groupId: number): void {
    // Highlight the updated row
    this.lastModifiedGroupId = groupId;
    
    this.refreshData(true); // Refetch from server after member update
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      this.lastModifiedGroupId = null;
    }, 3000);
  }
}

