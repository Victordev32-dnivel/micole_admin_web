import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { ColegioListComponent } from './components/colegios/colegio-list/colegio-list.component';
import { TrabajadoresListComponent } from './components/trabajadores/trabajadores-list/trabajadores-list.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '', // La ruta base se define en el app-routing.module.ts
    component: AdminLayoutComponent,
    children: [
      { path: 'colegios', component: ColegioListComponent },
      { path: 'trabajadores', component: TrabajadoresListComponent },
      { path: '', redirectTo: 'colegios', pathMatch: 'full' }, // Ruta por defecto
      { path: '**', redirectTo: 'colegios' } // Redirección para rutas no encontradas
    ]
  }
];