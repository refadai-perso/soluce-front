/**
 * User management page component.
 * Displays the user card component for managing users.
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UserCardComponent } from '../Components/User/user-card.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  templateUrl: './user-management.component.html',
  imports: [UserCardComponent, CommonModule]
})
export class UserManagementComponent {
  constructor() {}
}

