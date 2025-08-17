import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCardModule,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-apoderado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {
    // Aplicar clase CSS específica al diálogo
    this.dialogRef.addPanelClass('edit-apoderado-dialog');
    
    this.apoderadoForm = this.fb.group(
      {
        nombre: [data?.nombre || '', [Validators.required]],
        apellidos: [data?.apellidos || '', [Validators.required]],
        dni: [
          data?.dni || '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{8}$/),
            Validators.minLength(8),
            Validators.maxLength(8),
          ],
        ],
        telefono: [
          data?.telefono || '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{9}$/),
            Validators.minLength(9),
            Validators.maxLength(9),
          ],
        ],
      },
      { updateOn: 'blur' }
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onSubmit() {
    if (this.apoderadoForm.invalid) {
      this.showError('Por favor complete todos los campos correctamente');
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const payload = {
      ...this.apoderadoForm.value,
      id: this.data.id,
    };

    this.http
      .put(
        `https://proy-back-dnivel-44j5.onrender.com/api/apoderado/${this.data.id}`,
        payload,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: () => {
          this.showSuccess('Apoderado actualizado correctamente');
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err: HttpErrorResponse) => {
          this.handleError(err);
        },
      });
  }

  private showError(message: string): void {
    this.error = message;
    this.loading = false;
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
    this.loading = false;
  }

  private handleError(err: HttpErrorResponse): void {
    this.loading = false;
    console.error('Error al actualizar apoderado:', err);

    let errorMessage = 'Error al actualizar apoderado';
    if (err.status === 400) {
      errorMessage =
        'Datos inválidos: ' + (err.error?.message || 'Verifique los campos');
    } else if (err.status === 404) {
      errorMessage = 'Apoderado no encontrado';
    } else if (err.status >= 500) {
      errorMessage = 'Error del servidor. Intente nuevamente más tarde';
    }

    this.showError(errorMessage);
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}