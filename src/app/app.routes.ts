import { Routes } from '@angular/router';
import { WorkerLayoutComponent } from './layouts/worker/worker-layout/worker-layout.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth/guards/auth.guard';
import { AdminLayoutComponent } from './layouts/admin/admin-layout/admin-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'worker',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./layouts/worker/worker.routes').then((m) => m.WORKER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./layouts/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '/login' },
];
