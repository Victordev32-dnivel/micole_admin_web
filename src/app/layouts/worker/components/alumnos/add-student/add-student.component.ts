import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';

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
  selector: 'app-student-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.css']
})
export class AddStudentComponent implements AfterViewInit {
  addForm: FormGroup;
  genders = ['Masculino', 'Femenino', 'Otro'];
  relationships = ['Padre', 'Madre', 'Tutor Legal'];

  @ViewChild('picker') datepicker: MatDatepicker<Date> | undefined;

  constructor(
    public dialogRef: MatDialogRef<AddStudentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.addForm = this.fb.group({
      // Datos del Alumno
      studentDni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      studentFirstName: ['', Validators.required],
      studentLastNameP: ['', Validators.required],
      studentLastNameM: ['', Validators.required],
      studentGender: ['', Validators.required],
      studentPhone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      studentBirthDate: ['', Validators.required],
      studentAddress: ['', Validators.required],

      // Datos del Apoderado
      guardianDni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      guardianFirstName: ['', Validators.required],
      guardianLastNameP: ['', Validators.required],
      guardianLastNameM: ['', Validators.required],
      guardianGender: ['', Validators.required],
      guardianPhone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      guardianRelationship: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    if (!this.datepicker) {
      console.warn('Datepicker no inicializado en ngAfterViewInit');
    }
  }

  onSave(): void {
    if (this.addForm.valid) {
      this.dialogRef.close(this.addForm.value);
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