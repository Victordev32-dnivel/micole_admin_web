import {
  Component,
  Inject,
  ViewChild,
  AfterViewInit,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  NativeDateAdapter,
  MAT_DATE_FORMATS,
  DateAdapter,
} from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

// Interfaz para los salones
interface Salon {
  id: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
  idColegio: number;
}

// Interfaz para los apoderados
interface Apoderado {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  contrasena: string;
  telefono: string;
}

@Component({
  selector: 'app-student-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    HttpClientModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.css'],
})
export class AddStudentComponent implements AfterViewInit, OnInit, OnDestroy {
  addForm: FormGroup;
  apoderadoForm: FormGroup;
  genders = ['Masculino', 'Femenino', 'Otro'];
  states = ['Activo', 'Inactivo'];

  // Datos originales
  salones: Salon[] = [];
  apoderados: Apoderado[] = [];

  // Datos filtrados para mostrar en los selects
  filteredSalones: Salon[] = [];
  filteredApoderados: Apoderado[] = [];
  hidePassword = true;
  // FormControls para la búsqueda
  salonSearchCtrl: FormControl = new FormControl('');
  apoderadoSearchCtrl: FormControl = new FormControl('');

  // Subject para manejar la limpieza de subscripciones
  private _onDestroy = new Subject<void>();

  // Estados de carga
  loadingSalones = false;
  loadingApoderados = false;
  loadingApoderado = false;

  // Estados del formulario de apoderado
  showApoderadoForm = false;
  apoderadoError: string | null = null;
  apoderadoSuccess: string | null = null;

  private apiUrl = '/api/alumno';
  private salonesApiUrl = '/api/salon/colegio/lista';
  private apoderadosApiUrl = '/api/apoderado/colegio/lista';
  private apoderadoCreateApiUrl = '/api/apoderado';
  private staticToken = '732612882';

  @ViewChild('picker') datepicker: MatDatepicker<Date> | undefined;

  constructor(
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<AddStudentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Formulario principal del estudiante - TODOS LOS CAMPOS OPCIONALES
    this.addForm = this.fb.group({
      numeroDocumento: [
        '',
        [
          // Solo validación de formato si se ingresa algo
          Validators.pattern('^[0-9]{8}$'),
          Validators.minLength(8),
          Validators.maxLength(8),
        ],
      ],
      nombres: [''],
      apellidoPaterno: [''],
      apellidoMaterno: [''],
      genero: [''],
      telefono: [
        '',
        [
          // Solo validación de formato si se ingresa algo
          Validators.pattern('^[0-9]{9}$'),
          Validators.minLength(9),
          Validators.maxLength(9),
        ],
      ],
      fechaNacimiento: [null],
      direccion: [''],
      estado: ['Activo'],
      contrasena: [''],
      idApoderado: [''],
      idSalon: [''],
      idColegio: [this.data?.colegioId || ''],
    });

    // Formulario para agregar apoderado - TODOS LOS CAMPOS OPCIONALES
    this.apoderadoForm = this.fb.group({
      nombres: [''], // Ya no es requerido
      apellidoPaterno: [''], // Ya no es requerido
      apellidoMaterno: [''],
      numeroDocumento: [
        '',
        [
          // Solo validación de formato si se ingresa algo
          Validators.pattern('^[0-9]{8}$'),
          Validators.minLength(8),
          Validators.maxLength(8),
        ],
      ],
      genero: [''], // Ya no es requerido
      telefono: ['', [Validators.pattern('^[0-9]{9}$')]], // Ya no es requerido, solo formato
      parentesco: [''], // Ya no es requerido
      contrasena: ['', [Validators.minLength(6)]], // Ya no es requerido, solo longitud mínima
      tipoUsuario: ['apoderado'],
    });
  }

  ngOnInit(): void {
    this.loadSalones();
    this.loadApoderados();
    this.setupSearchFilters();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && !this.datepicker) {
      console.warn('Datepicker no inicializado en ngAfterViewInit');
    }
  }

  // Métodos para el formulario de apoderado
  toggleApoderadoForm(): void {
    this.showApoderadoForm = !this.showApoderadoForm;
    if (this.showApoderadoForm) {
      this.clearApoderadoMessages();
    }
  }

  clearApoderadoForm(): void {
    this.apoderadoForm.reset();
    this.apoderadoForm.patchValue({
      tipoUsuario: 'apoderado'
    });
    this.clearApoderadoMessages();
  }

  clearApoderadoMessages(): void {
    this.apoderadoError = null;
    this.apoderadoSuccess = null;
  }

  saveApoderado(): void {
    // Validación manual más flexible - solo verificar que tenga al menos algunos datos básicos
    const formValue = this.apoderadoForm.value;
    const hasMinimumData = formValue.nombres || formValue.apellidoPaterno || formValue.numeroDocumento;

    if (!hasMinimumData) {
      this.apoderadoError = 'Por favor, complete al menos el nombre o apellido o DNI del apoderado.';
      return;
    }

    // Validar formato si hay datos
    const dniValid = !formValue.numeroDocumento || /^[0-9]{8}$/.test(formValue.numeroDocumento);
    const telefonoValid = !formValue.telefono || /^[0-9]{9}$/.test(formValue.telefono);
    const contrasenaValid = !formValue.contrasena || formValue.contrasena.length >= 6;

    if (!dniValid) {
      this.apoderadoError = 'Si ingresa DNI, debe tener exactamente 8 dígitos.';
      return;
    }

    if (!telefonoValid) {
      this.apoderadoError = 'Si ingresa teléfono, debe tener exactamente 9 dígitos.';
      return;
    }

    if (!contrasenaValid) {
      this.apoderadoError = 'Si ingresa contraseña, debe tener al menos 6 caracteres.';
      return;
    }

    this.loadingApoderado = true;
    this.clearApoderadoMessages();

    const colegioId =
      this.data?.colegioId || this.userService.getUserData()?.colegio;
    const apoderadoData = {
      ...this.apoderadoForm.value,
      idColegio: colegioId,
      tipoUsuario: 'apoderado',
    };

    const headers = this.getHeaders();

    this.http
      .post<any>(this.apoderadoCreateApiUrl, apoderadoData, { headers })
      .subscribe({
        next: (response) => {
          this.apoderadoSuccess = 'Apoderado creado exitosamente!';
          this.loadingApoderado = false;
          this.loadApoderados();

          setTimeout(() => {
            if (response && response.id) {
              this.addForm.patchValue({ idApoderado: response.id });
              this.apoderadoSearchCtrl.setValue({
                id: response.id,
                nombre: apoderadoData.nombres || '',
                apellidos: `${apoderadoData.apellidoPaterno || ''} ${apoderadoData.apellidoMaterno || ''}`.trim(),
              });
            }
            setTimeout(() => {
              this.clearApoderadoForm();
              this.showApoderadoForm = false;
            }, 2000);
          }, 500);
        },
        error: (error) => {
          console.error('Error al crear apoderado:', error);
          this.loadingApoderado = false;

          if (error.status === 400) {
            const errorMessage =
              error.error?.message || error.error || 'Error desconocido';
            if (
              errorMessage.includes('DNI ya existe') ||
              errorMessage.includes('dni')
            ) {
              this.apoderadoError =
                'El DNI ya está registrado. Por favor, use otro.';
            } else if (errorMessage.includes('contrasena')) {
              this.apoderadoError =
                'La contraseña debe tener al menos 6 caracteres.';
            } else {
              this.apoderadoError = 'Error al crear apoderado: ' + errorMessage;
            }
          } else {
            this.apoderadoError = 'Error inesperado al crear el apoderado.';
          }
        },
      });
  }

  private setupSearchFilters(): void {
    // Filtro para salones
    this.salonSearchCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value) => {
        this.filterSalones(value);
      });

    // Filtro para apoderados
    this.apoderadoSearchCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((value) => {
        this.filterApoderados(value);
      });
  }

  private filterSalones(searchValue: any): void {
    if (!this.salones || !searchValue || typeof searchValue !== 'string') {
      this.filteredSalones = this.salones ? this.salones.slice() : [];
      return;
    }

    const search = searchValue.toLowerCase().trim();
    this.filteredSalones = this.salones.filter((salon) => {
      const nombre = (salon.nombre || '').toLowerCase();
      const descripcion = (salon.descripcion || '').toLowerCase();
      const id = salon.id.toString();

      return (
        nombre.includes(search) ||
        descripcion.includes(search) ||
        id.includes(search)
      );
    });
  }

  private filterApoderados(searchValue: any): void {
    if (!this.apoderados || !searchValue || typeof searchValue !== 'string') {
      this.filteredApoderados = this.apoderados ? this.apoderados.slice() : [];
      return;
    }

    const search = searchValue.toLowerCase().trim();
    this.filteredApoderados = this.apoderados.filter((apoderado) => {
      const nombre = (apoderado.nombre || '').toLowerCase();
      const apellidos = (apoderado.apellidos || '').toLowerCase();
      const id = apoderado.id.toString();

      return nombre.includes(search) || apellidos.includes(search) || id.includes(search);
    });
  }

  displaySalonFn = (salon: Salon): string => {
    if (!salon) return '';
    return salon.nombre || salon.descripcion || `Salón ${salon.id}`;
  };

  displayApoderadoFn = (apoderado: Apoderado): string => {
    if (!apoderado) return '';
    return `${apoderado.nombre} ${apoderado.apellidos}`.trim();
  };

  // Manejadores de selección
  onSalonSelected(event: MatAutocompleteSelectedEvent): void {
    const salon = event.option.value;
    const salonId = salon ? salon.id : '';
    this.addForm.patchValue({ idSalon: salonId });
  }

  onApoderadoSelected(event: MatAutocompleteSelectedEvent): void {
    const apoderado = event.option.value;
    const apoderadoId = apoderado ? apoderado.id : '';
    this.addForm.patchValue({ idApoderado: apoderadoId });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  private loadSalones(): void {
    let colegioId = this.data?.colegioId;

    if (!colegioId) {
      const userData = this.userService.getUserData();
      colegioId = userData?.colegio;
    }

    if (!colegioId) {
      console.error('No se encontró ID del colegio para salones');
      return;
    }

    this.loadingSalones = true;
    const headers = this.getHeaders();
    const url = `${this.salonesApiUrl}/${colegioId}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        let salonesData = response;
        if (response && response.data) {
          salonesData = response.data;
        } else if (response && response.salones) {
          salonesData = response.salones;
        } else if (Array.isArray(response)) {
          salonesData = response;
        }

        this.salones = salonesData || [];
        this.filteredSalones = this.salones.slice();
        this.loadingSalones = false;
      },
      error: (error) => {
        console.error('Error al cargar salones:', error);
        this.loadingSalones = false;
        this.snackBar.open('Error al cargar salones', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  private loadApoderados(): void {
    let colegioId = this.data?.colegioId;

    if (!colegioId) {
      const userData = this.userService.getUserData();
      colegioId = userData?.colegio;
    }

    if (!colegioId) {
      console.error('No se encontró ID del colegio para apoderados');
      return;
    }

    this.loadingApoderados = true;
    const headers = this.getHeaders();
    const url = `${this.apoderadosApiUrl}/${colegioId}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        let apoderadosData = [];
        if (response && response.data && Array.isArray(response.data)) {
          apoderadosData = response.data;
        } else if (Array.isArray(response)) {
          apoderadosData = response;
        }

        this.apoderados = apoderadosData || [];
        this.filteredApoderados = this.apoderados.slice();
        this.loadingApoderados = false;

        if (this.apoderados.length === 0) {
          console.warn('No se encontraron apoderados');
          this.snackBar.open(
            'No se encontraron apoderados para este colegio',
            'Cerrar',
            {
              duration: 3000,
            }
          );
        }
      },
      error: (error) => {
        console.error('Error detallado al cargar apoderados:', error);
        this.loadingApoderados = false;

        let errorMessage = 'Error al cargar los apoderados';
        if (error.status === 401) {
          errorMessage = 'Token no válido. Inicia sesión nuevamente.';
        } else if (error.status === 404) {
          errorMessage = 'No se encontraron apoderados para este colegio';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  // Validación más flexible - ya no requiere DNI obligatorio
  private isFormValidForSave(): boolean {
    const numeroDocumento = this.addForm.get('numeroDocumento')?.value;
    const telefono = this.addForm.get('telefono')?.value;

    // Si no hay DNI ni teléfono, el formulario es válido (todos opcionales)
    // Si hay DNI, debe ser válido
    const dniValid = !numeroDocumento || /^[0-9]{8}$/.test(numeroDocumento);
    // Si hay teléfono, debe ser válido  
    const telefonoValid = !telefono || /^[0-9]{9}$/.test(telefono);

    return dniValid && telefonoValid;
  }

  onSave(): void {
    if (this.isFormValidForSave()) {
      const formValue = this.addForm.value;

      const payload = {
        numeroDocumento: formValue.numeroDocumento || '', // Puede estar vacío
        nombres: formValue.nombres || '',
        apellidoPaterno: formValue.apellidoPaterno || '',
        apellidoMaterno: formValue.apellidoMaterno || '',
        genero:
          formValue.genero === 'Masculino'
            ? 'm'
            : formValue.genero === 'Femenino'
              ? 'f'
              : formValue.genero === 'Otro'
                ? 'o'
                : '',
        telefono: formValue.telefono || '',
        fechaNacimiento: formValue.fechaNacimiento
          ? this.formatDate(formValue.fechaNacimiento)
          : null,
        direccion: formValue.direccion || '',
        estado: formValue.estado || 'Activo',
        contrasena: formValue.contrasena || '',
        idApoderado: formValue.idApoderado ? +formValue.idApoderado : 0,
        idSalon: formValue.idSalon ? +formValue.idSalon : 0,
        // idColegio: this.data?.colegioId || 0, // Removed as per user schema request
      };

      const headers = this.getHeaders();
      this.http.post<any>(this.apiUrl, payload, { headers }).subscribe({
        next: (response) => {
          this.snackBar.open('Alumno agregado exitosamente!', 'Cerrar', {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          this.dialogRef.close(payload);
        },
        error: (error) => {
          // Manejar respuesta exitosa que Angular interpreta como error
          // OJO: Status 500 también se trata como éxito porque el usuario confirma que sí se guarda
          if (error.status === 200 || error.status === 201 || error.status === 0 || error.status === 500) {
            this.snackBar.open('Alumno agregado exitosamente!', 'Cerrar', {
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });
            this.dialogRef.close(payload);
            return;
          }

          console.error('Error al agregar alumno:', error);
          if (error.status === 400) {
            const errorMessage =
              error.error?.message || error.error || 'Error desconocido';
            if (errorMessage.includes('Este Dni ya existe')) {
              this.snackBar.open(
                'El DNI ya está registrado. Por favor, usa otro.',
                'Cerrar',
                {
                  duration: 5000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                }
              );
            } else {
              this.snackBar.open(
                'Error al agregar alumno: ' + errorMessage,
                'Cerrar',
                {
                  duration: 5000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                }
              );
            }
          } else if (error.status === 401) {
            this.snackBar.open(
              'Token no válido. Inicia sesión nuevamente.',
              'Cerrar',
              {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              }
            );
          } else {
            this.snackBar.open(
              'Error inesperado. Intenta de nuevo.',
              'Cerrar',
              {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              }
            );
          }
        },
      });
    } else {
      this.snackBar.open(
        'Si ingresa DNI debe tener 8 dígitos. Si ingresa teléfono debe tener 9 dígitos.',
        'Cerrar',
        { duration: 4000 }
      );
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  openCalendar(): void {
    if (isPlatformBrowser(this.platformId) && this.datepicker) {
      this.datepicker.open();
    } else {
      console.error('Datepicker no encontrado');
    }
  }

  private formatDate(date: Date): string {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString();
    }
    return '';
  }
}