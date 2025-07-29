import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-asistencia',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './edit-asistencia.component.html',
  styleUrls: ['./edit-asistencia.component.css']
})
export class EditAsistenciaDialogComponent {
  asistenciaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditAsistenciaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.asistenciaForm = this.fb.group({
      section: [{ value: data.section, disabled: true }],
      schedule: [data.schedule || ''],
      type: [data.type || ''],
      tolerance: [data.tolerance || '']
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

  onDelete(): void {
    this.dialogRef.close({ section: this.data.section, delete: true });
  }
}