import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-matricula',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './edit-matricula.component.html',
  styleUrls: ['./edit-matricula.component.css']
})
export class EditMatriculaDialogComponent {
  matriculaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditMatriculaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.matriculaForm = this.fb.group({
      section: [{ value: data.section, disabled: true }],
      student: [data.student || ''],
      status: [data.status || '']
    });
  }

  onSave(): void {
    if (this.matriculaForm.valid) {
      this.dialogRef.close(this.matriculaForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDelete(): void {
    this.dialogRef.close({ section: this.data.section, delete: true });
  }
}