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
import { catchError, throwError, forkJoin } from 'rxjs';

// Interfaz actualizada para la respuesta de la API - más flexible
interface TarjetaApiResponse {
  id: number;
  rfid: number;
  horario: string; // Cambiado de 'codigo' a 'horario'
  alumno: any; // Cambiado a 'any' porque puede ser string, objeto, null, etc.
}

// Interfaz para la respuesta paginada de la API
interface TarjetasApiResponse {
  page: number;
  pageSize: number;
  totalPages: number;
  totalTarjetas: number;
  data: TarjetaApiResponse[];
}

// Interfaz para uso interno (manteniendo compatibilidad)
interface Tarjeta {
  id: number;
  rfid: number;
  codigo: string; // Para compatibilidad interna
}

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono?: string | null;
}

interface TarjetaConAlumno extends Tarjeta {
  alumnoData?: Alumno;
  alumnoNombre?: string;
  alumnoDocumento?: string;
  alumnoCodigo?: string;
  horario?: string; // Agregamos el campo horario de la API
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

interface TarjetaUpdateData {
  Rfid: number;
  Codigo: string;
  IdAlumno: number;
  IdColegio: number;
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
  ],
  templateUrl: './tarjetas.component.html',
  styleUrls: ['./tarjetas.component.css'],
})
export class TarjetasComponent implements OnInit {
  tarjetaForm: FormGroup;
  tarjetas: TarjetaConAlumno[] = [];
  filteredTarjetas: TarjetaConAlumno[] = [];
  alumnos: Alumno[] = [];
  loading: boolean = false;
  loadingMessage: string = '';
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  totalTarjetas: number = 0;

  // Variables para paginación
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;

  private readonly baseUrl = 'https://proy-back-dnivel-44j5.onrender.com/api';
  // URL CORREGIDA: agregado /lista en la ruta
  private readonly apiUrlTarjetaLista = `${this.baseUrl}/tarjeta/lista/colegio`;
  private readonly apiUrlTarjeta = `${this.baseUrl}/tarjeta`;
  private readonly apiUrlAlumnos = `${this.baseUrl}/alumno/colegio`;

  displayedColumns: string[] = [
    'id',
    'rfid',
    'codigo',
    'alumno',
    'estado',
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
    this.tarjetaForm.get('searchTerm')?.valueChanges.subscribe((term) => {
      this.filterTarjetas(term || '');
    });
  }

  private getHeaders(): HttpHeaders {
    const userData = this.userService.getUserData();
    const jwtToken = '732612882';
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
      errorMessage =
        error.error?.message ||
        error.message ||
        `Error ${error.status}: ${error.statusText}`;
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

  // Método actualizado para mapear los datos de la API al formato interno
  private mapearTarjetasApi(tarjetasApi: TarjetaApiResponse[]): TarjetaConAlumno[] {
    console.log('🔄 Mapeando tarjetas de API:', tarjetasApi);

    return tarjetasApi.map((tarjetaApi) => {
      console.log('🔍 Procesando tarjeta individual:', tarjetaApi);
      console.log('🔍 Tipo de alumno:', typeof tarjetaApi.alumno, tarjetaApi.alumno);
      console.log('🔍 Tipo de horario:', typeof tarjetaApi.horario, tarjetaApi.horario);

      // Procesar el código/horario
      const codigo = this.procesarCodigo(tarjetaApi);
      
      const tarjetaConAlumno: TarjetaConAlumno = {
        id: tarjetaApi.id,
        rfid: tarjetaApi.rfid,
        codigo: codigo,
        horario: tarjetaApi.horario,
        alumnoNombre: this.procesarNombreAlumno(tarjetaApi.alumno)
      };

      // Si hay un nombre de alumno, intentar encontrar el alumno completo
      const nombreAlumno = this.procesarNombreAlumno(tarjetaApi.alumno);
      if (nombreAlumno && nombreAlumno !== 'Sin asignar' && nombreAlumno.toLowerCase() !== 'null') {
        console.log('🔍 Buscando alumno:', nombreAlumno);
        console.log('🔍 Alumnos disponibles:', this.alumnos.map(a => a.nombre_completo));
        
        const alumnoEncontrado = this.alumnos.find((a) => {
          const nombreCompleto = a.nombre_completo.replace(/\t/g, ' ').trim().toLowerCase();
          const nombreBuscado = nombreAlumno.toLowerCase().trim();
          
          // Buscar coincidencias exactas o parciales
          return nombreCompleto === nombreBuscado || 
                 nombreCompleto.includes(nombreBuscado) ||
                 nombreBuscado.includes(nombreCompleto);
        });

        console.log('👤 Alumno encontrado:', alumnoEncontrado);

        if (alumnoEncontrado) {
          tarjetaConAlumno.alumnoData = alumnoEncontrado;
          tarjetaConAlumno.alumnoDocumento = alumnoEncontrado.numero_documento;
          tarjetaConAlumno.alumnoCodigo = alumnoEncontrado.codigo;
        }
      }

      console.log('✅ Tarjeta procesada:', tarjetaConAlumno);
      return tarjetaConAlumno;
    });
  }

  // Nuevo método para procesar el código de forma segura
  private procesarCodigo(tarjetaApi: TarjetaApiResponse): string {
    console.log('🔍 Procesando código:', tarjetaApi);

    // Intentar obtener el código de diferentes fuentes
    let codigo = tarjetaApi.horario;

    // Si horario no existe o es null/undefined, buscar otras propiedades
    if (!codigo || codigo === null || codigo === undefined) {
      // Verificar si existe una propiedad 'codigo' en el objeto
      const tarjetaAny = tarjetaApi as any;
      codigo = tarjetaAny.codigo || tarjetaAny.Code || tarjetaAny.code;
    }

    // Si aún no hay código, usar el ID como código
    if (!codigo || codigo === null || codigo === undefined || codigo === 'null') {
      codigo = `CARD-${tarjetaApi.id}`;
    }

    // Asegurar que sea un string
    return String(codigo).trim();
  }

  // Nuevo método para procesar el nombre del alumno de forma segura
  private procesarNombreAlumno(alumnoData: any): string | undefined {
    console.log('🔍 Procesando alumno data:', typeof alumnoData, alumnoData);

    // Si es null o undefined
    if (!alumnoData || alumnoData === 'null' || alumnoData === 'undefined') {
      return undefined;
    }

    // Si es un string
    if (typeof alumnoData === 'string') {
      const nombreLimpio = alumnoData.replace(/\t/g, ' ').trim();
      return (nombreLimpio && nombreLimpio !== 'null' && nombreLimpio !== 'undefined') ? nombreLimpio : undefined;
    }

    // Si es un número (podría ser un ID)
    if (typeof alumnoData === 'number') {
      // Buscar por ID en la lista de alumnos
      const alumnoEncontrado = this.alumnos.find(a => a.id === alumnoData);
      return alumnoEncontrado ? alumnoEncontrado.nombre_completo : undefined;
    }

    // Si es un objeto con propiedades de alumno
    if (typeof alumnoData === 'object') {
      const nombre = alumnoData.nombre || 
                    alumnoData.nombre_completo || 
                    alumnoData.name || 
                    alumnoData.fullName ||
                    alumnoData.nombreCompleto;
      
      if (typeof nombre === 'string') {
        const nombreLimpio = nombre.replace(/\t/g, ' ').trim();
        return (nombreLimpio && nombreLimpio !== 'null' && nombreLimpio !== 'undefined') ? nombreLimpio : undefined;
      }

      // Si hay un ID en el objeto, buscar por ID
      const id = alumnoData.id || alumnoData.alumnoId || alumnoData.idAlumno;
      if (typeof id === 'number') {
        const alumnoEncontrado = this.alumnos.find(a => a.id === id);
        return alumnoEncontrado ? alumnoEncontrado.nombre_completo : undefined;
      }

      // Si el objeto se puede convertir a string de forma útil
      try {
        const nombreStr = String(alumnoData).replace(/\t/g, ' ').trim();
        if (nombreStr && nombreStr !== '[object Object]' && nombreStr !== 'null' && nombreStr !== 'undefined') {
          return nombreStr;
        }
      } catch (error) {
        console.warn('⚠️ No se pudo procesar alumnoData como objeto:', alumnoData);
      }
    }

    // Intentar convertir a string como último recurso
    try {
      const nombreStr = String(alumnoData).replace(/\t/g, ' ').trim();
      return (nombreStr && nombreStr !== 'null' && nombreStr !== 'undefined' && nombreStr !== '[object Object]') ? nombreStr : undefined;
    } catch (error) {
      console.warn('⚠️ No se pudo convertir alumnoData a string:', alumnoData);
      return undefined;
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // Método actualizado para cargar todas las páginas de tarjetas
  loadData(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      console.error('❌ colegioId no está disponible para loadData');
      return;
    }

    console.log('🚀 Iniciando carga de datos para colegio:', this.colegioId);

    this.loading = true;
    this.loadingMessage = 'Cargando tarjetas...';
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    
    // Cargar alumnos primero
    const alumnosUrl = `${this.apiUrlAlumnos}/${this.colegioId}`;
    console.log('📡 Cargando alumnos desde:', alumnosUrl);

    this.http.get<ApiResponse<Alumno[]>>(alumnosUrl, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (alumnosResponse) => {
          console.log('✅ Respuesta alumnos recibida:', alumnosResponse);
          
          const alumnosData = alumnosResponse.data || [];
          this.alumnos = alumnosData.map((alumno) => ({
            ...alumno,
            nombre_completo: alumno.nombre_completo?.replace(/\t/g, ' ').trim() || '',
          }));

          console.log('👥 Alumnos procesados:', this.alumnos.length);
          
          // Ahora cargar las tarjetas
          this.loadAllTarjetas();
        },
        error: (error) => {
          console.error('❌ Error al cargar alumnos:', error);
          // Continuar sin alumnos
          this.alumnos = [];
          this.loadAllTarjetas();
        },
      });
  }

  // Método para cargar todas las tarjetas (manejando paginación)
  private loadAllTarjetas(): void {
    const headers = this.getHeaders();
    const tarjetasUrl = `${this.apiUrlTarjetaLista}/${this.colegioId}`;
    
    console.log('📡 Cargando tarjetas desde URL:', tarjetasUrl);
    console.log('🔑 Headers:', headers.keys());

    this.http.get<TarjetasApiResponse>(tarjetasUrl, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta tarjetas recibida:', response);

          this.ngZone.run(() => {
            this.totalTarjetas = response.totalTarjetas || 0;
            this.totalPages = response.totalPages || 0;
            this.currentPage = response.page || 1;
            
            const tarjetasApi = response.data || [];
            console.log('🎯 Tarjetas en la respuesta:', tarjetasApi.length);

            this.tarjetas = this.mapearTarjetasApi(tarjetasApi);
            this.filteredTarjetas = [...this.tarjetas];

            console.log('📋 Tarjetas procesadas:', this.tarjetas.length);

            // Si hay más páginas, cargar todas
            if (this.totalPages > 1) {
              this.loadRemainingPages();
            } else {
              this.loading = false;
              this.loadingMessage = '';
              this.cdr.detectChanges();
            }
          });
        },
        error: (error) => {
          console.error('❌ Error al cargar tarjetas:', error);
        },
      });
  }

  // Método para cargar las páginas restantes
  private loadRemainingPages(): void {
    const headers = this.getHeaders();
    const requests = [];

    for (let page = 2; page <= this.totalPages; page++) {
      const url = `${this.apiUrlTarjetaLista}/${this.colegioId}?page=${page}`;
      requests.push(this.http.get<TarjetasApiResponse>(url, { headers }));
    }

    if (requests.length === 0) {
      this.loading = false;
      this.loadingMessage = '';
      this.cdr.detectChanges();
      return;
    }

    forkJoin(requests)
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (responses: TarjetasApiResponse[]) => {
          console.log('✅ Páginas adicionales cargadas:', responses.length);

          this.ngZone.run(() => {
            // Combinar todas las tarjetas
            const todasLasTarjetas = [...this.tarjetas];

            responses.forEach(response => {
              const tarjetasApi = response.data || [];
              const tarjetasMapeadas = this.mapearTarjetasApi(tarjetasApi);
              todasLasTarjetas.push(...tarjetasMapeadas);
            });

            this.tarjetas = todasLasTarjetas;
            this.filteredTarjetas = [...this.tarjetas];
            this.totalTarjetas = this.tarjetas.length;

            console.log('📊 Total de tarjetas cargadas:', this.tarjetas.length);

            this.loading = false;
            this.loadingMessage = '';
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error al cargar páginas adicionales:', error);
          // Mantener las tarjetas ya cargadas
          this.loading = false;
          this.loadingMessage = '';
          this.cdr.detectChanges();
        },
      });
  }

  filterTarjetas(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredTarjetas = [...this.tarjetas];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredTarjetas = this.tarjetas.filter(
      (tarjeta) =>
        tarjeta.rfid.toString().includes(term) ||
        tarjeta.codigo.toLowerCase().includes(term) ||
        tarjeta.id.toString().includes(term) ||
        (tarjeta.alumnoNombre &&
          tarjeta.alumnoNombre.toLowerCase().includes(term)) ||
        (tarjeta.alumnoData?.codigo &&
          tarjeta.alumnoData.codigo.toLowerCase().includes(term)) ||
        (tarjeta.alumnoData?.numero_documento &&
          tarjeta.alumnoData.numero_documento.includes(term)) ||
        (tarjeta.horario &&
          tarjeta.horario.toLowerCase().includes(term))
    );
  }

  clearSearch(): void {
    this.tarjetaForm.get('searchTerm')?.setValue('');
    this.filteredTarjetas = [...this.tarjetas];
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
        alumnos: this.alumnos,
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
        alumnos: this.alumnos,
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
        .post(this.apiUrlTarjeta, cleanedData, { headers })
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

  private performDelete(tarjeta: TarjetaConAlumno): void {
    this.loading = true;
    this.loadingMessage = 'Eliminando tarjeta...';
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const deleteUrl = `${this.apiUrlTarjeta}/${tarjeta.id}`;

    console.log('🗑️ Eliminando tarjeta:', deleteUrl);

    this.http
      .delete(deleteUrl, { headers })
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
    const codigoValue = data.codigo || data.Codigo || data.code || data.horario;
    const alumnoValue =
      data.alumno || data.idAlumno || data.alumnoId || data.student;

    console.log('🔍 Valores extraídos:', { rfidValue, codigoValue, alumnoValue });

    const cleanedData: TarjetaUpdateData = {
      Rfid: 0,
      Codigo: '',
      IdAlumno: 0,
      IdColegio: this.colegioId,
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
    cleanedData.Rfid = rfidNumber;

    // Validar código
    const codigoString = codigoValue ? String(codigoValue).trim() : null;
    if (!codigoString) {
      throw new Error('Código es requerido');
    }
    cleanedData.Codigo = codigoString;

    // Manejar alumno
    if (
      alumnoValue !== null &&
      alumnoValue !== undefined &&
      alumnoValue !== ''
    ) {
      const alumnoNumber = Number(alumnoValue);
      if (isNaN(alumnoNumber)) {
        console.log('⚠️ IdAlumno no es número, estableciendo a 0');
        cleanedData.IdAlumno = 0;
      } else {
        cleanedData.IdAlumno = alumnoNumber;
      }
    } else {
      cleanedData.IdAlumno = 0;
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