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
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { UserService } from '../../../../services/UserData';

@Component({
  selector: 'app-salidas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTableModule,
    MatTooltipModule,
    HttpClientModule,
  ],
  templateUrl: './salidas-list.component.html',
  styleUrls: ['./salidas-list.component.css'],
})
export class SalidasListComponent implements OnInit {
  salidaForm: FormGroup;
  salones: any[] = [];
  alumnos: any[] = [];
  salidas: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;

  private salonApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista';
  private alumnoApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon';
  private salidaApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/asistencia/salida';
  // URL para eliminar - usando la que me proporcionaste
  private deleteApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/asistencia';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.salidaForm = this.fb.group({
      idSalon: ['', Validators.required],
      idAlumno: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.loadSalones();
    }
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
    }
    this.userService.userData$.subscribe((userData) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  loadSalones() {
    if (!this.colegioId) {
      this.error =
        'No se pudo cargar los salones: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.salonApiUrl}/${this.colegioId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salones = Array.isArray(response) ? response : (response.data || []);
            this.loading = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error: any) => {
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSalonChange() {
    const salonId = this.salidaForm.get('idSalon')?.value;
    if (salonId) {
      this.loadAlumnos(salonId);
    } else {
      this.alumnos = [];
      this.salidas = [];
      this.salidaForm.get('idAlumno')?.reset();
      this.error = null;
      this.cdr.detectChanges();
    }
  }

  loadAlumnos(salonId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.alumnos = [];
    this.salidas = [];
    this.salidaForm.get('idAlumno')?.reset();
    const headers = this.getHeaders();

    this.http
      .get<any>(`${this.alumnoApiUrl}/${salonId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.alumnos = Array.isArray(response) ? response : (response.data || []);
            this.loading = false;
            if (this.alumnos.length === 0) {
              this.error = 'No se encontraron alumnos en este salón';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error: any) => {
          this.error = 'Error al cargar los alumnos. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onAlumnoChange() {
    const alumnoId = this.salidaForm.get('idAlumno')?.value;
    this.salidas = [];
    this.error = null;
    if (alumnoId) {
      this.loadSalidas(alumnoId);
    } else {
      this.salidas = [];
      this.cdr.detectChanges();
    }
  }

  loadSalidas(alumnoId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.salidas = [];
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.salidaApiUrl}/${alumnoId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salidas = Array.isArray(response) ? response : (response.data || []);
            this.loading = false;

            if (this.salidas.length === 0) {
              this.error = 'No se encontraron salidas para este alumno';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error: any) => {
          this.error = 'Error al cargar las salidas. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Método para eliminar salida
  eliminarSalida(index: number): void {
    const salida = this.salidas[index];

    // Buscar el ID de la salida con diferentes posibles nombres
    const posibleIds = [
      salida.id,
      salida.idAsistencia,
      salida.idSalida,
      salida.ID,
      salida.Id,
      salida.asistencia_id,
      salida.salida_id,
      salida.pk,
      salida.key
    ];

    const salidaId = posibleIds.find(id => id !== undefined && id !== null && id !== '');

    // Mostrar información de la salida en el diálogo de confirmación
    const fechaTexto = salida.fecha || salida.fecha_salida || 'No especificada';
    const horaTexto = salida.hora || salida.hora_salida || 'No especificada';
    const estadoTexto = salida.estado || 'Sin estado';
    const personaTexto = salida.persona_autorizada || 'No especificada';




    if (salidaId) {
      this.eliminarSalidaDelBackend(salidaId, index);
    } else {
      this.eliminarSoloDelFrontend(index);
    }
  }

  // Eliminar solo del frontend (cuando no hay ID)
  private eliminarSoloDelFrontend(index: number): void {
    this.salidas.splice(index, 1);
    this.successMessage = 'Salida eliminada de la vista';
    this.error = null;
    this.cdr.detectChanges();

    this.limpiarMensajeDespuesDe(3000);
  }

  // Método para eliminar del backend
  private eliminarSalidaDelBackend(salidaId: number | string, index: number): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    const deleteUrl = `${this.deleteApiUrl}/${salidaId}`;

    this.http.delete(deleteUrl, { headers }).subscribe({
      next: (response) => {
        // Eliminar del array local
        this.salidas.splice(index, 1);
        this.loading = false;
        this.successMessage = 'Salida eliminada correctamente';
        this.error = null;
        this.cdr.detectChanges();

        this.limpiarMensajeDespuesDe(4000);
      },
      error: (error: any) => {
        this.loading = false;

        // Mostrar error más específico según el código de respuesta
        if (error.status === 404) {
          this.error = 'No se encontró la salida en el servidor';
        } else if (error.status === 403) {
          this.error = 'No tienes permisos para eliminar esta salida';
        } else if (error.status === 500) {
          this.error = 'Error interno del servidor. Intenta de nuevo';
        } else {
          this.error = 'Error al eliminar la salida. Intente de nuevo';
        }

        this.successMessage = null;
        this.cdr.detectChanges();

        this.limpiarMensajeDespuesDe(6000);
      }
    });
  }

  // Método auxiliar para limpiar mensajes después de un tiempo
  private limpiarMensajeDespuesDe(milisegundos: number): void {
    setTimeout(() => {
      this.successMessage = null;
      this.error = null;
      this.cdr.detectChanges();
    }, milisegundos);
  }
}