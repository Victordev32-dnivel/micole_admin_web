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
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { TarjetasModalComponent } from '../tarjetas-modal/tarjetas-modal.component';
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
  tarjetas: TarjetaConAlumno[] = [];
  filteredTarjetas: TarjetaConAlumno[] = [];
  alumnos: Alumno[] = [];
  loading: boolean = false;
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
      errorMessage =
        error.error?.message ||
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

  // Método corregido para usar el campo "alumno" de la API
  private asociarTarjetasConAlumnos(
    tarjetas: TarjetaResponse[]
  ): TarjetaConAlumno[] {
    console.log('Tarjetas recibidas:', tarjetas);
    console.log('Alumnos disponibles:', this.alumnos);

    return tarjetas.map((tarjeta) => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };

      // Si la tarjeta tiene "alumno" (ID del alumno), buscar el alumno por ID
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

  loadData(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      return;
    }

    this.loading = true;
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
            // Procesar alumnos primero
            const alumnosData = response.alumnos.data || [];
            this.alumnos = alumnosData.map((alumno) => ({
              ...alumno,
              nombre_completo:
                alumno.nombre_completo?.replace(/\t/g, ' ').trim() || '',
            }));

            console.log('Alumnos procesados:', this.alumnos);

            // Procesar tarjetas y asociar con alumnos
            const tarjetasRaw = response.tarjetas.data || [];
            console.log('Tarjetas raw:', tarjetasRaw);

            this.tarjetas = this.asociarTarjetasConAlumnos(tarjetasRaw);
            this.filteredTarjetas = [...this.tarjetas];
            this.totalTarjetas = this.tarjetas.length;

            console.log('Tarjetas procesadas:', this.tarjetas);

            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar datos:', error);
          this.ngZone.run(() => {
            this.loading = false;
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

  editTarjeta(tarjeta: TarjetaConAlumno): void {
    const dialogRef = this.dialog.open(TarjetasModalComponent, {
      width: '500px',
      data: {
        tarjetaId: tarjeta.id,
        currentRfid: tarjeta.rfid,
        currentCodigo: tarjeta.codigo,
        colegioId: this.colegioId,
        mode: 'edit',
        alumnos: this.alumnos,
        currentAlumno: tarjeta.alumnoData,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.successMessage = 'Tarjeta actualizada con éxito';
        this.loadData();
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      }
    });
  }

  deleteTarjeta(tarjeta: TarjetaConAlumno): void {
    const alumnoInfo = tarjeta.alumnoNombre
      ? ` (Asignada a: ${tarjeta.alumnoNombre})`
      : '';

    if (
      confirm(
        `¿Está seguro de que desea eliminar la tarjeta ${tarjeta.codigo} (RFID: ${tarjeta.rfid})${alumnoInfo}?`
      )
    ) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const headers = this.getHeaders();
      const url = `${this.apiUrlTarjeta}/${tarjeta.id}`;

      this.http
        .delete(url, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: () => {
            this.ngZone.run(() => {
              this.successMessage = `Tarjeta ${tarjeta.codigo} eliminada con éxito`;
              this.loading = false;
              this.loadData();
              setTimeout(() => {
                this.successMessage = null;
              }, 3000);
            });
          },
        });
    }
  }

  openAddTarjetaModal(): void {
    const dialogRef = this.dialog.open(AddTarjetaModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        colegioId: this.colegioId,
        mode: 'add',
        alumnos: this.alumnos,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addTarjeta(result);
      }
    });
  }

  addTarjeta(tarjetaData: any): void {
    console.log('🔍 Datos recibidos en addTarjeta:', tarjetaData);

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (!tarjetaData) {
      this.error = 'No se proporcionaron datos para la tarjeta';
      this.loading = false;
      return;
    }

    try {
      const cleanedData = this.validateAndCleanTarjetaData(tarjetaData);
      console.log('✅ Datos limpiados para enviar:', cleanedData);

      const headers = this.getHeaders();
      console.log('🔑 Headers:', headers);
      console.log('🌐 URL destino:', this.apiUrlTarjeta);

      this.http
        .post(this.apiUrlTarjeta, cleanedData, { headers })
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('❌ Error completo:', error);
            console.error('❌ Status:', error.status);
            console.error('❌ Error body:', error.error);
            console.error('❌ Message:', error.message);

            // Log adicional para debugging
            if (error.error) {
              console.error(
                '❌ Detalles del error del servidor:',
                JSON.stringify(error.error, null, 2)
              );
            }

            return this.handleError(error);
          })
        )
        .subscribe({
          next: (response: any) => {
            console.log('✅ Respuesta exitosa:', response);
            this.ngZone.run(() => {
              this.successMessage = 'Tarjeta agregada con éxito';
              this.loading = false;
              this.loadData();

              setTimeout(() => {
                this.successMessage = null;
              }, 3000);
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
    }
  }
  private validateAndCleanTarjetaData(data: any): any {
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

    // Crear objeto con el formato que espera el servidor
    const cleanedData: any = {
      Rfid: null,
      Codigo: null,
      IdAlumno: 0, // Usar 0 como valor por defecto si no hay alumno
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
      // Si no hay alumno seleccionado, intentar con 0
      // Si el servidor no acepta 0, deberás cambiar esta lógica
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
