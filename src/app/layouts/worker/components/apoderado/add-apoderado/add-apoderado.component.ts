import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-apoderados',
  templateUrl: './add-apoderado.component.html',
  styleUrls: ['./add-apoderado.component.css'],
  imports: [MatIconModule, MatCardModule, MatFormFieldModule, MatProgressSpinnerModule, CommonModule, ReactiveFormsModule]
})
export class AddApoderadosComponent {
  apoderadoForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<AddApoderadosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.apoderadoForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      dni: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(8)],
      ],
      telefono: ['', Validators.required],
     
    });
  }

  onSubmit(): void {
    if (this.apoderadoForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.http
      .post('http://localhost:3000/api/apoderados', this.apoderadoForm.value)
      .subscribe({
        next: () => {
          this.successMessage = 'Apoderado agregado correctamente';
          this.loading = false;
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err: HttpErrorResponse) => {
          this.error =
            err.error?.message || 'Ocurrió un error al agregar el apoderado.';
          this.loading = false;
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
