import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-asistencia',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './add-asistencia.component.html',
  styleUrls: ['./add-asistencia.component.css']
})
export class AddAsistenciaDialogComponent {
  asistenciaForm: FormGroup;

  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<AddAsistenciaDialogComponent>) {
    this.asistenciaForm = this.fb.group({
      section: [''],
      schedule: [''],
      type: [''],
      tolerance: ['']
    });
  }

  onSave(): void {
    if (this.asistenciaForm.valid) {
      this.dialogRef.close(this.asistenciaForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}