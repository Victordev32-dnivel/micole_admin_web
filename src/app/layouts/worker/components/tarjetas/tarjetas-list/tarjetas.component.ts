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
} from '@angular/common/http';
import { TarjetasModalComponent } from '../tarjetas-modal/tarjetas-modal.component';
import { UserService } from '../../../../../services/UserData';

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
  salones: any[] = [];
  alumnos: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  private apiUrlSalon =
    'https://proy-back-dnivel.onrender.com/api/salon/colegio';
  private apiUrlAlumno =
    'https://proy-back-dnivel.onrender.com/api/alumno/tarjeta';
  private staticToken = '732612882';

  displayedColumns: string[] = ['nombre', 'tarjeta', 'acciones'];
  currentPage: number = 1;
  totalPages: number = 0;
  pageNumbers: number[] = [];
  pageSize: number = 200;

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
        this.loadSalones();
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
      .get<any>(`${this.apiUrlSalon}/${this.colegioId}?page=1&pageSize=200`, {
        headers,
      })
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

  onSalonChange(salonId: number) {
    this.alumnos = [];
    this.totalPages = 0;
    this.pageNumbers = [];
    this.currentPage = 1;
    if (salonId) {
      this.loadAlumnos(salonId);
    }
    this.cdr.detectChanges();
  }

  loadAlumnos(salonId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.alumnos = [];
    const headers = this.getHeaders();
    this.http
      .get<any>(
        `${this.apiUrlAlumno}/${salonId}?page=${this.currentPage}&pageSize=${this.pageSize}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.alumnos = response.alumnos || [];
            this.totalPages = response.totalPages || 1;
            this.pageNumbers = Array.from(
              { length: this.totalPages },
              (_, i) => i + 1
            );
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

  openRfidModal(alumnoId: number, currentRfid: number | null) {
    const dialogRef = this.dialog.open(TarjetasModalComponent, {
      width: '1000px',
      maxHeight: '90vh',
      disableClose: false,
      data: { alumnoId, currentRfid, colegioId: this.colegioId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.successMessage = `Tarjeta ${
          currentRfid ? 'actualizada' : 'asignada'
        } con éxito`;
        this.loadAlumnos(this.tarjetaForm.get('idSalon')?.value);
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (this.tarjetaForm.valid) {
      this.successMessage = 'Formulario válido. Selección guardada';
      this.error = null;
      this.cdr.detectChanges();
      console.log('Formulario enviado:', this.tarjetaForm.value);
    } else {
      this.error = 'Por favor, complete correctamente todos los campos';
      this.successMessage = null;
      this.cdr.detectChanges();
    }
  }
}
