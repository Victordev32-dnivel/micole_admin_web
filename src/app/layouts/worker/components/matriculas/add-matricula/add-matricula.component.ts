import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-matricula',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './add-matricula.component.html',
  styleUrls: ['./add-matricula.component.css']
})
export class AddMatriculaDialogComponent {
  matriculaForm: FormGroup;

  constructor(private fb: FormBuilder, public dialogRef: MatDialogRef<AddMatriculaDialogComponent>) {
    this.matriculaForm = this.fb.group({
      section: [''],
      student: [''],
      status: ['']
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
}