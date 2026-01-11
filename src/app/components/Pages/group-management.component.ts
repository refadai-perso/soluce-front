/**
 * Group management page component.
 * Displays the group card component for managing groups.
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GroupCardComponent } from '../Components/Group/group-card.component';

@Component({
  selector: 'app-group-management',
  standalone: true,
  templateUrl: './group-management.component.html',
  imports: [GroupCardComponent, CommonModule]
})
export class GroupManagementComponent {
  constructor() {}
}



