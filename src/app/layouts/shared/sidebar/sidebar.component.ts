import {
  Component,
  OnInit,
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
          <h1>MICOLE</h1>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li *ngFor="let item of navItems">
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: false }"
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
export class SidebarComponent implements OnInit {
  navItems: any[] = [];
  userRole: string = '';
  isSidebarOpen: boolean = false;
  isMobile: boolean = false;
  @ViewChild('logoutDialog', { static: true }) logoutDialog!: TemplateRef<any>;

  adminItems = [
    { path: '/admin/colegios', label: 'Crear Colegio', icon: 'fas fa-school' },
    {
      path: '/admin/trabajadores',
      label: 'Crear Trabajador',
      icon: 'fas fa-user-plus',
    },
    { path: '/admin/alumnos', label: 'Alumnos', icon: 'fas fa-users' },
    { path: '/admin/matriculas', label: 'Matrículas', icon: 'fas fa-file-alt' },
  ];
  workerItems = [
    { path: '/worker/alumnos', label: 'Alumnos', icon: 'fas fa-users' },
    {
      path: '/worker/notas',
      label: 'Notas',
      icon: 'fas fa-file-alt',
    },
    {
      path: '/worker/asistencias',
      label: 'Asistencias',
      icon: 'fas fa-check-square',
    },
    {
      path: '/worker/comunicados',
      label: 'Comunicados',
      icon: 'fas fa-envelope',
    },
    { path: '/worker/tarjetas', label: 'Tarjetas', icon: 'fas fa-id-card' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUserRole();
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.checkScreenSize.bind(this));
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
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.isSidebarOpen = false; // Cierra el sidebar en móvil por defecto
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
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
      });
    }
  }

  onCancel() {
    this.dialog.closeAll();
  }

  onConfirm() {
    this.dialog.closeAll();
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
      window.removeEventListener('resize', this.checkScreenSize.bind(this));
    }
  }
}
