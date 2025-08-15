import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-apoderado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-apoderado.component.html',
  styleUrls: ['./edit-apoderado.component.css'],
})
export class EditApoderadoComponent {
  apoderadoForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditApoderadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.apoderadoForm = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      apellido: [data?.apellido || '', Validators.required],
      dni: [data?.dni || '', Validators.required],
      telefono: [data?.telefono || '', Validators.required],
      correo: [data?.correo || '', [Validators.required, Validators.email]],
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onSubmit() {
    if (this.apoderadoForm.invalid) return;

    this.loading = true;
    this.http
      .put(
        `https://proy-back-dnivel-44j5.onrender.com/api/apoderado/${this.data.id}`,
        this.apoderadoForm.value,
        {
          headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: (res) => {
          this.successMessage = 'Apoderado actualizado correctamente';
          this.loading = false;
          setTimeout(() => this.dialogRef.close(true), 1000);
        },
        error: (err) => {
          this.error = `Error al actualizar apoderado: ${err.status} - ${err.statusText}`;
          this.loading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
