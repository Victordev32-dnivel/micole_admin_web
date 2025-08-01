import {
  Component,
  Inject,
  ViewChild,
  AfterViewInit,
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.css'],
})
export class AddStudentComponent implements AfterViewInit {
  addForm: FormGroup;
  genders = ['Masculino', 'Femenino', 'Otro'];
  states = ['Activo', 'Inactivo'];
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';
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
      estado: ['Activo', Validators.required],
      idApoderado: ['', Validators.required],
      idSalon: ['', Validators.required],
      idColegio: [this.data.colegioId, Validators.required],
    });
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

  onSave(): void {
    if (this.addForm.valid) {
      const formValue = this.addForm.value;
      const payload = {
        numeroDocumento: formValue.numeroDocumento,
        nombres: formValue.nombres,
        apellidoPaterno: formValue.apellidoPaterno,
        apellidoMaterno: formValue.apellidoMaterno,
        genero: formValue.genero,
        telefono: formValue.telefono,
        fechaNacimiento: this.formatDate(formValue.fechaNacimiento),
        direccion: formValue.direccion,
        estado: formValue.estado,
        idApoderado: +formValue.idApoderado,
        idSalon: +formValue.idSalon,
        idColegio: +formValue.idColegio,
      };

      console.log('Payload enviado al POST:', payload);
      const headers = this.getHeaders();
      this.http.post<any>(this.apiUrl, payload, { headers }).subscribe({
        next: (response) => {
          console.log('Alumno agregado:', response);
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
      console.log('Formulario inválido:', this.addForm.errors);
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

  private formatDate(date: Date): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  }
}
