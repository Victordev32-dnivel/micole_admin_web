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

// Interfaz actualizada para la tarjeta (compatible con la nueva estructura)
interface TarjetaConAlumno {
  id: number;
  rfid: number;
  codigo: string; // Mapeo interno
  horario?: string; // Campo de la API
  alumno?: number | string; // Puede ser ID o nombre
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
  alumnoActualId: number | null = null;

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

    // Determinar el ID del alumno actual
    this.alumnoActualId = this.determinarAlumnoActualId();

    console.log('🔧 Modal de edición inicializado:', {
      tarjeta: this.tarjeta,
      alumnoActualId: this.alumnoActualId,
      alumnos: this.alumnos.length,
      colegioId: this.colegioId
    });

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
        this.tarjeta.codigo || this.tarjeta.horario || '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(50),
          // Relajar la validación del patrón para permitir más caracteres
          Validators.pattern(/^[a-zA-Z0-9\-_\s]+$/),
        ],
      ],
      alumno: [this.alumnoActualId],
    });
  }

  ngOnInit(): void {
    console.log('🔧 Formulario inicializado con valores:', this.editTarjetaForm.value);
  }

  // Método para determinar el ID del alumno actual
  private determinarAlumnoActualId(): number | null {
    // Si ya tiene alumnoData, usar ese ID
    if (this.tarjeta.alumnoData) {
      return this.tarjeta.alumnoData.id;
    }

    // Si el campo alumno es un número (ID), usarlo
    if (typeof this.tarjeta.alumno === 'number') {
      return this.tarjeta.alumno;
    }

    // Si el campo alumno es un string (nombre), buscar por nombre
    if (typeof this.tarjeta.alumno === 'string' && this.tarjeta.alumno.trim()) {
      const nombreLimpio = this.tarjeta.alumno.replace(/\t/g, ' ').trim();
      const alumnoEncontrado = this.alumnos.find(
        (a) => a.nombre_completo.replace(/\t/g, ' ').trim() === nombreLimpio
      );
      
      if (alumnoEncontrado) {
        return alumnoEncontrado.id;
      }
    }

    // Si hay alumnoNombre, buscar por ese nombre
    if (this.tarjeta.alumnoNombre) {
      const nombreLimpio = this.tarjeta.alumnoNombre.replace(/\t/g, ' ').trim();
      const alumnoEncontrado = this.alumnos.find(
        (a) => a.nombre_completo.replace(/\t/g, ' ').trim() === nombreLimpio
      );
      
      if (alumnoEncontrado) {
        return alumnoEncontrado.id;
      }
    }

    return null;
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
      console.log('🔗 URL de actualización:', `${this.baseUrl}/tarjeta/${this.tarjeta.id}`);

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
              this.dialogRef.close({ 
                success: true, 
                action: 'update',
                data: payload 
              });
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

  // Método para eliminar la tarjeta desde el modal
  onDelete(): void {
    if (this.loading) {
      return;
    }

    const confirmDelete = confirm(
      `¿Está seguro que desea eliminar la tarjeta ${this.tarjeta.codigo}?`
    );

    if (!confirmDelete) {
      return;
    }

    this.loading = true;
    const deleteUrl = `${this.baseUrl}/tarjeta/${this.tarjeta.id}`;
    const headers = this.getHeaders();

    console.log('🗑️ Eliminando tarjeta:', deleteUrl);

    this.http.delete(deleteUrl, { headers })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Tarjeta eliminada exitosamente:', response);
          this.loading = false;
          this.showSnackBar('Tarjeta eliminada exitosamente', 'success');
          
          // Cerrar modal y notificar eliminación
          setTimeout(() => {
            this.dialogRef.close({ 
              success: true, 
              action: 'delete',
              data: this.tarjeta 
            });
          }, 1000);
        },
        error: (error) => {
          console.error('❌ Error al eliminar tarjeta:', error);
          this.loading = false;
        },
      });
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
          return 'Código solo puede contener letras, números, espacios, guiones y guiones bajos';
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
    if (this.tarjeta.alumnoData || this.tarjeta.alumnoNombre) {
      const nombre = this.tarjeta.alumnoNombre || this.tarjeta.alumnoData?.nombre_completo;
      const codigo = this.tarjeta.alumnoCodigo || this.tarjeta.alumnoData?.codigo;
      return `Actualmente asignada a: ${nombre} (${codigo})`;
    }
    
    // Si el campo alumno es un string y no está vacío
    if (typeof this.tarjeta.alumno === 'string' && this.tarjeta.alumno.trim()) {
      return `Actualmente asignada a: ${this.tarjeta.alumno.replace(/\t/g, ' ').trim()}`;
    }
    
    return 'Tarjeta disponible - Sin asignar';
  }

  // Información de la tarjeta actual
  getCurrentTarjetaInfo(): string {
    return `ID: ${this.tarjeta.id} | RFID: ${this.tarjeta.rfid} | Código: ${this.tarjeta.codigo || this.tarjeta.horario || 'N/A'}`;
  }

  // Validador personalizado para RFID duplicado
  private validateUniqueRfid(rfid: number): boolean {
    // Aquí podrías implementar validación en tiempo real
    return true;
  }

  // Método para limpiar el formulario
  resetForm(): void {
    this.editTarjetaForm.patchValue({
      rfid: this.tarjeta.rfid,
      codigo: this.tarjeta.codigo || this.tarjeta.horario || '',
      alumno: this.alumnoActualId,
    });
    this.editTarjetaForm.markAsUntouched();
  }

  // Verificar si hay cambios en el formulario
  hasChanges(): boolean {
    const currentValues = this.editTarjetaForm.value;
    const originalCodigo = this.tarjeta.codigo || this.tarjeta.horario || '';
    
    return (
      currentValues.rfid !== this.tarjeta.rfid ||
      currentValues.codigo !== originalCodigo ||
      currentValues.alumno !== this.alumnoActualId
    );
  }
}