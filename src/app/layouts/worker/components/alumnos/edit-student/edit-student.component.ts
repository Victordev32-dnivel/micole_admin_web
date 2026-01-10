import {
  Component,
  Inject,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
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
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
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
}

@Component({
  selector: 'app-student-edit',
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
    MatAutocompleteModule,
    MatIconModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: './edit-student.component.html',
  styleUrls: ['./edit-student.component.css'],
})
export class StudentEditComponent implements AfterViewInit, OnInit, OnDestroy {
  editForm: FormGroup;
  studentData: any;
  loading: boolean = false;
  error: string | null = null;
  genders = ['Masculino', 'Femenino', 'Otro'];
  states = ['Activo', 'Inactivo'];

  // Datos para salones y apoderados
  salones: Salon[] = [];
  apoderados: Apoderado[] = [];
  filteredSalones: Salon[] = [];
  filteredApoderados: Apoderado[] = [];
  salonSearchCtrl: FormControl = new FormControl('');
  apoderadoSearchCtrl: FormControl = new FormControl('');
  loadingSalones = false;
  loadingApoderados = false;
  hidePassword = true;

  private _onDestroy = new Subject<void>();

  private apiUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/alumno';
  private salonesApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista';
  private apoderadosApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/apoderado/colegio/lista';
  private staticToken = '732612882';

  isFormChanged: boolean = false;
  initialNumeroDocumento: string = '';

  @ViewChild('picker') datepicker: MatDatepicker<Date> | undefined;

  constructor(
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<StudentEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.studentData = data;

    this.editForm = this.fb.group({
      numeroDocumento: [
        '', // Elimina el { value: '', disabled: true }
        [
          Validators.required,
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
          Validators.pattern('^[0-9]{9}$'),
          Validators.minLength(9),
          Validators.maxLength(9),
        ],
      ],
      fechaNacimiento: [null],
      direccion: [''],
      estado: ['Activo'],
      idSalon: [''],
      idApoderado: [''],
      contrasena: [''],
    });

    // Suscribirse a cambios en el formulario
    this.editForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  ngOnInit(): void {
    // Cargar salones y apoderados cuando se inicializa el componente
    this.loadSalones();
    this.loadApoderados();

    // Configurar filtros de búsqueda
    this.setupSearchFilters();

    // Cargar datos iniciales al abrir el diálogo
    if (this.data && this.data.id) {
      this.loadInitialData();
    }
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
      const id = apoderado.id.toString();

      return nombre.includes(search) || id.includes(search);
    });
  }

  // Funciones para mostrar el texto seleccionado en el input
  displaySalonFn = (salon: Salon): string => {
    if (!salon) return '';
    return salon.nombre || salon.descripcion || `Salón ${salon.id}`;
  };

  displayApoderadoFn = (apoderado: Apoderado): string => {
    return apoderado ? apoderado.nombre : '';
  };

  // Manejadores de selección
  onSalonSelected(event: MatAutocompleteSelectedEvent): void {
    const salon = event.option.value;
    const salonId = salon ? salon.id : '';
    this.editForm.patchValue({ idSalon: salonId });
  }

  onApoderadoSelected(event: MatAutocompleteSelectedEvent): void {
    const apoderado = event.option.value;
    const apoderadoId = apoderado ? apoderado.id : '';
    this.editForm.patchValue({ idApoderado: apoderadoId });
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
        this.ngZone.run(() => {
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
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error al cargar salones:', error);
          this.loadingSalones = false;
          this.cdr.detectChanges();
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
        this.ngZone.run(() => {
          let apoderadosData = [];
          if (response && response.data && Array.isArray(response.data)) {
            apoderadosData = response.data;
          } else if (Array.isArray(response)) {
            apoderadosData = response;
          }

          this.apoderados = apoderadosData || [];
          this.filteredApoderados = this.apoderados.slice();
          this.loadingApoderados = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error al cargar apoderados:', error);
          this.loadingApoderados = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private loadInitialData() {
    this.loading = true;
    const studentId = Number(this.data.id);
    if (isNaN(studentId)) {
      this.error = 'ID inválido';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    const url = `${this.apiUrl}/${studentId}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          let student = response;
          if (response && response.data) {
            student = response.data;
          } else if (response && response.student) {
            student = response.student;
          } else if (response && response.alumno) {
            student = response.alumno;
          }

          console.log('Student data loaded:', student);

          this.initialNumeroDocumento = student.numeroDocumento || student.numero_documento;

          // Buscar el apoderado y salón actual para mostrarlos en los inputs
          const currentApoderado = this.apoderados.find(
            (a) => a.id === (student.idApoderado || student.id_apoderado)
          );
          const currentSalon = this.salones.find(
            (s) => s.id === (student.idSalon || student.id_salon)
          );

          this.editForm.patchValue({
            numeroDocumento: student.numeroDocumento || student.numero_documento,
            nombres: student.nombres || '',
            apellidoPaterno: student.apellidoPaterno || student.apellido_paterno || '',
            apellidoMaterno: student.apellidoMaterno || student.apellido_materno || '',
            genero:
              (student.genero === 'm' || student.genero === 'Masculino')
                ? 'Masculino'
                : (student.genero === 'f' || student.genero === 'Femenino')
                  ? 'Femenino'
                  : (student.genero === 'o' || student.genero === 'Otro')
                    ? 'Otro'
                    : '',
            telefono: student.telefono || '',
            fechaNacimiento: student.fechaNacimiento || student.fecha_nacimiento
              ? new Date(student.fechaNacimiento || student.fecha_nacimiento)
              : null,
            direccion: student.direccion || '',
            estado: (student.estado === 'activo' || student.estado === 'Activo') ? 'Activo' : 'Inactivo',
            idSalon: student.idSalon || student.id_salon || '',
            idApoderado: student.idApoderado || student.id_apoderado || '',
            contrasena: student.contrasena || student.password || '',
          });

          // Establecer valores en los controles de búsqueda
          if (currentApoderado) {
            this.apoderadoSearchCtrl.setValue(currentApoderado);
          }

          if (currentSalon) {
            this.salonSearchCtrl.setValue(currentSalon);
          }

          this.isFormChanged = false; // Inicialmente no hay cambios

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error('Error al cargar datos del alumno:', error);
          this.error = 'Error al cargar datos del alumno';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private checkFormChanges() {
    const currentValues = this.editForm.value;
    const initialValues = {
      numeroDocumento: this.studentData?.numeroDocumento || '',
      nombres: this.studentData?.nombres || '',
      apellidoPaterno: this.studentData?.apellidoPaterno || '',
      apellidoMaterno: this.studentData?.apellidoMaterno || '',
      genero:
        this.studentData?.genero === 'm'
          ? 'Masculino'
          : this.studentData?.genero === 'f'
            ? 'Femenino'
            : this.studentData?.genero === 'o'
              ? 'Otro'
              : '',
      telefono: this.studentData?.telefono || '',
      fechaNacimiento: this.studentData?.fechaNacimiento
        ? new Date(this.studentData.fechaNacimiento)
        : null,
      direccion: this.studentData?.direccion || '',
      estado: this.studentData?.estado === 'activo' ? 'Activo' : 'Inactivo',
      idSalon: this.studentData?.idSalon || '',
      idApoderado: this.studentData?.idApoderado || '',
      contrasena: this.studentData?.contrasena || this.studentData?.password || '',
    };

    const hasChanges = !this.deepEqual(currentValues, initialValues);
    this.isFormChanged = Boolean(hasChanges || !this.studentData);
    this.cdr.detectChanges();
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private isFormValidForSave(): boolean {
    const numeroDocumento = this.editForm.get('numeroDocumento')?.value;
    const telefono = this.editForm.get('telefono')?.value;

    const dniValid = numeroDocumento && /^[0-9]{8}$/.test(numeroDocumento);
    const telefonoValid = !telefono || /^[0-9]{9}$/.test(telefono);

    return Boolean(dniValid && telefonoValid);
  }

  private salonUpdateApiUrl = 'https://proy-back-dnivel-44j5.onrender.com/SalonAlumno';

  onSave(): void {
    const telefono = this.editForm.get('telefono')?.value;
    const telefonoValid = !telefono || /^[0-9]{9}$/.test(telefono);

    if (!telefonoValid) {
      this.error = 'Si ingresa teléfono, debe tener exactamente 9 dígitos.';
      return;
    }

    if (this.isFormChanged) {
      this.loading = true;
      this.error = null;

      const formValues = this.editForm.value;
      const studentId = Number(this.data.id);

      // Verificamos si hubo cambio de salón
      const initialSalonId = this.studentData?.idSalon || this.studentData?.id_salon;
      const newSalonId = formValues.idSalon ? +formValues.idSalon : null;

      const updateMainData = () => {
        const editData = {
          numeroDocumento: formValues.numeroDocumento,
          nombres: formValues.nombres || '',
          apellidoPaterno: formValues.apellidoPaterno || '',
          apellidoMaterno: formValues.apellidoMaterno || '',
          genero:
            formValues.genero === 'Masculino'
              ? 'm'
              : formValues.genero === 'Femenino'
                ? 'f'
                : formValues.genero === 'Otro'
                  ? 'o'
                  : '',
          telefono: formValues.telefono || '',
          fechaNacimiento: formValues.fechaNacimiento
            ? this.formatDate(formValues.fechaNacimiento)
            : null,
          direccion: formValues.direccion || '',
          estado: formValues.estado || 'Activo',
          idApoderado: formValues.idApoderado ? +formValues.idApoderado : null,
          idSalon: newSalonId,
          contrasena: formValues.contrasena || '',
          idColegio: this.data.colegioId || 0,
        };

        const url = `${this.apiUrl}/${studentId}`;

        this.http
          .put<any>(url, editData, { headers: this.getHeaders() })
          .subscribe({
            next: (response) => {
              this.ngZone.run(() => {
                this.dialogRef.close(this.editForm.value);
                this.loading = false;
                this.cdr.detectChanges();
              });
            },
            error: (error) => {
              this.ngZone.run(() => {
                console.error('Error al editar alumno:', error);
                this.error = 'Error al guardar cambios';
                this.loading = false;
                this.cdr.detectChanges();
              });
            },
          });
      };

      // Si cambió el salón, llamamos a la API específica primero
      if (newSalonId && newSalonId !== initialSalonId) {
        // PUT /SalonAlumno/{id}/{IdSalon}
        // USAMOS alumnoSalonId QUE VIENE DE LA TABLA (data.alumnoSalonId)
        const alumnoSalonId = this.data.alumnoSalonId;

        if (!alumnoSalonId) {
          console.error('No se tiene el alumnoSalonId para actualizar el salón.');
          // Fallback? O error? Procedemos con updateMainData pero avisamos?
          // Si no hay ID de relación, tal vez sea un POST en vez de PUT? 
          // Por ahora asumimos que el usuario quiere editar existentes.
          this.error = 'Error: No se encontró ID de relación alumno-salón.';
          this.loading = false;
          return;
        }

        const salonUrl = `${this.salonUpdateApiUrl}/${alumnoSalonId}/${newSalonId}`;

        this.http.put(salonUrl, {}, { headers: this.getHeaders() }).subscribe({
          next: () => {
            console.log('Salón actualizado correctamente');
            updateMainData();
          },
          error: (err) => {
            console.error('Error al actualizar salón:', err);
            // Aun si falla el salón, ¿intentamos guardar lo demás? 
            // Mejor mostramos error para que reintente.
            this.ngZone.run(() => {
              this.error = 'Error al actualizar el salón del alumno.';
              this.loading = false;
              this.cdr.detectChanges();
            });
          }
        });
      } else {
        // Si no cambio el salón, guardamos directo
        updateMainData();
      }

    } else {
      this.error = 'No hay cambios para guardar.';
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

  private formatDate(date: Date | null): string {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString();
    }
    return '';
  }
}
