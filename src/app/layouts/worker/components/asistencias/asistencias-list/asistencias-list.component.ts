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
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-asistencias',
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
    HttpClientModule,
  ],
  templateUrl: './asistencias-list.component.html',
  styleUrls: ['./asistencias-list.component.css'],
})
export class AsistenciasComponent implements OnInit {
  asistenciaForm: FormGroup;
  salones: any[] = [];
  alumnos: any[] = [];
  asistencias: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  private salonApiUrl =
    'https://proy-back-dnivel.onrender.com/api/salon/colegio/lista';
  private alumnoApiUrl =
    'https://proy-back-dnivel.onrender.com/api/alumno/salon';
  private asistenciaApiUrl =
    'https://proy-back-dnivel.onrender.com/api/asistencia';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.asistenciaForm = this.fb.group({
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
      console.log('Datos del usuario cargados:', { colegioId: this.colegioId });
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
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSalonChange() {
    const salonId = this.asistenciaForm.get('idSalon')?.value;
    if (salonId) {
      this.loadAlumnos(salonId);
    } else {
      this.alumnos = [];
      this.asistencias = [];
      this.asistenciaForm.get('idAlumno')?.reset();
    }
  }

  loadAlumnos(salonId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.alumnos = [];
    this.asistencias = [];
    this.asistenciaForm.get('idAlumno')?.reset();
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.alumnoApiUrl}/${salonId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.alumnos = response || [];
            console.log('Alumnos cargados:', this.alumnos);
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
    const alumnoId = this.asistenciaForm.get('idAlumno')?.value;
    if (alumnoId) {
      this.loadAsistencias(alumnoId);
    } else {
      this.asistencias = [];
    }
  }

  loadAsistencias(alumnoId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.asistenciaApiUrl}/${alumnoId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.asistencias = response || [];
            console.log('Asistencias cargadas:', this.asistencias);
            this.loading = false;
            if (this.asistencias.length === 0) {
              this.error = 'No se encontraron asistencias para este alumno';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar asistencias:', error);
          this.error = 'Error al cargar las asistencias. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
