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
  genders = ['Masculino', 'Femenino', 'Otro'];
  states = ['Activo', 'Inactivo'];
  
  // Datos originales
  salones: Salon[] = [];
  apoderados: Apoderado[] = [];
  
  // Datos filtrados para mostrar en los selects
  filteredSalones: Salon[] = [];
  filteredApoderados: Apoderado[] = [];
  
  // FormControls para la búsqueda
  salonSearchCtrl: FormControl = new FormControl('');
  apoderadoSearchCtrl: FormControl = new FormControl('');
  
  // Subject para manejar la limpieza de subscripciones
  private _onDestroy = new Subject<void>();
  
  loadingSalones = false;
  loadingApoderados = false;
  
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';
  private salonesApiUrl = 'https://proy-back-dnivel.onrender.com/api/salon/colegio/lista';
  private apoderadosApiUrl = 'https://proy-back-dnivel.onrender.com/api/apoderado/colegio/lista';
  private staticToken = '732612882';

  @ViewChild('picker') datepicker: MatDatepicker<Date> | undefined;

  constructor(
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<AddStudentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar
  ) {
    // VALIDACIONES SIMPLIFICADAS - Solo DNI obligatorio
    this.addForm = this.fb.group({
      numeroDocumento: [
        '',
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
      idApoderado: [''],
      idSalon: [''],
      idColegio: [this.data?.colegioId || ''],
    });
  }

  ngOnInit(): void {
    // Cargar salones y apoderados cuando se inicializa el componente
    this.loadSalones();
    this.loadApoderados();
    
    // Configurar filtros de búsqueda
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
        this.filteredSalones = this.salones.slice(); // Inicializar filteredSalones
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
        this.filteredApoderados = this.apoderados.slice(); // Inicializar filteredApoderados
        this.loadingApoderados = false;
        
       
        
        if (this.apoderados.length === 0) {
          console.warn('No se encontraron apoderados');
          this.snackBar.open('No se encontraron apoderados para este colegio', 'Cerrar', {
            duration: 3000,
          });
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

  private isFormValidForSave(): boolean {
    const numeroDocumento = this.addForm.get('numeroDocumento')?.value;
    const telefono = this.addForm.get('telefono')?.value;
    
    const dniValid = numeroDocumento && /^[0-9]{8}$/.test(numeroDocumento);
    const telefonoValid = !telefono || /^[0-9]{9}$/.test(telefono);
    
    return Boolean(dniValid && telefonoValid);
  }

  onSave(): void {
    if (this.isFormValidForSave()) {
      const formValue = this.addForm.value;
      
      const payload = {
        numeroDocumento: formValue.numeroDocumento,
        nombres: formValue.nombres || '',
        apellidoPaterno: formValue.apellidoPaterno || '',
        apellidoMaterno: formValue.apellidoMaterno || '',
        genero: formValue.genero === 'Masculino' ? 'm' : 
               formValue.genero === 'Femenino' ? 'f' : 
               formValue.genero === 'Otro' ? 'o' : '',
        telefono: formValue.telefono || '',
        fechaNacimiento: formValue.fechaNacimiento ? this.formatDate(formValue.fechaNacimiento) : '',
        direccion: formValue.direccion || '',
        estado: formValue.estado || 'Activo',
        idApoderado: formValue.idApoderado ? +formValue.idApoderado : null,
        idSalon: formValue.idSalon ? +formValue.idSalon : null,
        idColegio: this.data?.colegioId || 0,
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
        'DNI es obligatorio (8 dígitos). Si ingresa teléfono, debe tener 9 dígitos.',
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
      ('Calendario abierto manualmente');
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