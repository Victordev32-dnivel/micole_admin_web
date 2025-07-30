import { Component, OnInit } from '@angular/core';
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
export class SidebarComponent implements OnInit {
  navItems: any[] = [];
  userRole: string = '';

  adminItems = [
    { path: '/admin/colegios', label: 'Crear Colegio', icon: 'fas fa-school' },
    { path: '/admin/trabajadores', label: 'Crear Trabajador', icon: 'fas fa-user-plus' },
    { path: '/admin/alumnos', label: 'Alumnos', icon: 'fas fa-users' },
    { path: '/admin/matriculas', label: 'Matrículas', icon: 'fas fa-file-alt' }
  ];
  workerItems = [
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

  ngOnInit() {
    this.loadUserRole();
  }

  loadUserRole() {
    const userData = this.authService.getUserData();
    if (userData) {
      this.userRole = userData.tipoUsuario;
      this.navItems = this.userRole === 'admin' ? this.adminItems : this.workerItems;
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.authService.logout();
      this.router.navigate(['/login']).then(success => {
        if (!success) {
          console.error('Navegación a /login falló');
        }
      }).catch(error => {
        console.error('Error en la navegación:', error);
      });
    }
  }
}