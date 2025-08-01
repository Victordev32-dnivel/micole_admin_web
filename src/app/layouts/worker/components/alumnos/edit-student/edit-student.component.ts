import {
  Component,
  Inject,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
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

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: './edit-student.component.html',
  styleUrls: ['./edit-student.component.css'],
})
export class StudentEditComponent implements AfterViewInit {
  editForm: FormGroup;
  studentData: any;
  loading: boolean = false;
  error: string | null = null;
  genders = ['Masculino', 'Femenino', 'Otro'];
  states = ['Activo', 'Inactivo'];
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';
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
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      genero: ['', Validators.required],
      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{9}$'),
          Validators.minLength(9),
          Validators.maxLength(9),
        ],
      ],
      fechaNacimiento: ['', Validators.required],
      direccion: ['', Validators.required],
      estado: ['', Validators.required],
      idSalon: ['', Validators.required],
      idApoderado: ['', Validators.required],
    });

    // Suscribirse a cambios en el formulario
    this.editForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });

    // Cargar datos iniciales al abrir el diálogo
    if (data && data.id) {
      this.loadInitialData();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && !this.datepicker) {
      console.warn('Datepicker no inicializado en ngAfterViewInit');
    }
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
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
          this.initialNumeroDocumento = student.numeroDocumento; // Guardar el valor inicial
          this.editForm.patchValue({
            numeroDocumento: student.numeroDocumento,
            nombres: student.nombres,
            apellidoPaterno: student.apellidoPaterno,
            apellidoMaterno: student.apellidoMaterno,
            genero:
              student.genero === 'm'
                ? 'Masculino'
                : student.genero === 'f'
                ? 'Femenino'
                : 'Otro',
            telefono: student.telefono,
            fechaNacimiento: student.fechaNacimiento
              ? new Date(student.fechaNacimiento)
              : null,
            direccion: student.direccion || '',
            estado: student.estado === 'activo' ? 'Activo' : 'Inactivo',
            idSalon: student.idSalon,
            idApoderado: student.idApoderado,
          });
          this.isFormChanged = false;
          console.log('Datos cargados para edición:', student);
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar datos del alumno:', error);
        this.error = 'Error al cargar datos del alumno';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private checkFormChanges() {
    if (this.editForm.valid) {
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
            : 'Otro',
        telefono: this.studentData?.telefono || '',
        fechaNacimiento: this.studentData?.fechaNacimiento
          ? new Date(this.studentData.fechaNacimiento)
          : null,
        direccion: this.studentData?.direccion || '',
        estado: this.studentData?.estado === 'activo' ? 'Activo' : 'Inactivo',
        idSalon: this.studentData?.idSalon || '',
        idApoderado: this.studentData?.idApoderado || '',
      };
      this.isFormChanged = !this.deepEqual(currentValues, initialValues);
    } else {
      this.isFormChanged = false;
    }
    this.cdr.detectChanges();
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  onSave(): void {
    if (this.editForm.valid && this.isFormChanged) {
      this.loading = true;
      const editData = {
        numeroDocumento: this.initialNumeroDocumento, // Usar el valor inicial guardado
        nombres: this.editForm.value.nombres,
        apellidoPaterno: this.editForm.value.apellidoPaterno,
        apellidoMaterno: this.editForm.value.apellidoMaterno,
        genero:
          this.editForm.value.genero === 'Masculino'
            ? 'm'
            : this.editForm.value.genero === 'Femenino'
            ? 'f'
            : 'o',
        telefono: this.editForm.value.telefono,
        fechaNacimiento: this.formatDate(this.editForm.value.fechaNacimiento),
        direccion: this.editForm.value.direccion,
        estado: this.editForm.value.estado,
        idApoderado: +this.editForm.value.idApoderado,
        idSalon: +this.editForm.value.idSalon,
        idColegio: this.data.colegioId || 0,
      };
      console.log('Payload enviado al PUT:', editData); // Depuración
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
            console.error('Error al editar alumno:', error);
            this.error = 'Error al guardar cambios';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
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
