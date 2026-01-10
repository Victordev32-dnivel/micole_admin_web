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
import { ExcelService } from '../../../../services/excel.service';
import { forkJoin, map, catchError, of } from 'rxjs';

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

  meses: string[] = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

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
    private excelService: ExcelService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    this.salidaForm = this.fb.group({
      idSalon: ['', Validators.required],
      idAlumno: [''], // Ya no es requerido para la acción de exportar (aunque sí para ver detalle individual)
      mesReporte: [currentMonth]
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

  exportarExcel() {
    const salonId = this.salidaForm.get('idSalon')?.value;
    const mesIdx = this.salidaForm.get('mesReporte')?.value; // 1-12

    if (!salonId || !mesIdx || this.alumnos.length === 0) {
      this.error = 'Seleccione un salón con alumnos para exportar.';
      return;
    }

    this.loading = true;
    this.error = null;
    const headers = this.getHeaders();
    const observables = [];

    // Preparar observables para cada alumno
    for (const alumno of this.alumnos) {
      observables.push(
        this.http.get<any>(`${this.salidaApiUrl}/${alumno.id}`, { headers }).pipe(
          map(response => {
            const salidas = Array.isArray(response) ? response : (response.data || []);
            // Filtrar por mes
            const salidasMes = salidas.filter((s: any) => {
              const fechaStr = s.fecha || s.fecha_salida;
              if (!fechaStr) return false;
              // asumiendo formato YYYY-MM-DD o similar, o Date object
              const fecha = new Date(fechaStr);
              // Ojo: los strings de fecha a veces tienen problema con timezone.
              // Mejor parsing seguro si es string "YYYY-MM-DD" -> split
              if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
                const parts = fechaStr.split('-');
                if (parts.length >= 2) {
                  return parseInt(parts[1]) === parseInt(mesIdx);
                }
              }
              return (fecha.getMonth() + 1) === parseInt(mesIdx);
            });

            // Mapear a formato día/estado
            const asistenciasDia = salidasMes.map((s: any) => {
              const fechaStr = s.fecha || s.fecha_salida;
              let dia = 0;
              if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
                dia = parseInt(fechaStr.split('-')[2]);
              } else {
                dia = new Date(fechaStr).getDate();
              }
              // Estado: 'S' de Salida o las siglas de su estado (P=Puntual, T=Tarde)
              // Si el estado es 'Puntual', ponemos 'P', si es 'Tarde' ponemos 'T'
              let estado = 'S'; // Default Salida
              if (s.estado) {
                const est = s.estado.toLowerCase();
                if (est.includes('puntual')) estado = '•'; // Punto para asistencia normal
                else if (est.includes('tarde')) estado = 'T';
                else if (est.includes('falta')) estado = 'F';
                else estado = 'S';
              }
              return { dia, estado };
            });

            return {
              dni: alumno.dni || alumno.codigo, // Ajustar según modelo
              nombres: alumno.nombre || alumno.nombres, // Ajustar según modelo
              apellidos: alumno.apellido || alumno.apellidos, // Ajustar según modelo total
              asistencias: asistenciasDia,
              totalATiempo: salidasMes.filter((s: any) => s.estado?.toLowerCase().includes('puntual')).length,
              totalTardanza: salidasMes.filter((s: any) => s.estado?.toLowerCase().includes('tarde')).length,
              totalFaltas: 0 // Salidas no suelen tener 'Faltas', eso es entrada/asistencia
            };
          }),
          catchError(err => of({
            dni: alumno.dni, nombres: alumno.nombres, apellidos: alumno.apellidos,
            asistencias: [], totalATiempo: 0, totalTardanza: 0, totalFaltas: 0
          })) // Si falla uno, no detener todo
        )
      );
    }

    forkJoin(observables).subscribe({
      next: (dataAlumnos) => {
        const salonNombre = this.salones.find(s => s.id === salonId)?.nombre || 'Salon';
        const mesNombre = this.meses[mesIdx - 1];
        const filename = `Reporte_Salidas_${salonNombre}_${mesNombre}`;

        this.excelService.exportarAsistencia(
          dataAlumnos,
          mesNombre,
          `GRADO Y SECCIÓN: ${salonNombre}`,
          filename
        );

        this.loading = false;
        this.successMessage = 'Reporte generado y descargado correctamente';
        this.cdr.detectChanges();
        this.limpiarMensajeDespuesDe(4000);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al generar el reporte masivo.';
        this.cdr.detectChanges();
      }
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