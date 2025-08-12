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

  private ultimaTarjetaCreada: {
    tarjetaId: number | null;
    alumnoId: number;
  } | null = null;

  private readonly baseUrl = 'https://proy-back-dnivel.onrender.com/api';
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

    const tarjetasRequest = this.http.get<ApiResponse<Tarjeta[]>>(tarjetasUrl, {
      headers,
    });
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
          this.ngZone.run(() => {
            const alumnosData = response.alumnos.data || [];
            this.alumnos = alumnosData.map((alumno) => ({
              ...alumno,
              nombre_completo:
                alumno.nombre_completo?.replace(/\t/g, ' ').trim() || '',
            }));

            const tarjetasRaw = response.tarjetas.data || [];
            this.tarjetas =
              this.combinarTarjetasConAlumnosPorOrden(tarjetasRaw);
            this.filteredTarjetas = [...this.tarjetas];
            this.totalTarjetas = this.tarjetas.length;

            this.loading = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  private combinarTarjetasConAlumnosPorOrden(
    tarjetas: Tarjeta[]
  ): TarjetaConAlumno[] {
    return tarjetas.map((tarjeta) => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };

      if (
        this.ultimaTarjetaCreada &&
        tarjeta.id === this.ultimaTarjetaCreada.tarjetaId
      ) {
        const alumno = this.alumnos.find(
          (a) => a.id === this.ultimaTarjetaCreada!.alumnoId
        );
        if (alumno) {
          this.asociarAlumnoATarjeta(tarjetaConAlumno, alumno, 'CACHÉ');
          return tarjetaConAlumno;
        }
      }

      if ('idAlumno' in tarjeta && (tarjeta as any).idAlumno) {
        const alumnoId = (tarjeta as any).idAlumno;
        const alumno = this.alumnos.find((a) => a.id === alumnoId);
        if (alumno) {
          this.asociarAlumnoATarjeta(tarjetaConAlumno, alumno, 'idAlumno');
          return tarjetaConAlumno;
        }
      }

      const alumnoPorRfid = this.alumnos.find(
        (a) => (a as any).rfid === tarjeta.rfid
      );
      if (alumnoPorRfid) {
        this.asociarAlumnoATarjeta(tarjetaConAlumno, alumnoPorRfid, 'RFID');
        return tarjetaConAlumno;
      }

      const alumnoPorCodigo = this.alumnos.find(
        (a) => a.codigo === tarjeta.codigo
      );
      if (alumnoPorCodigo) {
        this.asociarAlumnoATarjeta(tarjetaConAlumno, alumnoPorCodigo, 'código');
        return tarjetaConAlumno;
      }

      const index = tarjetas.indexOf(tarjeta);
      if (this.alumnos[index]) {
        this.asociarAlumnoATarjeta(
          tarjetaConAlumno,
          this.alumnos[index],
          'posición'
        );
      }

      return tarjetaConAlumno;
    });
  }

  private asociarAlumnoATarjeta(
    tarjeta: TarjetaConAlumno,
    alumno: Alumno,
    metodo: string
  ): void {
    tarjeta.alumno = alumno;
    tarjeta.alumnoNombre = alumno.nombre_completo;
    tarjeta.alumnoDocumento = alumno.numero_documento;
    tarjeta.alumnoCodigo = alumno.codigo;
  }

  private combinarTarjetasConAlumnosPorId(
    tarjetas: Tarjeta[]
  ): TarjetaConAlumno[] {
    return tarjetas.map((tarjeta) => {
      const tarjetaConAlumno: TarjetaConAlumno = { ...tarjeta };
      const alumno = this.alumnos.find((a) => a.id === tarjeta.id);

      if (alumno) {
        tarjetaConAlumno.alumno = alumno;
        tarjetaConAlumno.alumnoNombre = alumno.nombre_completo;
        tarjetaConAlumno.alumnoDocumento = alumno.numero_documento;
        tarjetaConAlumno.alumnoCodigo = alumno.codigo;
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
    this.filteredTarjetas = this.tarjetas.filter(
      (tarjeta) =>
        tarjeta.rfid.toString().includes(term) ||
        tarjeta.codigo.toLowerCase().includes(term) ||
        tarjeta.id.toString().includes(term) ||
        (tarjeta.alumnoNombre &&
          tarjeta.alumnoNombre.toLowerCase().includes(term)) ||
        (tarjeta.alumno?.codigo &&
          tarjeta.alumno.codigo.toLowerCase().includes(term)) ||
        (tarjeta.alumno?.numero_documento &&
          tarjeta.alumno.numero_documento.includes(term))
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
        currentAlumno: tarjeta.alumno,
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
      const headers = this.getHeaders();

      this.http
        .post(this.apiUrlTarjeta, cleanedData, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response) => {
            this.ultimaTarjetaCreada = {
              tarjetaId: response as number,
              alumnoId: cleanedData.idAlumno,
            };

            this.ngZone.run(() => {
              this.successMessage = 'Tarjeta agregada con éxito';
              this.loading = false;
              this.loadData();
              setTimeout(() => {
                this.successMessage = null;
                this.ultimaTarjetaCreada = null;
              }, 3000);
            });
          },
        });
    } catch (error: any) {
      this.error = error.message || 'Error al validar los datos de la tarjeta';
      this.loading = false;
    }
  }

  private validateAndCleanTarjetaData(data: any): any {
    const cleanedData = {
      rfid: data.rfid || data.Rfid,
      codigo: data.codigo || data.Codigo,
      idAlumno: data.idAlumno || 0,
      idColegio: this.colegioId,
    };

    if (!cleanedData.rfid && cleanedData.rfid !== 0) {
      throw new Error('RFID es requerido');
    }
    if (!cleanedData.codigo) {
      throw new Error('Código es requerido');
    }
    if (!cleanedData.idColegio && cleanedData.idColegio !== 0) {
      throw new Error('ID del colegio es requerido');
    }

    if (typeof cleanedData.rfid === 'string') {
      cleanedData.rfid = parseInt(cleanedData.rfid, 10);
      if (isNaN(cleanedData.rfid)) {
        throw new Error('RFID debe ser un número válido');
      }
    }

    return cleanedData;
  }

  refreshTarjetas(): void {
    this.loadData();
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  cambiarTipoAsociacion(tipo: 'orden' | 'id'): void {
    if (this.tarjetas.length > 0) {
      const tarjetasRaw = this.tarjetas.map((t) => ({
        id: t.id,
        rfid: t.rfid,
        codigo: t.codigo,
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

  private async obtenerTarjetaCompleta(tarjetaId: number): Promise<any> {
    const headers = this.getHeaders();
    const url = `${this.apiUrlTarjeta}/${tarjetaId}`;

    try {
      const response = await this.http.get(url, { headers }).toPromise();
      return response;
    } catch {
      return null;
    }
  }
}
