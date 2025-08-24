import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgregarSocioComponent } from './agregar-socio.component';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserData, UserService } from '../../../../services/UserData';

@Component({
  selector: 'app-socio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './socio.component.html',
  styleUrls: ['./socio.component.css'],
})
export class SocioComponent implements OnInit, OnDestroy {
  socios: any[] = [];
  filteredSocios: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTermControl = new FormControl('');
  colegioId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('🚀 SocioComponent inicializado');
    this.loadUserData();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    console.log('📊 Cargando datos de usuario...');

    // Obtener datos del usuario al inicializar
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      console.log('🏫 ID del colegio:', this.colegioId);
      this.loadSocios();
    } else {
      console.log('❌ No se pudieron obtener datos del usuario inicialmente');
      this.error = 'No se pudieron obtener los datos del usuario';
      this.loading = false;
    }

    // Suscribirse a cambios en los datos del usuario
    this.userService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userData: UserData | null) => {
        console.log('🔄 Actualización de datos de usuario:', userData);
        if (userData && userData.colegio !== this.colegioId) {
          this.colegioId = userData.colegio;
          this.loadSocios();
        }
      });
  }

  private setupSearch(): void {
    this.searchTermControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filterSocios(term || '');
      });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    console.log('🔑 Token para headers:', jwtToken ? 'Presente' : 'Ausente');

    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken || '732612882'}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  loadSocios() {
    console.log('📋 Cargando socios...');

    // Validar que tengamos el ID del colegio
    if (!this.colegioId) {
      console.error('❌ ID del colegio no disponible');
      this.error = 'Error: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/colegio/lista/${this.colegioId}`;
    console.log('🌐 URL de solicitud:', url);

    this.http
      .get<any>(url, {
        headers: this.getHeaders(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          console.log('✅ Respuesta exitosa:', resp);
          this.ngZone.run(() => {
            // Manejo más robusto de la respuesta
            let sociosData = [];
            if (Array.isArray(resp)) {
              sociosData = resp;
            } else if (resp && resp.data && Array.isArray(resp.data)) {
              sociosData = resp.data;
            } else if (resp && resp.socios && Array.isArray(resp.socios)) {
              sociosData = resp.socios;
            } else if (resp && typeof resp === 'object') {
              // Si la respuesta es un objeto pero no tiene data, intentar extraer los socios
              const keys = Object.keys(resp);
              if (keys.length === 1 && Array.isArray(resp[keys[0]])) {
                sociosData = resp[keys[0]];
              }
            }

            this.socios = sociosData;
            this.filteredSocios = [...this.socios];
            this.loading = false;
            console.log(`👥 ${this.socios.length} socios cargados`);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error al cargar socios:', error);
          this.ngZone.run(() => {
            let errorMessage = 'Error al cargar los socios. Intente de nuevo';

            if (error.status === 404) {
              errorMessage = 'No se encontraron socios para este colegio';
            } else if (error.status === 403) {
              errorMessage =
                'No tiene permisos para acceder a esta información';
            } else if (error.status === 401) {
              errorMessage =
                'Sesión expirada. Por favor, inicie sesión nuevamente';
            } else if (error.status === 0) {
              errorMessage = 'Error de conexión. Verifique su internet';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.error = errorMessage;
            this.loading = false;

            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });

            this.cdr.detectChanges();
          });
        },
      });
  }

  filterSocios(term: string) {
    this.ngZone.run(() => {
      const search = term.toLowerCase().trim();
      if (!search) {
        this.filteredSocios = [...this.socios];
        return;
      }

      this.filteredSocios = this.socios.filter((socio) => {
        const byNombre =
          socio?.nombre?.toLowerCase()?.includes(search) || false;
        const byRazonSocial =
          socio?.razonSocial?.toLowerCase()?.includes(search) || false;
        const byRuc =
          socio?.ruc?.toLowerCase?.()?.includes(search) ||
          (socio?.ruc || '').toString().toLowerCase().includes(search);
        const byTelefono =
          socio?.telefono?.toLowerCase()?.includes(search) ||
          (socio?.telefono || '').toString().includes(search);
        const byEmail = socio?.email?.toLowerCase()?.includes(search) || false;

        return byNombre || byRazonSocial || byRuc || byTelefono || byEmail;
      });

      console.log(
        `🔍 Filtrado: ${this.filteredSocios.length} de ${this.socios.length} socios`
      );
      this.cdr.detectChanges();
    });
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  // Método para abrir cliente de email
  openEmailClient(email: string): void {
    if (email && email !== 'N/A') {
      window.open(`mailto:${email}`, '_blank');
    }
  }

  // Método para tracking en ngFor (mejor performance)
  trackBySocioId(index: number, socio: any): any {
    return socio.id || socio.ruc || index;
  }

  openAddDialog() {
    if (!this.colegioId) {
      this.snackBar.open('❌ Error: ID del colegio no disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }

    const dialogRef = this.dialog.open(AgregarSocioComponent, {
      width: '600px',
      data: { colegioId: this.colegioId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadSocios(); // Recargar la lista después de agregar/editar
      }
    });
  }

  openEditDialog(socio: any) {
  const dialogRef = this.dialog.open(AgregarSocioComponent, {
    width: '600px',
    data: { 
      colegioId: this.colegioId,
      socio: socio 
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadSocios(); // Recargar la lista después de editar
    }
  });
}



  confirmDelete(socio: any) {
    console.log('🗑️ Confirmando eliminación de socio:', socio);
    // Aquí implementarás el modal de confirmación para eliminar
    // const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
    //   width: '400px',
    //   data: {
    //     title: 'Eliminar Socio',
    //     message: `¿Está seguro de que desea eliminar a ${socio.nombre || socio.razonSocial}?`,
    //     socio: socio
    //   }
    // });
    //
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.deleteSocio(socio);
    //   }
    // });

    // Por ahora, mostrar un mensaje
    this.snackBar.open(
      `🗑️ Eliminando: ${socio.nombre || socio.razonSocial}`,
      'Cerrar',
      {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
      }
    );
  }

  // Método para eliminar socio (implementación futura)
  private deleteSocio(socio: any): void {
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/${socio.id}`;

    this.http
      .delete(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ Socio eliminado correctamente', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          this.loadSocios(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error al eliminar socio:', error);
          this.snackBar.open('❌ Error al eliminar el socio', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
        },
      });
  }

  // Método para refrescar la lista manualmente
  refreshSocios(): void {
    console.log('🔄 Refrescando lista de socios');
    this.loadSocios();
  }

  // Método para exportar datos (implementación futura)
  exportSocios(): void {
    console.log('📤 Exportando socios');
    // Implementar exportación a Excel/CSV
    this.snackBar.open('🚧 Función de exportación en desarrollo', 'Cerrar', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }
}
