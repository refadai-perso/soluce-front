/**
 * Component for selecting a group with authorization level.
 * Displays a slide-in side panel with searchable group list and authorization level selection.
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Authorization } from '@shared/dto/group/authorization.enum';
import { Group } from '../../../model/model';

@Component({
  selector: 'app-group-selection-panel',
  standalone: true,
  templateUrl: './group-selection-panel.component.html',
  styleUrls: ['./group-selection-panel.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class GroupSelectionPanelComponent implements OnChanges {
  /**
   * Available groups to select from.
   */
  @Input() availableGroups: Group[] = [];

  /**
   * IDs of groups that should be excluded from selection (already added).
   */
  @Input() excludedGroupIds: number[] = [];

  /**
   * Whether the panel is currently open/visible.
   */
  @Input() isOpen: boolean = false;

  /**
   * Emits when the panel should be closed.
   */
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits when a group is selected with an authorization level.
   * Emits: { group: Group, authorizationLevel: Authorization }
   */
  @Output() groupSelected: EventEmitter<{ group: Group; authorizationLevel: Authorization }> = 
    new EventEmitter<{ group: Group; authorizationLevel: Authorization }>();

  /**
   * Currently selected group in the panel.
   */
  public selectedGroup: Group | null = null;

  /**
   * Selected authorization level.
   */
  public selectedAuthLevel: Authorization = Authorization.READER;

  /**
   * Search filter for groups.
   */
  public searchFilter: string = '';

  /**
   * Available authorization levels.
   */
  public readonly authorizationLevels: ReadonlyArray<Authorization> = [
    Authorization.ADMINISTRATOR,
    Authorization.CONTRIBUTOR,
    Authorization.READER
  ];

  /**
   * Filters available groups based on search term.
   * @returns Filtered list of groups
   */
  public getFilteredGroups(): Group[] {
    if (this.searchFilter.trim() === '') {
      return [...this.availableGroups];
    }
    const filterLower: string = this.searchFilter.toLowerCase();
    return this.availableGroups.filter((group: Group) => {
      const nameMatch: boolean = group.name?.toLowerCase().includes(filterLower) ?? false;
      const descMatch: boolean = group.description?.toLowerCase().includes(filterLower) ?? false;
      return nameMatch || descMatch;
    });
  }

  /**
   * Gets groups that are not excluded (not already added).
   * @returns Available groups that can be selected
   */
  public getAvailableGroupsForSelection(): Group[] {
    console.log('getAvailableGroupsForSelection - availableGroups:', this.availableGroups);
    console.log('getAvailableGroupsForSelection - excludedGroupIds:', this.excludedGroupIds);
    const filtered: Group[] = this.getFilteredGroups();
    console.log('getAvailableGroupsForSelection - filtered:', filtered);
    const result: Group[] = filtered.filter((group: Group) => {
      if (group.id === undefined || group.id === null) {
        console.log('Filtering out group without ID:', group);
        return false;
      }
      const isExcluded: boolean = this.excludedGroupIds.includes(group.id);
      if (isExcluded) {
        console.log('Filtering out excluded group:', group);
      }
      return !isExcluded;
    });
    console.log('getAvailableGroupsForSelection - result:', result);
    return result;
  }

  /**
   * Called when input properties change.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableGroups']) {
      console.log('availableGroups changed:', changes['availableGroups'].currentValue);
    }
    if (changes['excludedGroupIds']) {
      console.log('excludedGroupIds changed:', changes['excludedGroupIds'].currentValue);
    }
  }

  /**
   * Handles selecting a group in the panel.
   * @param group The group to select
   */
  public onSelectGroup(group: Group): void {
    this.selectedGroup = group;
  }

  /**
   * Handles closing the panel.
   */
  public onClose(): void {
    this.selectedGroup = null;
    this.searchFilter = '';
    this.selectedAuthLevel = Authorization.READER;
    this.close.emit();
  }

  /**
   * Handles confirming the selection and emitting the result.
   */
  public onConfirmSelection(): void {
    if (this.selectedGroup === null) {
      return;
    }
    this.groupSelected.emit({
      group: this.selectedGroup,
      authorizationLevel: this.selectedAuthLevel
    });
    this.onClose();
  }

  /**
   * Returns the Bootstrap text color class based on authorization level.
   * @param authLevel The authorization level
   * @returns A Bootstrap text color class name
   */
  public getAuthorizationBadgeClass(authLevel: Authorization | string | undefined): string {
    switch (authLevel) {
      case Authorization.ADMINISTRATOR:
        return 'text-danger';
      case Authorization.CONTRIBUTOR:
        return 'text-warning';
      case Authorization.READER:
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  /**
   * Returns a Bootstrap icon class for the authorization level.
   * @param authLevel The authorization level (string or Authorization enum)
   * @returns A Bootstrap icon class name
   */
  public getAuthorizationIcon(authLevel: Authorization | string | undefined): string {
    const level: string = typeof authLevel === 'string' ? authLevel : authLevel ?? '';
    switch (level) {
      case Authorization.ADMINISTRATOR:
      case 'ADMINISTRATOR':
        return 'bi-shield-fill-check';
      case Authorization.CONTRIBUTOR:
      case 'CONTRIBUTOR':
        return 'bi-pencil-fill';
      case Authorization.READER:
      case 'READER':
        return 'bi-eye-fill';
      default:
        return 'bi-question-circle';
    }
  }
}

