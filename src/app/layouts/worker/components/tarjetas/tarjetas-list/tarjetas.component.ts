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
  Validators,
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
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { TarjetasModalComponent } from '../tarjetas-modal/tarjetas-modal.component';
import { AddTarjetaModalComponent } from '../add-tarjeta-modal/add-tarjeta-modal.component';
import { UserService } from '../../../../../services/UserData';
import { catchError, throwError } from 'rxjs';

interface Salon {
  id: number;
  nombre: string;
}

interface Alumno {
  id: number;
  nombre: string;
  codigo: string | null;
  tarjeta: number | null;
}

interface ApiResponse<T> {
  data?: T;
  alumnos?: T;
  message?: string;
  totalPages?: number;
  totalAlumnos?: number;
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
  ],
  templateUrl: './tarjetas.component.html',
  styleUrls: ['./tarjetas.component.css'],
})
export class TarjetasComponent implements OnInit {
  tarjetaForm: FormGroup;
  salones: Salon[] = [];
  alumnos: Alumno[] = [];
  filteredAlumnos: Alumno[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;

  // URLs de API consistentes
  private readonly baseUrl = 'https://proy-back-dnivel.onrender.com/api';
  private readonly apiUrlSalon = `${this.baseUrl}/salon/colegio`;
  private readonly apiUrlAlumno = `${this.baseUrl}/alumno`;
  private readonly apiUrlTarjeta = `${this.baseUrl}/tarjeta`;

  // Columnas de la tabla
  displayedColumns: string[] = ['codigo', 'nombre', 'tarjeta', 'acciones'];
  
  // Paginación
  currentPage: number = 1;
  totalPages: number = 0;
  totalAlumnos: number = 0;
  pageNumbers: number[] = [];
  pageSize: number = 20;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {
    this.tarjetaForm = this.fb.group({
      idSalon: ['', Validators.required],
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
      if (userData && userData.colegio) {
        this.colegioId = userData.colegio;
        console.log('Datos del usuario cargados:', { colegioId: this.colegioId });
        this.loadSalones();
      } else {
        this.error = 'No se pudieron cargar los datos del usuario';
        console.error('Datos de usuario no válidos:', userData);
      }

      // Suscribirse a cambios en los datos del usuario
      this.userService.userData$.subscribe((userData) => {
        if (userData && userData.colegio) {
          this.colegioId = userData.colegio;
          this.loadSalones();
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      this.error = 'Error al cargar datos del usuario';
    }
  }

  private setupSearchListener(): void {
    this.tarjetaForm.get('searchTerm')?.valueChanges.subscribe((term) => {
      this.filterAlumnos(term || '');
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    
    if (!jwtToken) {
      console.warn('No se encontró token JWT');
      this.error = 'Token de autenticación no válido';
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('Error HTTP:', error);
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || 
                    error.message || 
                    `Error ${error.status}: ${error.statusText}`;
    }

    this.ngZone.run(() => {
      this.error = errorMessage;
      this.loading = false;
      this.cdr.detectChanges();
    });

    return throwError(() => error);
  };

  loadSalones(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const url = `${this.apiUrlSalon}/${this.colegioId}?page=1&pageSize=200`;

    console.log('Cargando salones desde:', url);

    this.http.get<ApiResponse<Salon[]>>(url, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salones = response.data || response as any[] || [];
            console.log('Salones cargados:', this.salones);
            
            this.loading = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
        }
      });
  }

  onSalonChange(salonId: number): void {
    console.log('Salón seleccionado:', salonId);
    this.resetPagination();
    if (salonId) {
      this.loadAlumnos(salonId);
    }
    this.cdr.detectChanges();
  }

  private resetPagination(): void {
    this.alumnos = [];
    this.filteredAlumnos = [];
    this.totalPages = 0;
    this.totalAlumnos = 0;
    this.pageNumbers = [];
    this.currentPage = 1;
    this.tarjetaForm.get('searchTerm')?.setValue('');
  }

  loadAlumnos(salonId: number, page: number = 1): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (page !== this.currentPage) {
      this.currentPage = page;
    }

    const headers = this.getHeaders();
    const url = `${this.apiUrlAlumno}/tarjeta/${salonId}?page=${this.currentPage}&pageSize=${this.pageSize}`;

    console.log('Cargando alumnos desde:', url);

    this.http.get<ApiResponse<Alumno[]>>(url, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            // Manejar diferentes estructuras de respuesta
            const alumnosData = response.alumnos || response.data || [];
            this.alumnos = this.normalizeAlumnosData(alumnosData);
            this.filteredAlumnos = [...this.alumnos];
            
            this.totalPages = response.totalPages || 1;
            this.totalAlumnos = response.totalAlumnos || this.alumnos.length;
            this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            
            console.log('Alumnos cargados:', {
              alumnos: this.alumnos,
              página: this.currentPage,
              totalPáginas: this.totalPages,
              totalAlumnos: this.totalAlumnos,
            });

            this.loading = false;
            if (this.alumnos.length === 0) {
              this.error = 'No se encontraron alumnos en este salón';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar alumnos:', error);
        }
      });
  }

  private normalizeAlumnosData(data: any[]): Alumno[] {
    return data.map((item: any) => ({
      id: item.id || item.idAlumno || item.alumnoId,
      nombre: item.nombre || item.alumno || `Alumno ${item.id || item.idAlumno}`,
      codigo: item.codigo || null,
      tarjeta: item.tarjeta || null
    })).filter(alumno => alumno.id); // Filtrar elementos sin ID válido
  }

  filterAlumnos(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredAlumnos = [...this.alumnos];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredAlumnos = this.alumnos.filter((alumno) =>
      (alumno.nombre && alumno.nombre.toLowerCase().includes(term)) ||
      (alumno.codigo && alumno.codigo.toString().toLowerCase().includes(term))
    );
  }

  clearSearch(): void {
    this.tarjetaForm.get('searchTerm')?.setValue('');
    this.filteredAlumnos = [...this.alumnos];
  }

  // Métodos de paginación
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      const salonId = this.tarjetaForm.get('idSalon')?.value;
      if (salonId) {
        this.loadAlumnos(salonId, page);
      }
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  openRfidModal(alumnoId: number, currentRfid: number | null): void {
    const dialogRef = this.dialog.open(TarjetasModalComponent, {
      width: '1000px',
      maxHeight: '90vh',
      disableClose: false,
      data: { 
        alumnoId, 
        currentRfid, 
        colegioId: this.colegioId 
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.successMessage = `Tarjeta ${currentRfid ? 'actualizada' : 'asignada'} con éxito`;
        const salonId = this.tarjetaForm.get('idSalon')?.value;
        if (salonId) {
          this.loadAlumnos(salonId, this.currentPage);
        }
      }
      this.cdr.detectChanges();
    });
  }

  openAddTarjetaModal(): void {
    const salonId = this.tarjetaForm.get('idSalon')?.value;

    if (!salonId) {
      this.error = 'Debe seleccionar un salón primero';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    const headers = this.getHeaders();

    // Usar endpoint consistente para obtener todos los alumnos del salón
    const url = `${this.apiUrlAlumno}/salon/${salonId}`;
    console.log('Obteniendo alumnos para modal desde:', url);

    this.http.get<ApiResponse<any[]>>(url, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.loading = false;

            console.log('Respuesta completa de alumnos para modal:', response);

            // Manejar diferentes estructuras de respuesta
            let alumnosRaw = response.data || response.alumnos || response as any[] || [];
            
            // Si la respuesta es un array directamente
            if (Array.isArray(response)) {
              alumnosRaw = response;
            }

            const alumnos = this.normalizeAlumnosData(alumnosRaw);
            
            console.log('Alumnos procesados para modal:', alumnos);

            if (alumnos.length === 0) {
              this.error = 'No hay alumnos válidos en este salón';
              this.cdr.detectChanges();
              return;
            }

            const dialogRef = this.dialog.open(AddTarjetaModalComponent, {
              width: '500px',
              disableClose: true,
              data: {
                colegioId: this.colegioId,
                alumnos: alumnos,
                salonId: salonId
              },
            });

            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.addTarjeta(result);
              }
            });
          });
        },
        error: (error) => {
          console.error('Error al cargar alumnos para modal:', error);
        }
      });
  }

  addTarjeta(tarjetaData: any): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    // Validar datos antes de enviar
    if (!tarjetaData) {
      this.error = 'No se proporcionaron datos para la tarjeta';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('=== DATOS PARA AGREGAR TARJETA ===');
    console.log('Datos originales:', tarjetaData);

    try {
      // Limpiar y validar datos según los requisitos de la API
      const cleanedData = this.validateAndCleanTarjetaData(tarjetaData);
      const headers = this.getHeaders();

      this.http.post(this.apiUrlTarjeta, cleanedData, { headers })
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('=== ERROR DETALLADO ===');
            console.error('Status:', error.status);
            console.error('Error body:', error.error);
            
            let errorMessage = 'Error al agregar tarjeta';
            
            if (error.error && error.error.errors) {
              // Manejar errores de validación de la API
              const validationErrors = error.error.errors;
              const errorMessages = [];
              
              for (const field in validationErrors) {
                errorMessages.push(`${field}: ${validationErrors[field].join(', ')}`);
              }
              
              errorMessage = `Errores de validación: ${errorMessages.join('; ')}`;
            } else if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.ngZone.run(() => {
              this.error = `Error ${error.status}: ${errorMessage}`;
              this.loading = false;
              this.cdr.detectChanges();
            });

            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Respuesta exitosa:', response);
            this.ngZone.run(() => {
              this.successMessage = 'Tarjeta agregada con éxito';
              this.loading = false;

              // Recargar datos si hay un salón seleccionado
              const salonId = this.tarjetaForm.get('idSalon')?.value;
              if (salonId) {
                this.loadAlumnos(salonId, this.currentPage);
              }

              this.cdr.detectChanges();
            });
          }
        });

    } catch (error: any) {
      this.error = error.message || 'Error al validar los datos de la tarjeta';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private validateAndCleanTarjetaData(data: any): any {
    // Basado en el error de validación de la API, necesita exactamente estos campos con esta capitalización
    const cleanedData = {
      Rfid: data.rfid,           // Capital R - requerido por la API
      IdAlumno: data.idAlumno,   // Capital I y A - requerido por la API
      IdColegio: data.idColegio, // Capital I y C - requerido por la API
      Codigo: data.codigo        // Capital C - requerido por la API
    };

    console.log('=== DATOS LIMPIADOS PARA API ===');
    console.log('Datos originales:', data);
    console.log('Datos enviados a API:', cleanedData);
    
    // Validar que todos los campos requeridos estén presentes y no sean null/undefined
    if (!cleanedData.Rfid && cleanedData.Rfid !== 0) {
      throw new Error('RFID es requerido');
    }
    if (!cleanedData.IdAlumno && cleanedData.IdAlumno !== 0) {
      throw new Error('ID del alumno es requerido');
    }
    if (!cleanedData.IdColegio && cleanedData.IdColegio !== 0) {
      throw new Error('ID del colegio es requerido');
    }
    if (!cleanedData.Codigo && cleanedData.Codigo !== '') {
      throw new Error('Código del alumno es requerido');
    }

    return cleanedData;
  }

  // Método para limpiar mensajes
  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
    this.cdr.detectChanges();
  }

  // Método para debug - mostrar información del estado actual
  debugInfo(): void {
    console.log('Estado actual del componente:', {
      colegioId: this.colegioId,
      salonSeleccionado: this.tarjetaForm.get('idSalon')?.value,
      salones: this.salones,
      alumnos: this.alumnos,
      filteredAlumnos: this.filteredAlumnos,
      loading: this.loading,
      error: this.error,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    });
  }

  // Método temporal para testear la estructura de datos esperada por la API
  testApiTarjeta(): void {
    const testData = {
      Rfid: "123456789",
      IdAlumno: 1,
      IdColegio: this.colegioId,
      Codigo: "ABC123"
    };
    
    console.log('=== TEST API TARJETA ===');
    console.log('Formato correcto para la API:', testData);
    console.log('Todos los campos requeridos: Rfid, IdAlumno, IdColegio, Codigo');
  }
}