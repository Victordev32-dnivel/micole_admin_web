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

interface Tarjeta {
  id: number;
  rfid: number;
  codigo: string;
}

interface TarjetaResponse {
  id: number;
  rfid: number;
  codigo: string;
  alumno?: number; // ID del alumno asociado (viene de la API)
}

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono?: string | null;
}

interface TarjetaConAlumno extends TarjetaResponse {
  alumnoData?: Alumno; // Datos completos del alumno
  alumnoNombre?: string;
  alumnoDocumento?: string;
  alumnoCodigo?: string;
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

  private readonly baseUrl = 'https://proy-back-dnivel-44j5.onrender.com/api';
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

      if (userData && userData.colegio) {
        this.colegioId = userData.colegio;
        this.loadData();
      } else {
        this.error = 'No se pudieron cargar los datos del usuario';
      }

      this.userService.userData$.subscribe((userData) => {
        if (userData && userData.colegio) {
          this.colegioId = userData.colegio;
          this.loadData();
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      this.error = 'Error al cargar datos del usuario';
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

    this.ngZone.run(() => {
      this.error = errorMessage;
      this.loading = false;
      this.loadingMessage = '';
      this.cdr.detectChanges();
    });

    return throwError(() => error);
  };

  private asociarTarjetasConAlumnos(
    tarjetas: TarjetaResponse[]
  ): TarjetaConAlumno[] {
    console.log('Tarjetas recibidas:', tarjetas);
    console.log('Alumnos disponibles:', this.alumnos);

    return tarjetas.map((tarjeta) => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };

      if (tarjeta.alumno) {
        const alumnoEncontrado = this.alumnos.find(
          (a) => a.id === tarjeta.alumno
        );
        console.log(`Tarjeta ${tarjeta.id} tiene alumno ID: ${tarjeta.alumno}`);

        if (alumnoEncontrado) {
          console.log(`Alumno encontrado:`, alumnoEncontrado);
          tarjetaConAlumno.alumnoData = alumnoEncontrado;
          tarjetaConAlumno.alumnoNombre = alumnoEncontrado.nombre_completo
            .replace(/\t/g, ' ')
            .trim();
          tarjetaConAlumno.alumnoDocumento = alumnoEncontrado.numero_documento;
          tarjetaConAlumno.alumnoCodigo = alumnoEncontrado.codigo;
        } else {
          console.log(`No se encontró alumno con ID: ${tarjeta.alumno}`);
        }
      } else {
        console.log(`Tarjeta ${tarjeta.id} no tiene alumno asignado`);
      }

      return tarjetaConAlumno;
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  loadData(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Cargando tarjetas...';
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const tarjetasUrl = `${this.apiUrlTarjetaLista}/${this.colegioId}`;
    const alumnosUrl = `${this.apiUrlAlumnos}/${this.colegioId}`;

    console.log('Cargando datos desde:', { tarjetasUrl, alumnosUrl });

    const tarjetasRequest = this.http.get<ApiResponse<TarjetaResponse[]>>(
      tarjetasUrl,
      { headers }
    );
    const alumnosRequest = this.http.get<ApiResponse<Alumno[]>>(alumnosUrl, {
      headers,
    });

    forkJoin({
      tarjetas: tarjetasRequest,
      alumnos: alumnosRequest,
    })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response) => {
          console.log('Respuesta completa:', response);

          this.ngZone.run(() => {
            const alumnosData = response.alumnos.data || [];
            this.alumnos = alumnosData.map((alumno) => ({
              ...alumno,
              nombre_completo:
                alumno.nombre_completo?.replace(/\t/g, ' ').trim() || '',
            }));

            console.log('Alumnos procesados:', this.alumnos);

            const tarjetasRaw = response.tarjetas.data || [];
            console.log('Tarjetas raw:', tarjetasRaw);

            this.tarjetas = this.asociarTarjetasConAlumnos(tarjetasRaw);
            this.filteredTarjetas = [...this.tarjetas];
            this.totalTarjetas = this.tarjetas.length;

            console.log('Tarjetas procesadas:', this.tarjetas);

            this.loading = false;
            this.loadingMessage = '';
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar datos:', error);
          this.ngZone.run(() => {
            this.loading = false;
            this.loadingMessage = '';
            this.error = 'Error al cargar datos. Intente nuevamente.';
            this.cdr.detectChanges();
          });
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
          tarjeta.alumnoData.numero_documento.includes(term))
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
        console.log('Resultado del modal:', result);
        
        if (result.action === 'update') {
          // La tarjeta fue actualizada
          this.showSnackBar('Tarjeta actualizada exitosamente', 'success');
          this.loadData(); // Recargar los datos
        } else if (result.action === 'delete') {
          // La tarjeta fue eliminada desde el modal
          this.showSnackBar(`Tarjeta ${result.data.codigo} eliminada exitosamente`, 'success');
          this.loadData(); // Recargar los datos
        }
      }
    });
  }

  addTarjeta(tarjetaData: any): void {
    console.log('🔍 Datos recibidos en addTarjeta:', tarjetaData);

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
      console.log('✅ Datos limpiados para enviar:', cleanedData);

      const headers = this.getHeaders();

      this.http
        .post(this.apiUrlTarjeta, cleanedData, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta exitosa:', response);
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
    console.log('🔍 Datos recibidos en updateTarjeta:', { tarjetaId, tarjetaData });

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
      console.log('✅ Datos limpiados para actualizar:', cleanedData);

      const headers = this.getHeaders();
      const updateUrl = `${this.apiUrlTarjeta}/${tarjetaId}`;

      this.http
        .put(updateUrl, cleanedData, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Tarjeta actualizada exitosamente:', response);
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

  // ===============================
  // MÉTODO ACTUALIZADO PARA ELIMINAR CON MODAL
  // ===============================
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

  // Método separado para realizar la eliminación
  private performDelete(tarjeta: TarjetaConAlumno): void {
    this.loading = true;
    this.loadingMessage = 'Eliminando tarjeta...';
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const deleteUrl = `${this.apiUrlTarjeta}/${tarjeta.id}`;

    console.log(`🗑️ Eliminando tarjeta con URL: ${deleteUrl}`);

    this.http
      .delete(deleteUrl, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Tarjeta eliminada exitosamente:', response);
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
    console.log(
      '🔍 Datos originales recibidos:',
      JSON.stringify(data, null, 2)
    );

    const rfidValue = data.rfid || data.Rfid || data.RFID;
    const codigoValue = data.codigo || data.Codigo || data.code;
    const alumnoValue =
      data.alumno || data.idAlumno || data.alumnoId || data.student;

    console.log('📋 Valores extraídos:', {
      rfidValue,
      codigoValue,
      alumnoValue,
      colegioId: this.colegioId,
    });

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
        console.log('⚠️ ID de alumno inválido, usando 0');
        cleanedData.IdAlumno = 0;
      } else {
        cleanedData.IdAlumno = alumnoNumber;
      }
    } else {
      cleanedData.IdAlumno = 0;
      console.log('⚠️ No hay alumno seleccionado, enviando IdAlumno = 0');
    }

    // Validar colegio
    if (!this.colegioId && this.colegioId !== 0) {
      throw new Error('ID del colegio no está disponible');
    }

    console.log(
      '✅ Datos finales para enviar:',
      JSON.stringify(cleanedData, null, 2)
    );

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