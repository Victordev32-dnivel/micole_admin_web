import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono?: string | null;
}

interface TarjetaConAlumno {
  id: number;
  rfid: number;
  codigo: string;
  alumno?: number;
  alumnoData?: Alumno;
  alumnoNombre?: string;
  alumnoDocumento?: string;
  alumnoCodigo?: string;
}

interface DialogData {
  colegioId: number;
  tarjeta: TarjetaConAlumno;
  alumnos: Alumno[];
  jwtToken: string;
}

interface TarjetaUpdatePayload {
  Rfid: number;
  Codigo: string;
  IdAlumno: number;
  IdColegio: number;
}

@Component({
  selector: 'app-edit-tarjeta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    HttpClientModule,
  ],
  templateUrl: './edit-tarjeta-modal.component.html',
  styleUrls: ['./edit-tarjeta-modal.component.css'],
})
export class EditTarjetaModalComponent implements OnInit {
  editTarjetaForm: FormGroup;
  loading = false;
  alumnos: Alumno[] = [];
  tarjeta: TarjetaConAlumno;
  colegioId: number;
  jwtToken: string;

  private readonly baseUrl = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditTarjetaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.colegioId = data.colegioId;
    this.tarjeta = data.tarjeta;
    this.alumnos = data.alumnos || [];
    this.jwtToken = data.jwtToken;

    this.editTarjetaForm = this.fb.group({
      rfid: [
        this.tarjeta.rfid,
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^\d+$/),
        ],
      ],
      codigo: [
        this.tarjeta.codigo,
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9\-_]+$/),
        ],
      ],
      alumno: [this.tarjeta.alumno || null],
    });
  }

  ngOnInit(): void {
    console.log('🔧 Modal de edición inicializado:', {
      tarjeta: this.tarjeta,
      alumnos: this.alumnos.length,
      colegioId: this.colegioId
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Datos inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Sin permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Tarjeta no encontrada';
          break;
        case 409:
          errorMessage = 'El RFID o código ya existe';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }

    this.showSnackBar(errorMessage, 'error');
    return throwError(() => error);
  };

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: type === 'error' ? 6000 : 4000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  onCancel(): void {
    if (this.loading) {
      return;
    }
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.editTarjetaForm.valid && !this.loading) {
      this.loading = true;

      const formData = this.editTarjetaForm.value;
      
      const payload: TarjetaUpdatePayload = {
        Rfid: Number(formData.rfid),
        Codigo: formData.codigo.trim(),
        IdAlumno: formData.alumno || 0,
        IdColegio: this.colegioId,
      };

      console.log('📤 Enviando datos de actualización:', payload);

      const updateUrl = `${this.baseUrl}/tarjeta/${this.tarjeta.id}`;
      const headers = this.getHeaders();

      this.http.put(updateUrl, payload, { headers })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Tarjeta actualizada exitosamente:', response);
            this.loading = false;
            this.showSnackBar('Tarjeta actualizada exitosamente', 'success');
            
            // Cerrar modal y notificar éxito
            setTimeout(() => {
              this.dialogRef.close({ success: true, data: payload });
            }, 1000);
          },
          error: (error) => {
            console.error('❌ Error al actualizar tarjeta:', error);
            this.loading = false;
          },
        });
    } else {
      console.log('❌ Formulario inválido:', this.editTarjetaForm.errors);
      this.markFormGroupTouched();
      this.showSnackBar('Por favor, corrija los errores en el formulario', 'error');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editTarjetaForm.controls).forEach((field) => {
      const control = this.editTarjetaForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Métodos de validación mejorados
  getFieldError(fieldName: string): string {
    const field = this.editTarjetaForm.get(fieldName);
    
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors['min']) {
        return 'RFID debe ser mayor a 0';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'rfid') {
          return 'RFID debe contener solo números';
        } else {
          return 'Código solo puede contener letras, números, guiones y guiones bajos';
        }
      }
      if (field.errors['minlength']) {
        return 'Código debe tener al menos 1 carácter';
      }
      if (field.errors['maxlength']) {
        return 'Código no puede tener más de 50 caracteres';
      }
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const names: { [key: string]: string } = {
      'rfid': 'RFID',
      'codigo': 'Código',
      'alumno': 'Alumno'
    };
    return names[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.editTarjetaForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  // Método mejorado para mostrar información del alumno
  getAlumnoDisplayName(alumno: Alumno): string {
    const nombre = alumno.nombre_completo.replace(/\t/g, ' ').trim();
    return `${nombre} (${alumno.codigo})`;
  }

  // Información del alumno actual con mejor formato
  getCurrentAlumnoInfo(): string {
    if (this.tarjeta.alumnoData) {
      return `Actualmente asignada a: ${this.tarjeta.alumnoNombre} (${this.tarjeta.alumnoCodigo})`;
    }
    return 'Tarjeta disponible - Sin asignar';
  }

  // Validador personalizado para RFID duplicado
  private validateUniqueRfid(rfid: number): boolean {
    // Aquí podrías implementar validación en tiempo real
    // Por ahora, solo verificamos que no sea el mismo valor actual
    return true;
  }

  // Método para limpiar el formulario
  resetForm(): void {
    this.editTarjetaForm.patchValue({
      rfid: this.tarjeta.rfid,
      codigo: this.tarjeta.codigo,
      alumno: this.tarjeta.alumno || null,
    });
    this.editTarjetaForm.markAsUntouched();
  }

  // Verificar si hay cambios en el formulario
  hasChanges(): boolean {
    const currentValues = this.editTarjetaForm.value;
    return (
      currentValues.rfid !== this.tarjeta.rfid ||
      currentValues.codigo !== this.tarjeta.codigo ||
      currentValues.alumno !== (this.tarjeta.alumno || null)
    );
  }
}