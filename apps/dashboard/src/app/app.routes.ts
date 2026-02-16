import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminOnlyGuard } from './guards/role.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { AuditLogComponent } from './pages/audit-log/audit-log.component';
import { CreateOrganizationComponent } from './pages/organizations/create-organization.component';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'organizations/new', component: CreateOrganizationComponent },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  {
    path: 'audit-log',
    component: AuditLogComponent,
    canActivate: [authGuard, adminOnlyGuard],
  },
  { path: '**', redirectTo: 'tasks' },
];
