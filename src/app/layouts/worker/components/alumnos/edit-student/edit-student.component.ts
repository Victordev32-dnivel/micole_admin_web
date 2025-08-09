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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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
  
  private _onDestroy = new Subject<void>();
  
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';
  private salonesApiUrl = 'https://proy-back-dnivel.onrender.com/api/salon/colegio/lista';
  private apoderadosApiUrl = 'https://proy-back-dnivel.onrender.com/api/apoderado/colegio/lista';
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
        { value: '', disabled: true },
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
      fechaNacimiento: [''],
      direccion: [''],
      estado: ['Activo'],
      idSalon: [''],
      idApoderado: [''],
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
    this.filteredSalones = this.salones.filter(salon => {
      const nombre = (salon.nombre || '').toLowerCase();
      const descripcion = (salon.descripcion || '').toLowerCase();
      const id = salon.id.toString();
      
      return nombre.includes(search) || 
             descripcion.includes(search) || 
             id.includes(search);
    });
  }

  private filterApoderados(searchValue: any): void {
    if (!this.apoderados || !searchValue || typeof searchValue !== 'string') {
      this.filteredApoderados = this.apoderados ? this.apoderados.slice() : [];
      return;
    }

    const search = searchValue.toLowerCase().trim();
    this.filteredApoderados = this.apoderados.filter(apoderado => {
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
    console.log('Salón seleccionado:', salon);
  }

  onApoderadoSelected(event: MatAutocompleteSelectedEvent): void {
    const apoderado = event.option.value;
    const apoderadoId = apoderado ? apoderado.id : '';
    this.editForm.patchValue({ idApoderado: apoderadoId });
    console.log('Apoderado seleccionado:', apoderado);
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

    console.log('Cargando salones para colegio ID:', colegioId);
    
    if (!colegioId) {
      console.error('No se encontró ID del colegio para salones');
      return;
    }

    this.loadingSalones = true;
    const headers = this.getHeaders();
    const url = `${this.salonesApiUrl}/${colegioId}`;

    console.log('Cargando salones desde URL:', url);

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('Respuesta completa de salones:', response);
          
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
          
          console.log('Salones procesados:', this.salones);
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

    console.log('Cargando apoderados para colegio ID:', colegioId);
    
    if (!colegioId) {
      console.error('No se encontró ID del colegio para apoderados');
      return;
    }

    this.loadingApoderados = true;
    const headers = this.getHeaders();
    const url = `${this.apoderadosApiUrl}/${colegioId}`;

    console.log('Cargando apoderados desde URL:', url);

    this.http.get<any>(url, { headers }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          console.log('Respuesta completa de apoderados:', response);
          
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
          
          console.log('Apoderados procesados:', this.apoderados);
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
    console.log('URL de la petición GET:', url);
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          const student = response;
          this.initialNumeroDocumento = student.numeroDocumento;
          
          // Buscar el apoderado y salón actual para mostrarlos en los inputs
          const currentApoderado = this.apoderados.find(a => a.id === student.idApoderado);
          const currentSalon = this.salones.find(s => s.id === student.idSalon);
          
          this.editForm.patchValue({
            numeroDocumento: student.numeroDocumento,
            nombres: student.nombres || '',
            apellidoPaterno: student.apellidoPaterno || '',
            apellidoMaterno: student.apellidoMaterno || '',
            genero:
              student.genero === 'm'
                ? 'Masculino'
                : student.genero === 'f'
                ? 'Femenino'
                : student.genero === 'o'
                ? 'Otro'
                : '',
            telefono: student.telefono || '',
            fechaNacimiento: student.fechaNacimiento
              ? new Date(student.fechaNacimiento)
              : null,
            direccion: student.direccion || '',
            estado: student.estado === 'activo' ? 'Activo' : 'Inactivo',
            idSalon: student.idSalon || '',
            idApoderado: student.idApoderado || '',
          });
          
          // Establecer valores en los controles de búsqueda
          if (currentApoderado) {
            this.apoderadoSearchCtrl.setValue(currentApoderado);
          }
          
          if (currentSalon) {
            this.salonSearchCtrl.setValue(currentSalon);
          }
          
          this.isFormChanged = false; // Inicialmente no hay cambios
          console.log('Datos cargados para edición:', student);
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
      
      const editData = {
        numeroDocumento: this.initialNumeroDocumento,
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
          : '', 
        direccion: formValues.direccion || '',
        estado: formValues.estado || 'Activo', 
        idApoderado: formValues.idApoderado ? +formValues.idApoderado : null, 
        idSalon: formValues.idSalon ? +formValues.idSalon : null, 
        idColegio: this.data.colegioId || 0,
      };
      
      console.log('Payload enviado al PUT:', editData);
      
      const studentId = Number(this.data.id);
      const url = `${this.apiUrl}/${studentId}`;
      console.log('URL de la petición PUT:', url);
      
      this.http
        .put<any>(url, editData, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.ngZone.run(() => {
              console.log('Edición exitosa:', response);
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
      console.log('Calendario abierto manualmente');
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