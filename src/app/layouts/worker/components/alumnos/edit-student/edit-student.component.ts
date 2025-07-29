import { Component, Inject, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
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
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    HttpClientModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './edit-student.component.html',
  styleUrls: ['./edit-student.component.css']
})
export class StudentEditComponent implements AfterViewInit {
  editForm: FormGroup;
  studentData: any;
  loading: boolean = false;
  error: string | null = null;
  genders = ['Masculino', 'Femenino', 'Otro'];
  relationships = ['Padre', 'Madre', 'Tutor Legal'];
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';

  @ViewChild('picker') datepicker: MatDatepicker<Date> | undefined;

  constructor(
    public dialogRef: MatDialogRef<StudentEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.studentData = data;
    this.editForm = this.fb.group({
      numeroDocumento: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      genero: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      fechaNacimiento: [''],
      direccion: [''],
      estado: ['', Validators.required],
      idSalon: ['', Validators.required],
      idApoderado: ['', Validators.required]
    });
    this.loadStudentData();
  }

  ngAfterViewInit(): void {
    if (!this.datepicker) {
      console.warn('Datepicker no inicializado en ngAfterViewInit');
    }
  }

  loadStudentData() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/${this.data.id}`).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          const { apoderado, ...student } = response; // Desestructura para separar apoderado
          this.editForm.patchValue({
            numeroDocumento: student.numeroDocumento,
            nombres: student.nombres,
            apellidoPaterno: student.apellidoPaterno,
            apellidoMaterno: student.apellidoMaterno,
            genero: student.genero === 'm' ? 'Masculino' : student.genero === 'f' ? 'Femenino' : 'Otro',
            telefono: student.telefono,
            fechaNacimiento: student.fechaNacimiento,
            direccion: student.direccion,
            estado: student.estado,
            idSalon: student.idSalon,
            idApoderado: student.idApoderado
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
      }
    });
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.loading = true;
      const editData = {
        ...this.editForm.value,
        genero: this.editForm.value.genero === 'Masculino' ? 'm' : this.editForm.value.genero === 'Femenino' ? 'f' : 'o'
      };
      this.http.put<any>(`${this.apiUrl}/${this.data.id}`, editData).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            console.log('Edición exitosa:', response);
            this.dialogRef.close(this.editForm.value); // Cierra con los datos editados
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al editar alumno:', error);
          this.error = 'Error al guardar cambios';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  openCalendar(): void {
    if (this.datepicker) {
      this.datepicker.open();
      console.log('Calendario abierto manualmente');
    } else {
      console.error('Datepicker no encontrado');
    }
  }
}