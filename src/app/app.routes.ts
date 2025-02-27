/**
* Generated by JitBlox - rapid interactive prototyping of modern web apps from your browser.
* Upgrade to a Pro plan to remove this header, see https://www.jitblox.com/plans for more.
* 
* Check out this JitBlox project, Soluce, at https://www.jitblox.com/project/5JHnGKTPaU/soluce
*/

import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AdminComponent } from './components/Pages/admin.component';
import { CustomerSearchComponent } from './components/Pages/customer-search.component';
import { DashboardComponent } from './components/Pages/dashboard.component';
import { FindProblemOutletComponent } from './components/Pages/find-problem-outlet.component';
import { ProblemAddComponent } from './components/Pages/problem-add.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'orders',
    component: FindProblemOutletComponent
  },
  {
    path: 'problem-add',
    component: ProblemAddComponent
  },
  {
    path: 'customer-search',
    component: CustomerSearchComponent
  },
  {
    path: 'admin',
    component: AdminComponent
  },
  {
    path: 'app',
    component: AppComponent
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
