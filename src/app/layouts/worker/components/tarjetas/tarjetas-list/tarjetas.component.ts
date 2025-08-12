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

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono?: string | null;
}

interface TarjetaConAlumno extends Tarjeta {
  alumno?: Alumno;
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
  styleUrls: ['./tarjetas.component.css']
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

  // URLs de API
  private readonly baseUrl = 'https://proy-back-dnivel.onrender.com/api';
  private readonly apiUrlTarjetaLista = `${this.baseUrl}/tarjeta/lista/colegio`;
  private readonly apiUrlTarjeta = `${this.baseUrl}/tarjeta`;
  private readonly apiUrlAlumnos = `${this.baseUrl}/alumno/colegio`;

  displayedColumns: string[] = ['id', 'rfid', 'codigo', 'alumno', 'estado', 'acciones'];

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
      console.log('Datos del usuario:', userData);
      
      if (userData && userData.colegio) {
        this.colegioId = userData.colegio;
        console.log('Colegio ID:', this.colegioId);
        this.loadData();
      } else {
        this.error = 'No se pudieron cargar los datos del usuario';
        console.error('No hay datos de usuario o colegio');
      }

      this.userService.userData$.subscribe((userData) => {
        console.log('Observable userData:', userData);
        if (userData && userData.colegio) {
          this.colegioId = userData.colegio;
          this.loadData();
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
      this.filterTarjetas(term || '');
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    console.log('JWT Token:', jwtToken ? 'Presente' : 'No encontrado');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('Error HTTP completo:', error);
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      console.log('Error status:', error.status);
      console.log('Error body:', error.error);
      
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

  loadData(): void {
    if (!this.colegioId) {
      this.error = 'ID del colegio no disponible';
      return;
    }

    console.log('Iniciando carga de datos para colegio:', this.colegioId);

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const tarjetasUrl = `${this.apiUrlTarjetaLista}/${this.colegioId}`;
    const alumnosUrl = `${this.apiUrlAlumnos}/${this.colegioId}`;

    console.log('URLs a consultar:');
    console.log('Tarjetas:', tarjetasUrl);
    console.log('Alumnos:', alumnosUrl);

    const tarjetasRequest = this.http.get<ApiResponse<Tarjeta[]>>(tarjetasUrl, { headers });
    const alumnosRequest = this.http.get<ApiResponse<Alumno[]>>(alumnosUrl, { headers });

    forkJoin({
      tarjetas: tarjetasRequest,
      alumnos: alumnosRequest
    }).pipe(
      catchError(this.handleError)
    ).subscribe({
      next: (response) => {
        console.log('Respuesta completa:', response);
        
        this.ngZone.run(() => {
          // Limpiar nombres de alumnos (quitar \t)
          const alumnosData = response.alumnos.data || [];
          this.alumnos = alumnosData.map(alumno => ({
            ...alumno,
            nombre_completo: alumno.nombre_completo?.replace(/\t/g, ' ').trim() || ''
          }));
          
          console.log('Alumnos procesados:', this.alumnos.length);
          console.log('Datos de alumnos:', this.alumnos);
          
          const tarjetasRaw = response.tarjetas.data || [];
          console.log('Tarjetas raw:', tarjetasRaw);
          
          // Asociar tarjetas con alumnos por orden/posición
          this.tarjetas = this.combinarTarjetasConAlumnosPorOrden(tarjetasRaw);
          this.filteredTarjetas = [...this.tarjetas];
          this.totalTarjetas = this.tarjetas.length;
          
          console.log('Tarjetas combinadas:', this.tarjetas);
          
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
      }
    });
  }

  private combinarTarjetasConAlumnosPorOrden(tarjetas: Tarjeta[]): TarjetaConAlumno[] {
    return tarjetas.map((tarjeta, index) => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };
      
      // Asociar por posición en el array (índice)
      if (this.alumnos[index]) {
        const alumno = this.alumnos[index];
        tarjetaConAlumno.alumno = alumno;
        tarjetaConAlumno.alumnoNombre = alumno.nombre_completo;
        tarjetaConAlumno.alumnoDocumento = alumno.numero_documento;
        tarjetaConAlumno.alumnoCodigo = alumno.codigo;
        
        console.log(`Tarjeta ${tarjeta.id} asociada con alumno ${alumno.id} (${alumno.nombre_completo})`);
      } else {
        console.log(`No hay alumno en posición ${index} para tarjeta ${tarjeta.id}`);
      }
      
      return tarjetaConAlumno;
    });
  }

  private combinarTarjetasConAlumnosPorId(tarjetas: Tarjeta[]): TarjetaConAlumno[] {
    return tarjetas.map(tarjeta => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };
      
      // Buscar alumno con el mismo ID que la tarjeta
      const alumno = this.alumnos.find(a => a.id === tarjeta.id);
      
      if (alumno) {
        tarjetaConAlumno.alumno = alumno;
        tarjetaConAlumno.alumnoNombre = alumno.nombre_completo;
        tarjetaConAlumno.alumnoDocumento = alumno.numero_documento;
        tarjetaConAlumno.alumnoCodigo = alumno.codigo;
        
        console.log(`Tarjeta ID ${tarjeta.id} asociada con alumno ID ${alumno.id} (${alumno.nombre_completo})`);
      } else {
        console.log(`No se encontró alumno con ID ${tarjeta.id} para la tarjeta ${tarjeta.id}`);
      }
      
      return tarjetaConAlumno;
    });
  }

  filterTarjetas(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredTarjetas = [...this.tarjetas];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredTarjetas = this.tarjetas.filter((tarjeta) =>
      tarjeta.rfid.toString().includes(term) ||
      tarjeta.codigo.toLowerCase().includes(term) ||
      tarjeta.id.toString().includes(term) ||
      (tarjeta.alumnoNombre && tarjeta.alumnoNombre.toLowerCase().includes(term)) ||
      (tarjeta.alumno?.codigo && tarjeta.alumno.codigo.toLowerCase().includes(term)) ||
      (tarjeta.alumno?.numero_documento && tarjeta.alumno.numero_documento.includes(term))
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
        currentAlumno: tarjeta.alumno
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
    const alumnoInfo = tarjeta.alumnoNombre ? ` (Asignada a: ${tarjeta.alumnoNombre})` : '';
    
    if (confirm(`¿Está seguro de que desea eliminar la tarjeta ${tarjeta.codigo} (RFID: ${tarjeta.rfid})${alumnoInfo}?`)) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const headers = this.getHeaders();
      const url = `${this.apiUrlTarjeta}/${tarjeta.id}`;

      console.log('Eliminando tarjeta:', url);

      this.http.delete(url, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response) => {
            console.log('Respuesta eliminación:', response);
            this.ngZone.run(() => {
              this.successMessage = `Tarjeta ${tarjeta.codigo} eliminada con éxito`;
              this.loading = false;
              this.loadData();
              setTimeout(() => {
                this.successMessage = null;
              }, 3000);
            });
          },
          error: (error) => {
            console.error('Error al eliminar tarjeta:', error);
          }
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
        alumnos: this.alumnos
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addTarjeta(result);
      }
    });
  }

  addTarjeta(tarjetaData: any): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (!tarjetaData) {
      this.error = 'No se proporcionaron datos para la tarjeta';
      this.loading = false;
      return;
    }

    console.log('Datos recibidos para agregar tarjeta:', tarjetaData);

    try {
      const cleanedData = this.validateAndCleanTarjetaData(tarjetaData);
      console.log('Datos limpiados para enviar:', cleanedData);
      
      const headers = this.getHeaders();

      this.http.post(this.apiUrlTarjeta, cleanedData, { headers })
        .pipe(
          catchError(this.handleError)
        )
        .subscribe({
          next: (response) => {
            console.log('Respuesta crear tarjeta:', response);
            this.ngZone.run(() => {
              this.successMessage = 'Tarjeta agregada con éxito';
              this.loading = false;
              this.loadData();
              setTimeout(() => {
                this.successMessage = null;
              }, 3000);
            });
          }
        });
    } catch (error: any) {
      console.error('Error en validación:', error);
      this.error = error.message || 'Error al validar los datos de la tarjeta';
      this.loading = false;
    }
  }

  private validateAndCleanTarjetaData(data: any): any {
    console.log('Validando datos:', data);
    
    const cleanedData = {
      Rfid: data.rfid || data.Rfid,
      Codigo: data.codigo || data.Codigo,
      IdColegio: this.colegioId
    };

    console.log('Datos antes de validación:', cleanedData);

    if (!cleanedData.Rfid && cleanedData.Rfid !== 0) {
      throw new Error('RFID es requerido');
    }
    if (!cleanedData.Codigo) {
      throw new Error('Código es requerido');
    }
    if (!cleanedData.IdColegio && cleanedData.IdColegio !== 0) {
      throw new Error('ID del colegio es requerido');
    }

    if (typeof cleanedData.Rfid === 'string') {
      cleanedData.Rfid = parseInt(cleanedData.Rfid, 10);
      if (isNaN(cleanedData.Rfid)) {
        throw new Error('RFID debe ser un número válido');
      }
    }

    console.log('Datos después de validación:', cleanedData);
    return cleanedData;
  }

  refreshTarjetas(): void {
    this.loadData();
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  // Método para cambiar entre tipos de asociación
  cambiarTipoAsociacion(tipo: 'orden' | 'id'): void {
    if (this.tarjetas.length > 0) {
      const tarjetasRaw = this.tarjetas.map(t => ({
        id: t.id,
        rfid: t.rfid,
        codigo: t.codigo
      }));

      if (tipo === 'orden') {
        this.tarjetas = this.combinarTarjetasConAlumnosPorOrden(tarjetasRaw);
      } else {
        this.tarjetas = this.combinarTarjetasConAlumnosPorId(tarjetasRaw);
      }

      this.filteredTarjetas = [...this.tarjetas];
      this.cdr.detectChanges();
    }
  }
}