import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  navItems = [
    { path: '/worker/alumnos', label: 'Alumnos', icon: 'fas fa-users' },
    { path: '/worker/matriculas', label: 'Matrículas', icon: 'fas fa-file-alt' },
    { path: '/worker/asistencias', label: 'Asistencias', icon: 'fas fa-check-square' },
    { path: '/worker/comunicados', label: 'Comunicados', icon: 'fas fa-envelope' },
    { path: '/worker/tarjetas', label: 'Tarjetas', icon: 'fas fa-id-card' },
    { path: '/worker/socios', label: 'Socios', icon: 'fas fa-user-friends' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
      console.log('Intentando navegar a /login');
      this.router.navigate(['/login']).then(success => {
        if (success) {
          console.log('Navegación a /login exitosa');
        } else {
          console.error('Navegación a /login falló');
        }
      }).catch(error => {
        console.error('Error en la navegación:', error);
      });
    }
  }
}