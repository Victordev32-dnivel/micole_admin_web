import { Component, OnInit, HostListener } from '@angular/core';
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
  isSidebarOpen: boolean = false;

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
    { path: '/worker/socios', label: 'Socios', icon: 'fas fa-user-friends' },
    { path: '/worker/apoderado', label: 'Apoderado', icon: 'fas fa-user-friends' }
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

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  onNavItemClick() {
    // Cerrar sidebar en móviles al hacer click en un elemento de navegación
    if (window.innerWidth <= 992) {
      this.closeSidebar();
    }
  }

  getUserRoleDisplay(): string {
    return this.userRole === 'admin' ? 'Administrador' : 'Trabajador';
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

  // Cerrar sidebar al hacer click fuera en desktop
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (isPlatformBrowser(this.platformId)) {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('.sidebar');
      const hamburgerBtn = document.querySelector('.hamburger-btn');
      
      if (this.isSidebarOpen && 
          sidebar && 
          hamburgerBtn && 
          !sidebar.contains(target) && 
          !hamburgerBtn.contains(target)) {
        this.closeSidebar();
      }
    }
  }

  // Cerrar sidebar con tecla ESC
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  // Ajustar sidebar en cambio de tamaño de ventana
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    if (isPlatformBrowser(this.platformId)) {
      if (window.innerWidth > 992) {
        this.isSidebarOpen = false;
      }
    }
  }
}