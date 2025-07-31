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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.addForm = this.fb.group({
      numeroDocumento: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{8}$')],
      ],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      genero: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
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
      const headers = this.getHeaders();
      const payload = {
        numeroDocumento: this.addForm.value.numeroDocumento,
        nombres: this.addForm.value.nombres,
        apellidoPaterno: this.addForm.value.apellidoPaterno,
        apellidoMaterno: this.addForm.value.apellidoMaterno,
        genero:
          this.addForm.value.genero === 'Masculino'
            ? 'm'
            : this.addForm.value.genero === 'Femenino'
            ? 'f'
            : 'o',
        telefono: this.addForm.value.telefono,
        fechaNacimiento: this.addForm.value.fechaNacimiento,
        direccion: this.addForm.value.direccion,
        estado: this.addForm.value.estado,
        idApoderado: this.addForm.value.idApoderado,
        idSalon: this.addForm.value.idSalon,
        idColegio: this.addForm.value.idColegio,
      };

      this.http
        .post<any>(`${this.apiUrl}/${this.data.colegioId}`, payload, {
          headers,
        })
        .subscribe({
          next: (response) => {
            console.log('Alumno agregado:', response);
            this.dialogRef.close(this.addForm.value);
          },
          error: (error) => {
            console.error('Error al agregar alumno:', error);
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
}
