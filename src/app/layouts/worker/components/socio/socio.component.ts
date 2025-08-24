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
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { UserData, UserService } from '../../../../services/UserData';

// IMPORTACIONES DE COMPONENTES

import { AgregarSocioComponent } from './agregar-socio.component';
import { ModificarSocioComponent } from './modificar-socio.component';

interface Colegio {
  id: number;
  nombre: string;
  celular: string;
}

interface SocioWithColegios {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  contrasena: string;
  idColegios: number[];
  telefono: string;
  colegiosNombres?: string[];
}

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
  // PROPIEDADES
  socios: SocioWithColegios[] = [];
  filteredSocios: SocioWithColegios[] = [];
  colegios: Colegio[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTermControl = new FormControl('');
  colegioId: number | null = null;

  private destroy$ = new Subject<void>();

  // CONSTRUCTOR
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  // MÉTODOS DEL CICLO DE VIDA
  ngOnInit(): void {
    console.log('🚀 SocioComponent inicializado');
    this.loadUserData();
    this.setupSearch();
    this.loadColegios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // MÉTODOS PRIVADOS DE INICIALIZACIÓN
  private loadUserData(): void {
    console.log('📊 Cargando datos de usuario...');
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

  // MÉTODO PARA CARGAR COLEGIOS
  private loadColegios(): void {
    console.log('🏫 Cargando lista de colegios...');
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista`;
    
    this.http
      .get<{data: Colegio[]}>(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          console.log('✅ Colegios cargados:', resp);
          this.colegios = resp.data || [];
          // Actualizar socios con nombres de colegios si ya están cargados
          if (this.socios.length > 0) {
            this.updateSociosWithColegios();
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar colegios:', error);
        },
      });
  }

  // MÉTODO PARA ACTUALIZAR SOCIOS CON NOMBRES DE COLEGIOS
  private updateSociosWithColegios(): void {
    this.socios = this.socios.map(socio => ({
      ...socio,
      colegiosNombres: this.getColegiosNombres(socio.idColegios)
    }));
    this.filteredSocios = [...this.socios];
    this.cdr.detectChanges();
  }

  // MÉTODO PARA OBTENER NOMBRES DE COLEGIOS
  private getColegiosNombres(idColegios: number[]): string[] {
    if (!idColegios || !Array.isArray(idColegios)) return [];
    
    return idColegios.map(id => {
      const colegio = this.colegios.find(c => c.id === id);
      return colegio ? colegio.nombre : `Colegio ID: ${id}`;
    });
  }

  // MÉTODOS DE DATOS
  public loadSocios(): void {
    console.log('📋 Cargando socios...');
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

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/colegio/lista`;
    console.log('🌐 URL de solicitud:', url);

    this.http
      .get<any>(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          console.log('✅ Respuesta exitosa:', resp);
          this.ngZone.run(() => {
            let sociosData: SocioWithColegios[] = [];
            if (Array.isArray(resp)) {
              sociosData = resp;
            } else if (resp && resp.data && Array.isArray(resp.data)) {
              sociosData = resp.data;
            } else if (resp && resp.socios && Array.isArray(resp.socios)) {
              sociosData = resp.socios;
            } else if (resp && typeof resp === 'object') {
              const keys = Object.keys(resp);
              if (keys.length === 1 && Array.isArray(resp[keys[0]])) {
                sociosData = resp[keys[0]];
              }
            }

            // Agregar nombres de colegios si ya tenemos la lista
            this.socios = sociosData.map(socio => ({
              ...socio,
              colegiosNombres: this.getColegiosNombres(socio.idColegios)
            }));
            
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
              errorMessage = 'No tiene permisos para acceder a esta información';
            } else if (error.status === 401) {
              errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
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

  public filterSocios(term: string): void {
    this.ngZone.run(() => {
      const search = term.toLowerCase().trim();
      if (!search) {
        this.filteredSocios = [...this.socios];
        return;
      }

      this.filteredSocios = this.socios.filter((socio) => {
        const byNombre = socio?.nombre?.toLowerCase()?.includes(search) || false;
        const byApellidos = socio?.apellidos?.toLowerCase()?.includes(search) || false;
        const byDni = socio?.dni?.toLowerCase?.()?.includes(search) ||
          (socio?.dni || '').toString().toLowerCase().includes(search);
        const byTelefono = socio?.telefono?.toLowerCase()?.includes(search) ||
          (socio?.telefono || '').toString().includes(search);
        const byColegios = socio?.colegiosNombres?.some(nombre => 
          nombre.toLowerCase().includes(search)) || false;

        return byNombre || byApellidos || byDni || byTelefono || byColegios;
      });

      console.log(`🔍 Filtrado: ${this.filteredSocios.length} de ${this.socios.length} socios`);
      this.cdr.detectChanges();
    });
  }

  // MÉTODOS PÚBLICOS DE ACCIÓN
  public openAddDialog(): void {
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
        this.loadSocios();
      }
    });
  }

  public editSocio(socio: SocioWithColegios): void {
    console.log('✏️ Editando socio:', socio);
    
    if (!this.colegioId) {
      this.snackBar.open('❌ Error: ID del colegio no disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }

    const dialogRef = this.dialog.open(ModificarSocioComponent, {
      width: '600px',
      disableClose: true,
      data: { 
        socio: socio,
        colegioId: this.colegioId 
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('🔄 Diálogo de edición cerrado:', result);
      if (result) {
        this.loadSocios();
        this.snackBar.open('🔄 Lista actualizada', 'Cerrar', {
          duration: 2000,
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });
      }
    });
  }

  public confirmDelete(socio: SocioWithColegios): void {
    console.log('🗑️ Confirmando eliminación de socio:', socio);
    
    if (confirm(`¿Está seguro de que desea eliminar a ${socio.nombre} ${socio.apellidos}?`)) {
      this.deleteSocio(socio);
    }
  }

  public refreshSocios(): void {
    console.log('🔄 Refrescando lista de socios');
    this.loadSocios();
  }

  public exportSocios(): void {
    console.log('📤 Exportando socios');
    this.snackBar.open('🚧 Función de exportación en desarrollo', 'Cerrar', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }

  // MÉTODOS UTILITARIOS
  public clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  public openEmailClient(email: string): void {
    if (email && email !== 'N/A') {
      window.open(`mailto:${email}`, '_blank');
    }
  }

  public trackBySocioId(index: number, socio: SocioWithColegios): any {
    return socio.id || index;
  }

  public formatColegios(colegiosNombres: string[] | undefined): string {
    if (!colegiosNombres || colegiosNombres.length === 0) {
      return 'Sin colegios';
    }
    return colegiosNombres.join(', ');
  }

  public formatIdColegios(idColegios: number[] | undefined): string {
    if (!idColegios || idColegios.length === 0) {
      return 'N/A';
    }
    return idColegios.join(', ');
  }

  private deleteSocio(socio: SocioWithColegios): void {
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
          this.loadSocios();
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
}