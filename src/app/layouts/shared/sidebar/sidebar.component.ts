import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatDialogModule,
    MatButtonModule,
  ],
  template: `
    <div class="sidebar-container">
      <button class="menu-toggle" (click)="toggleSidebar()" *ngIf="isMobile">
        <i class="fas fa-bars"></i>
      </button>
      <div class="sidebar" [class.open]="isSidebarOpen">
        <div class="sidebar-header">
          <img src="assets/Logo-Appsistencia.png" alt="Logo" class="logo" />
          <h1>MiCole</h1>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li *ngFor="let item of navItems">
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
                (click)="onNavItemClick(item)"
              >
                <i [class]="item.icon"></i>
                {{ item.label }}
              </a>
            </li>
          </ul>
        </nav>
        <div class="sidebar-footer">
          <button (click)="openLogoutDialog()" class="logout-btn">
            Cerrar Sesión
          </button>
        </div>

        <!-- Modal embebido como TemplateRef -->
        <ng-template #logoutDialog>
          <h2 mat-dialog-title>Confirmar Cierre de Sesión</h2>
          <mat-dialog-content>
            <p>¿Estás seguro de que deseas cerrar sesión?</p>
          </mat-dialog-content>
          <mat-dialog-actions>
            <button mat-button (click)="onCancel()">Cancelar</button>
            <button mat-button (click)="onConfirm()" cdkFocusInitial>
              Confirmar
            </button>
          </mat-dialog-actions>
        </ng-template>
      </div>
    </div>
  `,
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  navItems: any[] = [];
  userRole: string = '';
  isSidebarOpen: boolean = false;
  isMobile: boolean = false;
  @ViewChild('logoutDialog', { static: true }) logoutDialog!: TemplateRef<any>;

  adminItems = [
    { path: '/admin/colegios', label: 'Colegios', icon: 'fas fa-school' },
    {
      path: '/admin/trabajadores',
      label: 'Trabajadores',
      icon: 'fas fa-user-plus',
    },
    {
      path: '/admin/socio',
      label: 'Socio',
      icon: 'fas fa-handshake',
    },
    {
      path: '/admin/anuncios',
      label: 'Anuncios',
      icon: 'fas fa-bullhorn',
    },
  ];
  
  workerItems = [
    { path: '/worker/alumnos', label: 'Alumnos', icon: 'fas fa-users' },
    { path: '/worker/notas', label: 'Notas', icon: 'fas fa-file-alt' },
    {
      path: '/worker/asistencias',
      label: 'Asistencias',
      icon: 'fas fa-check-square',
    },
    {
      path: '/worker/salidas',
      label: 'Salidas',
      icon: 'fas fa-sign-out-alt',
    },
    {
      path: '/worker/comunicados',
      label: 'Comunicados',
      icon: 'fas fa-envelope',
    },
    {
      path: '/worker/apoderado',
      label: 'Apoderados',
      icon: 'fas fa-user-friends',
    },
    { path: '/worker/tarjetas', label: 'Tarjetas', icon: 'fas fa-id-card' },
    { path: '/worker/salones', label: 'Salones', icon: 'fas fa-chalkboard' },
  ];

  private resizeListener: () => void;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {
    this.resizeListener = this.checkScreenSize.bind(this);
  }

  ngOnInit() {
    this.loadUserRole();
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.resizeListener);
    }
  }

  loadUserRole() {
    const userData = this.authService.getUserData();
    if (userData) {
      this.userRole = userData.tipoUsuario;
      this.navItems =
        this.userRole === 'admin' ? this.adminItems : this.workerItems;
    }
  }

  checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        this.isSidebarOpen = false;
      }
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  }

  // Nuevo método para manejar clics en elementos de navegación
  onNavItemClick(item: any) {
    console.log('Navegando a:', item.path, 'Label:', item.label);
    
    // Cerrar sidebar en móvil después de hacer clic
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
    
    // Navegación manual como respaldo
    this.router.navigate([item.path]).then(
      (success) => {
        if (success) {
          console.log('Navegación exitosa a:', item.path);
        } else {
          console.error('Error: No se pudo navegar a:', item.path);
        }
      }
    ).catch(error => {
      console.error('Error de navegación:', error);
    });
  }

  openLogoutDialog() {
    if (isPlatformBrowser(this.platformId)) {
      const dialogRef = this.dialog.open(this.logoutDialog, {
        width: '400px',
        height: 'auto',
        data: {},
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === true) {
          this.performLogout();
        }
      });
    }
  }

  onCancel() {
    this.dialog.closeAll();
  }

  onConfirm() {
    this.dialog.closeAll();
    this.performLogout();
  }

  private performLogout() {
    this.authService.logout();
    this.router
      .navigate(['/login'])
      .then((success) => {
        if (!success) {
          console.error('Navegación a /login falló');
        }
      })
      .catch((error) => {
        console.error('Error en la navegación:', error);
      });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
}