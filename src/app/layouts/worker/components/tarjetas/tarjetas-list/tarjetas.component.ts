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
import { AddTarjetaModalComponent } from '../add-tarjeta-modal/add-tarjeta-modal.component';
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
  filteredAlumnos: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  private apiUrlSalon =
    'https://proy-back-dnivel.onrender.com/api/salon/colegio';
  private apiUrlAlumno =
    'https://proy-back-dnivel.onrender.com/api/alumno/tarjeta';
  private apiUrlTarjeta = 'https://proy-back-dnivel.onrender.com/api/tarjeta';
  private staticToken = '732612882';

  // Columnas reorganizadas con código primero
  displayedColumns: string[] = ['codigo', 'nombre', 'tarjeta', 'acciones'];
  currentPage: number = 1;
  totalPages: number = 0;
  totalAlumnos: number = 0;
  pageNumbers: number[] = [];
  pageSize: number = 20;

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
      searchTerm: [''],
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.loadSalones();

      // Escuchar cambios en el campo de búsqueda
      this.tarjetaForm.get('searchTerm')?.valueChanges.subscribe((term) => {
        this.filterAlumnos(term);
      });
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
    this.resetPagination();
    if (salonId) {
      this.loadAlumnos(salonId);
    }
    this.cdr.detectChanges();
  }

  private resetPagination() {
    this.alumnos = [];
    this.filteredAlumnos = [];
    this.totalPages = 0;
    this.totalAlumnos = 0;
    this.pageNumbers = [];
    this.currentPage = 1;
    this.tarjetaForm.get('searchTerm')?.setValue('');
  }

  loadAlumnos(salonId: number, page: number = 1) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (page !== this.currentPage) {
      this.currentPage = page;
    }

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
            this.filteredAlumnos = [...this.alumnos];
            this.totalPages = response.totalPages || 1;
            this.totalAlumnos = response.totalAlumnos || 0;
            this.pageNumbers = Array.from(
              { length: this.totalPages },
              (_, i) => i + 1
            );
            console.log('Alumnos cargados:', {
              alumnos: this.alumnos,
              página: this.currentPage,
              totalPáginas: this.totalPages,
              totalAlumnos: this.totalAlumnos,
            });
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

  // Método para filtrar alumnos por nombre o código
  filterAlumnos(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredAlumnos = [...this.alumnos];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredAlumnos = this.alumnos.filter(
      (alumno) =>
        (alumno.nombre && alumno.nombre.toLowerCase().includes(term)) ||
        (alumno.codigo && alumno.codigo.toString().toLowerCase().includes(term))
    );
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.tarjetaForm.get('searchTerm')?.setValue('');
    this.filteredAlumnos = [...this.alumnos];
  }

  // Métodos de paginación
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      const salonId = this.tarjetaForm.get('idSalon')?.value;
      if (salonId) {
        this.loadAlumnos(salonId, page);
      }
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
        const salonId = this.tarjetaForm.get('idSalon')?.value;
        if (salonId) {
          this.loadAlumnos(salonId, this.currentPage);
        }
      }
      this.cdr.detectChanges();
    });
  }

// Reemplaza el método openAddTarjetaModal en tu TarjetasComponent
// Reemplaza el método openAddTarjetaModal en tu TarjetasComponent

openAddTarjetaModal(): void {
  const salonId = this.tarjetaForm.get('idSalon')?.value;

  if (!salonId) {
    this.error = 'Debe seleccionar un salón primero';
    this.cdr.detectChanges();
    return;
  }

  this.loading = true;
  this.error = null;
  const headers = this.getHeaders();

  // Usar la URL correcta para obtener alumnos con todos los datos
  this.http
    .get<any>(
      `https://proy-back-dnivel.onrender.com/api/alumno/salon/${salonId}?includeAll=true`,
      { headers }
    )
    .subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.loading = false;

          // Verificar la estructura de la respuesta y filtrar datos válidos
          console.log('Respuesta completa de alumnos:', response);

          let alumnos = response.data || response.alumnos || response || [];
          
          // Filtrar y limpiar datos de alumnos - CORREGIDO para la estructura real
          alumnos = alumnos.filter((alumno: any) => {
            return alumno && (alumno.alumno || alumno.idAlumno);
          }).map((alumno: any) => ({
            id: alumno.idAlumno,
            nombre: alumno.alumno || `Alumno ${alumno.idAlumno}`,
            codigo: alumno.codigo || null,
            tarjeta: alumno.tarjeta || null
          }));

          console.log('Alumnos procesados:', alumnos);

          if (alumnos.length === 0) {
            this.error = 'No hay alumnos válidos en este salón';
            this.cdr.detectChanges();
            return;
          }

          const dialogRef = this.dialog.open(AddTarjetaModalComponent, {
            width: '500px',
            disableClose: true,
            data: {
              colegioId: this.colegioId,
              alumnos: alumnos,
              salonId: salonId
            },
          });

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.addTarjeta(result);
            }
          });
        });
      },
      error: (error) => {
        console.error('Error al cargar alumnos:', error);
        this.ngZone.run(() => {
          this.error = 'Error al cargar los alumnos del salón: ' + 
            (error.error?.message || error.message || 'Error desconocido');
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
}
  // Nuevo método para agregar tarjeta
  addTarjeta(tarjetaData: any): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const headers = this.getHeaders();
    this.http.post(this.apiUrlTarjeta, tarjetaData, { headers }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.successMessage = 'Tarjeta agregada con éxito';
          this.loading = false;

          // Recargar datos si hay un salón seleccionado
          const salonId = this.tarjetaForm.get('idSalon')?.value;
          if (salonId) {
            this.loadAlumnos(salonId, this.currentPage);
          }

          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al agregar tarjeta:', error);
        this.error = error.error?.message || 'Error al agregar la tarjeta';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
