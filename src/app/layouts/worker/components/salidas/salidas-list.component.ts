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
  selector: 'app-salidas',
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
export class SalidasComponent implements OnInit {
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
    'https://proy-back-dnivel-44j5.onrender.com/api/salida';
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
      console.error('ID del colegio no disponible');
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
            this.salones = response.data || [];
            this.loading = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // Método para eliminar salida con inspección de datos
  eliminarSalida(index: number): void {
    const salida = this.salidas[index];

    // Debug completo de la estructura
    console.log('=== DEBUG SALIDA ===');
    console.log('Índice:', index);
    console.log('Salida completa:', salida);
    console.log('Tipo de dato:', typeof salida);
    console.log('Propiedades disponibles:', Object.keys(salida));
    console.log('Valores:', Object.values(salida));
    console.log('===================');

    // Intentar encontrar el ID con diferentes nombres posibles
    const posibleIds = [
      salida.id,
      salida.idSalida,
      salida.ID,
      salida.Id,
      salida.salidaId,
      salida.salida_id,
      salida.pk,
      salida.key,
      salida.uuid
    ];

    const salidaId = posibleIds.find(id => id !== undefined && id !== null);

    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar esta salida?\n\n` +
      `Fecha: ${salida.fecha || 'No especificada'}\n` +
      `Hora: ${salida.hora_salida || 'No especificada'}\n` +
      `Estado: ${salida.estado || 'Sin estado'}\n` +
      `Persona Autorizada: ${salida.persona_autorizada || 'No especificada'}`
    );

    if (confirmacion) {
      if (salidaId) {
        console.log('ID encontrado para eliminar:', salidaId);
        this.eliminarSalidaDelBackend(salidaId, index);
      } else {
        // Si no hay ID, eliminar solo del frontend
        console.warn('No se encontró ID. Eliminando solo del frontend.');
        this.eliminarSoloDelFrontend(index);
      }
    }
  }

  // Método para eliminar solo del frontend (sin backend)
  private eliminarSoloDelFrontend(index: number): void {
    this.salidas.splice(index, 1);
    this.successMessage = 'Salida eliminada de la vista (solo frontend)';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  // Método para eliminar del backend
  private eliminarSalidaDelBackend(salidaId: number, index: number): void {
    const headers = this.getHeaders();

    this.http.delete(`${this.salidaApiUrl}/${salidaId}`, { headers })
      .subscribe({
        next: (response) => {
          // Si se elimina correctamente del backend, eliminamos del array local
          this.salidas.splice(index, 1);
          this.successMessage = 'Salida eliminada correctamente';
          this.cdr.detectChanges();

          // Limpiar mensaje después de 3 segundos
          setTimeout(() => {
            this.successMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error) => {
          console.error('Error al eliminar salida:', error);
          this.error = 'Error al eliminar la salida. Intente de nuevo';
          this.cdr.detectChanges();

          // Limpiar mensaje de error después de 5 segundos
          setTimeout(() => {
            this.error = null;
            this.cdr.detectChanges();
          }, 5000);
        }
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
            this.alumnos = Array.isArray(response) ? response : [];
            this.loading = false;
            if (this.alumnos.length === 0) {
              this.error = 'No se encontraron alumnos en este salón';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar alumnos:', error);
          this.error = 'Error al cargar los alumnos. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onAlumnoChange() {
    const alumnoId = this.salidaForm.get('idAlumno')?.value;
    this.salidas = []; // Limpiar la tabla explícitamente al cambiar de alumno
    this.error = null; // Limpiar el mensaje de error al cambiar de alumno
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
    this.salidas = []; // Limpiar la tabla antes de cargar nuevas salidas
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.salidaApiUrl}/${alumnoId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salidas = Array.isArray(response) ? response : [];
            this.loading = false;

            // Debug: Ver la estructura de los datos
            if (this.salidas.length > 0) {
              console.log('Primera salida:', this.salidas[0]);
              console.log('Propiedades disponibles:', Object.keys(this.salidas[0]));
            }

            if (this.salidas.length === 0) {
              this.error = 'No se encontraron salidas para este alumno';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salidas:', error);
          this.error = 'Error al cargar las salidas. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}