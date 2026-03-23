import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../../services/UserData';

interface Grado {
  id: number;
  nombre: string;
  orden: number;
}

interface SeccionDestino {
  salonId: number;
  seccionNombre: string;
}

interface AlumnoPreview {
  alumnoId: number;
  alumnoNombre: string;
  alumnoDocumento: string;
  alumnoSalonId: number;
  salonOrigenId: number;
  gradoOrigen: string;
  seccionOrigen: string;
  salonDestinoId: number | null;
  gradoDestino: string | null;
  seccionDestino: string | null;
  accion: string; // PROMOVER, ELIMINAR, SIN_DESTINO
  // campos editables por el usuario
  selected: boolean;
  accionUsuario: string; // PROMOVER, ELIMINAR, OMITIR
  salonDestinoIdUsuario: number | null;
}

interface PreviewResponse {
  gradoOrigen: string;
  gradoDestino: string | null;
  esUltimoGrado: boolean;
  totalAlumnos: number;
  salonesDestino: SeccionDestino[];
  alumnos: AlumnoPreview[];
}

interface ResultadoPromocion {
  promovidos: number;
  eliminados: number;
  omitidos: number;
  errores: number;
}

@Component({
  selector: 'app-promocion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './promocion.component.html',
  styleUrls: ['./promocion.component.css'],
})
export class PromocionComponent implements OnInit {
  colegioId = 0;
  grados: Grado[] = [];
  selectedGradoId: number | null = null;

  // Preview
  preview: PreviewResponse | null = null;
  alumnos: AlumnoPreview[] = [];
  salonesDestino: SeccionDestino[] = [];
  esUltimoGrado = false;

  // State
  loading = false;
  loadingPreview = false;
  ejecutado = false;
  resultado: ResultadoPromocion | null = null;

  displayedColumns = ['select', 'alumno', 'origen', 'arrow', 'destino', 'accion'];

  private apiBase = '/api';

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const userData = this.userService.getUserData();
    if (userData?.colegio) {
      this.colegioId = userData.colegio;
      this.loadGrados();
    }
  }

  private getHeaders(): HttpHeaders {
    const jwt = this.userService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    });
  }

  loadGrados(): void {
    this.http
      .get<Grado[]>(`${this.apiBase}/promocion/grados/${this.colegioId}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => (this.grados = res || []),
        error: () =>
          this.snackBar.open('Error al cargar grados', 'Cerrar', { duration: 3000 }),
      });
  }

  onGradoChange(): void {
    this.preview = null;
    this.alumnos = [];
    this.ejecutado = false;
    this.resultado = null;
  }

  loadPreview(): void {
    if (!this.selectedGradoId) return;

    this.loadingPreview = true;
    this.ejecutado = false;
    this.resultado = null;

    this.http
      .get<PreviewResponse>(
        `${this.apiBase}/promocion/preview/${this.colegioId}?idGradoOrigen=${this.selectedGradoId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (res) => {
          this.preview = res;
          this.esUltimoGrado = res.esUltimoGrado;
          this.salonesDestino = res.salonesDestino || [];

          // Inicializar campos editables
          this.alumnos = (res.alumnos || []).map((a) => ({
            ...a,
            selected: a.accion !== 'SIN_DESTINO',
            accionUsuario: a.accion === 'SIN_DESTINO' ? 'OMITIR' : a.accion,
            salonDestinoIdUsuario: a.salonDestinoId,
          }));

          this.loadingPreview = false;
        },
        error: () => {
          this.snackBar.open('Error al cargar preview', 'Cerrar', { duration: 3000 });
          this.loadingPreview = false;
        },
      });
  }

  // Selección masiva
  get allSelected(): boolean {
    return this.alumnos.length > 0 && this.alumnos.every((a) => a.selected);
  }

  get someSelected(): boolean {
    return this.alumnos.some((a) => a.selected) && !this.allSelected;
  }

  toggleAll(checked: boolean): void {
    this.alumnos.forEach((a) => {
      a.selected = checked;
      a.accionUsuario = checked
        ? this.esUltimoGrado
          ? 'ELIMINAR'
          : 'PROMOVER'
        : 'OMITIR';
    });
  }

  onAlumnoToggle(alumno: AlumnoPreview): void {
    if (!alumno.selected) {
      alumno.accionUsuario = 'OMITIR';
    } else {
      alumno.accionUsuario = this.esUltimoGrado ? 'ELIMINAR' : 'PROMOVER';
    }
  }

  onAccionChange(alumno: AlumnoPreview): void {
    alumno.selected = alumno.accionUsuario !== 'OMITIR';
  }

  onSeccionChange(alumno: AlumnoPreview, salonId: number): void {
    alumno.salonDestinoIdUsuario = salonId;
    const salon = this.salonesDestino.find((s) => s.salonId === salonId);
    if (salon) {
      alumno.seccionDestino = salon.seccionNombre;
    }
  }

  // Contadores
  get countPromover(): number {
    return this.alumnos.filter((a) => a.accionUsuario === 'PROMOVER').length;
  }

  get countEliminar(): number {
    return this.alumnos.filter((a) => a.accionUsuario === 'ELIMINAR').length;
  }

  get countOmitir(): number {
    return this.alumnos.filter((a) => a.accionUsuario === 'OMITIR').length;
  }

  get countSinDestino(): number {
    return this.alumnos.filter((a) => a.accion === 'SIN_DESTINO').length;
  }

  // Ejecutar
  ejecutarPromocion(): void {
    const procesables = this.alumnos.filter((a) => a.accionUsuario !== 'OMITIR');
    if (procesables.length === 0) {
      this.snackBar.open('No hay alumnos seleccionados para procesar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const msgPromover = this.countPromover > 0 ? `${this.countPromover} promovidos` : '';
    const msgEliminar =
      this.countEliminar > 0 ? `${this.countEliminar} eliminados del grado` : '';
    const partes = [msgPromover, msgEliminar].filter(Boolean).join(', ');

    if (
      !confirm(
        `¿Está seguro de ejecutar la promoción?\n\nSe procesarán: ${partes}\n\nEsta acción NO se puede deshacer.`
      )
    ) {
      return;
    }

    this.loading = true;

    const body = {
      promociones: this.alumnos.map((a) => ({
        alumnoSalonId: a.alumnoSalonId,
        alumnoId: a.alumnoId,
        salonDestinoId: a.salonDestinoIdUsuario,
        accion: a.accionUsuario,
      })),
    };

    this.http
      .post<ResultadoPromocion>(`${this.apiBase}/promocion/ejecutar`, body, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.resultado = res;
          this.ejecutado = true;
          this.loading = false;
          this.snackBar.open('Promoción ejecutada exitosamente', 'Cerrar', {
            duration: 5000,
          });
        },
        error: (err) => {
          const msg = err.error?.message || 'Error al ejecutar la promoción';
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.loading = false;
        },
      });
  }

  nuevaPromocion(): void {
    this.selectedGradoId = null;
    this.preview = null;
    this.alumnos = [];
    this.ejecutado = false;
    this.resultado = null;
  }
}
