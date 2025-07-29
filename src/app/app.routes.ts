import { Routes } from '@angular/router';
import { WorkerLayoutComponent } from './layouts/worker/worker-layout/worker-layout.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'worker',
    component: WorkerLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./layouts/worker/worker.routes').then(m => m.WORKER_ROUTES)
  },
  { path: '**', redirectTo: '/login' }
];