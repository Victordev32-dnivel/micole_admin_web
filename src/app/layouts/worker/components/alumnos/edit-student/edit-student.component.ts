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
  relationships = ['Padre', 'Madre', 'Tutor Legal'];
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno/colegio';
  private staticToken = '732612882';

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
        { value: this.data.numero_documento, disabled: true },
        [Validators.required, Validators.pattern('^[0-9]{8}$')],
      ],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      genero: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      fechaNacimiento: ['', Validators.required],
      direccion: ['', Validators.required],
      estado: ['', Validators.required],
      idSalon: ['', Validators.required],
      idApoderado: ['', Validators.required],
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && !this.datepicker) {
      console.warn('Datepicker no inicializado en ngAfterViewInit');
    }
    if (isPlatformBrowser(this.platformId)) {
      this.loadStudentData();
    }
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  loadStudentData() {
    this.loading = true;
    const headers = this.getHeaders();
    this.http
      .get<any>(
        `${this.apiUrl}/${this.data.colegioId}/${this.data.numero_documento}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            const { apoderado, ...student } = response;
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
              fechaNacimiento: student.fechaNacimiento,
              direccion: student.direccion,
              estado: student.estado,
              idSalon: student.idSalon,
              idApoderado: student.idApoderado,
            });
            console.log('Datos cargados para edición:', response);
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar datos del alumno:', error);
          this.error = 'Error al cargar datos';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.loading = true;
      const editData = {
        ...this.editForm.value,
        genero:
          this.editForm.value.genero === 'Masculino'
            ? 'm'
            : this.editForm.value.genero === 'Femenino'
            ? 'f'
            : 'o',
        colegioId: this.data.colegioId,
      };
      const headers = this.getHeaders();
      this.http
        .put<any>(
          `${this.apiUrl}/${this.data.colegioId}/${this.data.numero_documento}`,
          editData,
          { headers }
        )
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
}
