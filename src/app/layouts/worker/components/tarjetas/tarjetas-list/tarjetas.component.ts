import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EditTarjetaModalComponent } from '../edit-tarjeta-modal/edit-tarjeta-modal.component';
import { ConfirmDeleteModalComponent } from '../tarjetas-list/eliminar.component';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { AddTarjetaModalComponent } from '../add-tarjeta-modal/add-tarjeta-modal.component';
import { UserService } from '../../../../../services/UserData';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import { catchError, throwError, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Respuesta de cada tarjeta del backend
interface TarjetaApiResponse {
  id: number;
  rfid: number;
  codigo: string;
  alumnoId: number | null;
  alumnoNombre: string | null;
  alumnoDocumento: string | null;
  activo: boolean;
}

// Respuesta paginada del backend
interface TarjetasApiResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalTarjetas: number;
  data: TarjetaApiResponse[];
}

// Modelo interno para la tabla
interface TarjetaConAlumno {
  id: number;
  rfid: number;
  codigo: string;
  activo: boolean;
  alumnoId: number | null;
  alumnoNombre: string | null;
  alumnoDocumento: string | null;
}

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono?: string | null;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

interface TarjetaUpdateData {
  rfid: number;
  codigo: string;
  idAlumno: number;
  idColegio: number;
  activo: boolean; // Agregado campo activo
}

@Component({
  selector: 'app-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    HttpClientModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    PaginationComponent,
  ],
  templateUrl: './tarjetas.component.html',
  styleUrls: ['./tarjetas.component.css'],
})
export class TarjetasComponent implements OnInit {
  tarjetaForm: FormGroup;
  tarjetas: TarjetaConAlumno[] = [];
  filteredTarjetas: TarjetaConAlumno[] = [];
  loading: boolean = false;
  loadingMessage: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  totalTarjetas: number = 0;

  // Paginación y filtros
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  filtroActivo: string = 'todas'; // 'todas', 'activas', 'inactivas'

  private readonly baseUrl = '/api';
  private readonly apiUrlTarjetaLista = `${this.baseUrl}/tarjeta/colegio`;
  private readonly apiUrlTarjeta = `${this.baseUrl}/tarjeta`;

  displayedColumns: string[] = [
    'id',
    'rfid',
    'codigo',
    'alumno',
    'estado',
    'activo', // Agregada columna para el toggle de activo
    'acciones',
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {
    this.tarjetaForm = this.fb.group({
      searchTerm: [''],
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.setupSearchListener();
    }
  }

  private loadUserData(): void {
    try {
      const userData = this.userService.getUserData();
      
      if (userData) {
        // Casting para permitir acceso dinámico a propiedades
        const userDataAny = userData as any;
        
        // Verificar diferentes propiedades posibles para el ID del colegio
        this.colegioId = userData.colegio || userDataAny.idColegio || userDataAny.colegioId || userDataAny.id_colegio;
        
        // TEMPORAL: Para testing, usar ID 1 si no se encuentra otro
        if (!this.colegioId || this.colegioId === 0) {
          console.warn('⚠️ ColegioId no válido, usando ID 1 para testing');
          this.colegioId = 1; // Usar 1 temporalmente para testing
        }
        
        this.loadData();
        
      } else {
        // Si no hay userData, usar ID 1 para testing
        console.warn('⚠️ No hay userData, usando colegioId = 1 para testing');
        this.colegioId = 1;
        this.loadData();
      }

      // Suscribirse a cambios en userData
      this.userService.userData$.subscribe((newUserData) => {
        if (newUserData) {
          const newUserDataAny = newUserData as any;
          const newColegioId = newUserData.colegio || newUserDataAny.idColegio || newUserDataAny.colegioId || newUserDataAny.id_colegio || 1;
          
          if (newColegioId && newColegioId !== this.colegioId) {
            this.colegioId = newColegioId;
            this.loadData();
            this.cdr.detectChanges();
          }
        }
      });
    } catch (error) {
      console.error('❌ Error en loadUserData:', error);
      // En caso de error, usar ID 1 para testing
      this.colegioId = 1;
      this.error = 'Error al cargar datos del usuario, usando datos de prueba';
      this.loadData();
    }
  }

  private setupSearchListener(): void {
    this.tarjetaForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((term) => {
      this.currentPage = 1;
      this.loadAllTarjetas(1, term?.trim() || '');
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage =
          error.error?.message ||
          error.message ||
          `Error ${error.status}: ${error.statusText}`;
      }
    }

    console.error('❌ Error HTTP completo:', error);
    console.error('❌ Error message:', errorMessage);

    this.ngZone.run(() => {
      this.error = errorMessage;
      this.loading = false;
      this.loadingMessage = '';
      this.cdr.detectChanges();
    });

    return throwError(() => error);
  };

  // Mapeo directo — el backend ya trae todo resuelto
  private mapearTarjetasApi(tarjetasApi: TarjetaApiResponse[]): TarjetaConAlumno[] {
    return tarjetasApi.map((t) => ({
      id: t.id,
      rfid: t.rfid,
      codigo: t.codigo || `CARD-${t.id}`,
      activo: t.activo,
      alumnoId: t.alumnoId,
      alumnoNombre: t.alumnoNombre?.replace(/\s+/g, ' ').trim() || null,
      alumnoDocumento: t.alumnoDocumento || null,
    }));
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // Carga datos — el backend ya trae alumnoNombre/alumnoDocumento, no necesita precargar alumnos
  loadData(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      return;
    }

    this.error = null;
    this.successMessage = null;
    this.loadAllTarjetas();
  }

  // Carga tarjetas con paginación, búsqueda y filtro de estado
  private loadAllTarjetas(page: number = 1, search: string = ''): void {
    const headers = this.getHeaders();
    let tarjetasUrl = `${this.apiUrlTarjetaLista}/${this.colegioId}?page=${page}&limit=${this.pageSize}`;
    if (search) {
      tarjetasUrl += `&search=${encodeURIComponent(search)}`;
    }
    if (this.filtroActivo === 'activas') {
      tarjetasUrl += '&activo=true';
    } else if (this.filtroActivo === 'inactivas') {
      tarjetasUrl += '&activo=false';
    }

    this.loading = true;
    this.loadingMessage = 'Cargando tarjetas...';

    this.http.get<any>(tarjetasUrl, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta tarjetas recibida:', response);

          this.ngZone.run(() => {
            // Soportar respuesta paginada (objeto) y respuesta simple (array)
            const isArray = Array.isArray(response);
            const tarjetasApi = isArray ? response : (response.data || []);
            this.totalTarjetas = isArray ? response.length : (response.totalTarjetas || 0);
            this.totalPages = isArray ? 1 : (response.totalPages || 0);
            this.currentPage = isArray ? 1 : (response.page || 1);

            this.tarjetas = this.mapearTarjetasApi(tarjetasApi);
            this.filteredTarjetas = [...this.tarjetas];

            this.loading = false;
            this.loadingMessage = '';
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error al cargar tarjetas:', error);
          this.loading = false;
          this.loadingMessage = '';
        },
      });
  }

  // loadRemainingPages eliminado — FIX 2026-03-23: ahora usa paginación server-side

  // Búsqueda es server-side — filterTarjetas eliminado

  clearSearch(): void {
    this.tarjetaForm.get('searchTerm')?.setValue('');
  }

  // ===============================
  // PAGINACIÓN
  // ===============================

  onPageChange(page: number): void {
    this.currentPage = page;
    const search = this.tarjetaForm.get('searchTerm')?.value?.trim() || '';
    this.loadAllTarjetas(page, search);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    const search = this.tarjetaForm.get('searchTerm')?.value?.trim() || '';
    this.loadAllTarjetas(1, search);
  }

  onFiltroActivoChange(): void {
    this.currentPage = 1;
    const search = this.tarjetaForm.get('searchTerm')?.value?.trim() || '';
    this.loadAllTarjetas(1, search);
  }

  // ===============================
  // FUNCIONALIDADES CRUD
  // ===============================

  openAddTarjetaModal(): void {
    const dialogRef = this.dialog.open(AddTarjetaModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        colegioId: this.colegioId,
        mode: 'add',
        alumnos: [],
        jwtToken: this.getHeaders().get('Authorization')?.replace('Bearer ', '') || '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addTarjeta(result);
      }
    });
  }

  openEditTarjetaModal(tarjeta: TarjetaConAlumno): void {
    const dialogRef = this.dialog.open(EditTarjetaModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        colegioId: this.colegioId,
        tarjeta: tarjeta,
        alumnos: [],
        jwtToken: this.getHeaders().get('Authorization')?.replace('Bearer ', '') || '',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        console.log('🔄 Resultado del modal:', result);
        
        if (result.action === 'update') {
          this.showSnackBar('Tarjeta actualizada exitosamente', 'success');
          this.loadData();
        } else if (result.action === 'delete') {
          this.showSnackBar(`Tarjeta ${result.data.codigo} eliminada exitosamente`, 'success');
          this.loadData();
        }
      }
    });
  }

  addTarjeta(tarjetaData: any): void {
    console.log('➕ Agregando tarjeta:', tarjetaData);

    this.loading = true;
    this.loadingMessage = 'Agregando tarjeta...';
    this.error = null;
    this.successMessage = null;

    if (!tarjetaData) {
      this.error = 'No se proporcionaron datos para la tarjeta';
      this.loading = false;
      this.loadingMessage = '';
      return;
    }

    try {
      const cleanedData = this.validateAndCleanTarjetaData(tarjetaData);
      console.log('✅ Datos limpiados:', cleanedData);

      const headers = this.getHeaders();

      this.http
        .post(this.apiUrlTarjeta, cleanedData, { headers, responseType: 'text' })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Tarjeta agregada:', response);
            this.ngZone.run(() => {
              this.showSnackBar('Tarjeta agregada con éxito', 'success');
              this.loading = false;
              this.loadingMessage = '';
              this.loadData();
            });
          },
          error: (error) => {
            console.error('❌ Error en subscribe:', error);
          },
        });
    } catch (error: any) {
      console.error('❌ Error en validación:', error);
      this.error = error.message || 'Error al validar los datos de la tarjeta';
      this.loading = false;
      this.loadingMessage = '';
    }
  }

  updateTarjeta(tarjetaId: number, tarjetaData: any): void {
    console.log('🔄 Actualizando tarjeta:', tarjetaId, tarjetaData);

    this.loading = true;
    this.loadingMessage = 'Actualizando tarjeta...';
    this.error = null;
    this.successMessage = null;

    if (!tarjetaData) {
      this.error = 'No se proporcionaron datos para la tarjeta';
      this.loading = false;
      this.loadingMessage = '';
      return;
    }

    try {
      const cleanedData = this.validateAndCleanTarjetaData(tarjetaData);
      console.log('✅ Datos limpiados para actualización:', cleanedData);

      const headers = this.getHeaders();
      const updateUrl = `${this.apiUrlTarjeta}/${tarjetaId}`;

      this.http
        .put(updateUrl, cleanedData, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Tarjeta actualizada:', response);
            this.ngZone.run(() => {
              this.showSnackBar('Tarjeta actualizada con éxito', 'success');
              this.loading = false;
              this.loadingMessage = '';
              this.loadData();
            });
          },
          error: (error) => {
            console.error('❌ Error al actualizar tarjeta:', error);
          },
        });
    } catch (error: any) {
      console.error('❌ Error en validación:', error);
      this.error = error.message || 'Error al validar los datos de la tarjeta';
      this.loading = false;
      this.loadingMessage = '';
    }
  }

  deleteTarjeta(tarjeta: TarjetaConAlumno): void {
    const dialogRef = this.dialog.open(ConfirmDeleteModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        tarjeta: {
          id: tarjeta.id,
          rfid: tarjeta.rfid,
          codigo: tarjeta.codigo,
          alumnoNombre: tarjeta.alumnoNombre
        }
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performDelete(tarjeta);
      }
    });
  }

  // Método recomendado para habilitar/inhabilitar tarjeta (Cambio Rápido de Estado)
  toggleTarjetaStatus(tarjeta: TarjetaConAlumno, event: any): void {
    const nuevoEstado = event.checked;
    const idTarjeta = tarjeta.id;

    console.log(`🔄 Cambiando estado de tarjeta ${idTarjeta} a: ${nuevoEstado}`);

    this.loading = true;
    this.loadingMessage = nuevoEstado ? 'Habilitando tarjeta...' : 'Inhabilitando tarjeta...';

    const headers = this.getHeaders();
    const patchUrl = `${this.apiUrlTarjeta}/${idTarjeta}/estado`;

    // Se envía el valor booleano directamente en el cuerpo (Literal)
    this.http.patch(patchUrl, nuevoEstado, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Estado actualizado (PATCH/estado):', response);
          this.ngZone.run(() => {
            const msj = nuevoEstado ? 'Tarjeta habilitada' : 'Tarjeta inhabilitada';
            this.showSnackBar(`${msj} con éxito`, 'success');
            tarjeta.activo = nuevoEstado; // Actualizar estado local
            this.loading = false;
            this.loadingMessage = '';
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error al actualizar estado:', error);
          // Revertir el estado del toggle en caso de error
          if (event && event.source) {
            event.source.checked = !nuevoEstado;
          }
          this.loading = false;
          this.loadingMessage = '';
          this.cdr.detectChanges();
        }
      });
  }

  private performDelete(tarjeta: TarjetaConAlumno): void {
    this.loading = true;
    this.loadingMessage = 'Eliminando tarjeta...';
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const deleteUrl = `${this.apiUrlTarjeta}/${tarjeta.id}`;

    console.log('🗑️ Eliminando tarjeta:', deleteUrl);

    this.http
      .delete(deleteUrl, { headers, responseType: 'text' })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Tarjeta eliminada:', response);
          this.ngZone.run(() => {
            this.showSnackBar(`Tarjeta ${tarjeta.codigo} eliminada con éxito`, 'success');
            this.loading = false;
            this.loadingMessage = '';
            this.loadData();
          });
        },
        error: (error) => {
          console.error('❌ Error al eliminar tarjeta:', error);
        },
      });
  }

  private validateAndCleanTarjetaData(data: any): TarjetaUpdateData {
    console.log('🧹 Validando y limpiando datos:', data);

    const rfidValue = data.rfid || data.Rfid || data.RFID;
    const codigoValue = data.codigo || data.Codigo || data.code;
    const alumnoValue =
      data.alumno || data.idAlumno || data.alumnoId || data.student;

    console.log('🔍 Valores extraídos:', { rfidValue, codigoValue, alumnoValue });

    const cleanedData: TarjetaUpdateData = {
      rfid: 0,
      codigo: '',
      idAlumno: 0,
      idColegio: this.colegioId,
      activo: data.activo !== undefined ? data.activo : true, // Agregado activo
    };

    // Validar RFID
    if (rfidValue === null || rfidValue === undefined || rfidValue === '') {
      throw new Error('RFID es requerido');
    }

    const rfidNumber = Number(rfidValue);
    if (isNaN(rfidNumber)) {
      throw new Error(
        `RFID debe ser un número válido. Recibido: "${rfidValue}"`
      );
    }
    cleanedData.rfid = rfidNumber;

    // Validar código
    const codigoString = codigoValue ? String(codigoValue).trim() : null;
    if (!codigoString) {
      throw new Error('Código es requerido');
    }
    cleanedData.codigo = codigoString;

    // Manejar alumno
    if (
      alumnoValue !== null &&
      alumnoValue !== undefined &&
      alumnoValue !== ''
    ) {
      const alumnoNumber = Number(alumnoValue);
      if (isNaN(alumnoNumber)) {
        console.log('⚠️ IdAlumno no es número, estableciendo a 0');
        cleanedData.idAlumno = 0;
      } else {
        cleanedData.idAlumno = alumnoNumber;
      }
    } else {
      cleanedData.idAlumno = 0;
      console.log('ℹ️ No hay alumno asignado, IdAlumno = 0');
    }

    // Validar colegio
    if (!this.colegioId && this.colegioId !== 0) {
      throw new Error('ID del colegio no está disponible');
    }

    console.log('✅ Datos finales validados:', cleanedData);

    return cleanedData;
  }

  refreshTarjetas(): void {
    this.loadData();
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}