import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { ColegioListComponent } from './components/colegios/colegio-list/colegio-list.component';
import { TrabajadoresListComponent } from './components/trabajadores/trabajadores-list/trabajadores-list.component';
import { SocioComponent } from '../worker/components/socio/socio.component';
// Necesitas importar el SocioListComponent (si existe)
import { AnuncioSocioListComponent } from './components/anuncioSocio/anuncioSocio-list.component'; // Ajusta la ruta según tu estructura

export const ADMIN_ROUTES: Routes = [
  {
    path: '', // La ruta base se define en el app-routing.module.ts
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'colegios', pathMatch: 'full' }, // Redirección por defecto
      { path: 'colegios', component: ColegioListComponent },
      { path: 'trabajadores', component: TrabajadoresListComponent },
      { path: 'socio', component: SocioComponent },
      { path: 'anuncios', component: AnuncioSocioListComponent } 
      // Cambiado a 'anuncios' para coincidir con el sidebar
    ],
  },
];