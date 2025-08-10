import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-tarjeta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>credit_card</mat-icon>
        Agregar Nueva Tarjeta
      </h2>
    </div>
    
    <mat-dialog-content>
      <div *ngIf="!data.alumnos || data.alumnos.length === 0" class="no-alumnos">
        <mat-icon>info</mat-icon>
        <h3>No hay alumnos disponibles</h3>
        <p>No hay alumnos sin tarjeta asignada en este salón.</p>
      </div>
      
      <form *ngIf="data.alumnos && data.alumnos.length > 0" [formGroup]="tarjetaForm" class="tarjeta-form">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Número RFID</mat-label>
          <input 
            matInput 
            formControlName="rfid" 
            type="number" 
            placeholder="Ingrese 10 dígitos"
            maxlength="10"
            required>
          <mat-icon matPrefix>nfc</mat-icon>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('required')">
            El RFID es requerido
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('pattern')">
            El RFID debe tener exactamente 10 dígitos
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('min')">
            El RFID debe ser un número positivo
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Código de Tarjeta</mat-label>
          <input 
            matInput 
            formControlName="codigo" 
            placeholder="Código identificador"
            required>
          <mat-icon matPrefix>qr_code</mat-icon>
          <mat-error *ngIf="tarjetaForm.get('codigo')?.hasError('required')">
            El código es requerido
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('codigo')?.hasError('minlength')">
            El código debe tener al menos 2 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Seleccionar Alumno</mat-label>
          <mat-select formControlName="idAlumno" required>
            <mat-option *ngFor="let alumno of data.alumnos" [value]="alumno.id">
              <div class="alumno-option">
                <span class="alumno-nombre">{{ alumno.nombre || 'Sin nombre' }}</span>
                <span class="alumno-codigo">({{ alumno.codigo || 'Sin código' }})</span>
              </div>
            </mat-option>
          </mat-select>
          <mat-icon matPrefix>person</mat-icon>
          <mat-error *ngIf="tarjetaForm.get('idAlumno')?.hasError('required')">
            Debe seleccionar un alumno
          </mat-error>
        </mat-form-field>

        <!-- Campo informativo para mostrar el colegio -->
        <div class="info-field">
          <mat-icon>school</mat-icon>
          <span>Colegio ID: {{ data.colegioId }}</span>
          <span class="alumnos-count">| {{ data.alumnos.length }} alumnos disponibles</span>
        </div>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button 
        mat-button 
        (click)="onCancel()"
        class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button 
        *ngIf="data.alumnos && data.alumnos.length > 0" 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()" 
        [disabled]="!tarjetaForm.valid"
        class="submit-btn">
        <mat-icon>save</mat-icon>
        Guardar Tarjeta
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      padding: 20px 20px 0 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #1976d2;
      font-size: 20px;
      font-weight: 500;
      margin: 0;
    }

    .modal-header mat-icon {
      color: #42a5f5;
    }

    .tarjeta-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px 0;
    }

    .form-field {
      width: 100%;
    }

    .form-field .mat-form-field-prefix mat-icon {
      color: #666;
      margin-right: 8px;
    }

    .info-field {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #f5f5f5;
      border-radius: 4px;
      color: #666;
      font-size: 14px;
    }

    .info-field mat-icon {
      color: #1976d2;
      font-size: 20px;
    }

    .alumnos-count {
      color: #4caf50;
      font-weight: 500;
    }

    .alumno-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alumno-nombre {
      font-weight: 500;
      color: #333;
    }

    .alumno-codigo {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .no-alumnos {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      padding: 40px 20px;
      text-align: center;
      color: #666;
    }

    .no-alumnos mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9800;
    }

    .no-alumnos h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }

    .no-alumnos p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    mat-dialog-content {
      padding: 0 20px !important;
      min-height: 300px;
    }

    mat-dialog-actions {
      padding: 20px !important;
      background-color: #fafafa;
      border-top: 1px solid #e0e0e0;
      gap: 10px;
    }

    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      min-width: 150px;
    }

    .submit-btn:disabled {
      background-color: #e0e0e0 !important;
      color: #999 !important;
    }

    /* Estilos para errores */
    .mat-error {
      font-size: 12px;
      margin-top: 5px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .modal-header {
        padding: 15px;
      }

      .modal-header h2 {
        font-size: 18px;
      }

      mat-dialog-content {
        padding: 0 15px !important;
      }

      mat-dialog-actions {
        padding: 15px !important;
        flex-direction: column-reverse;
      }

      .cancel-btn,
      .submit-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AddTarjetaModalComponent {
  tarjetaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddTarjetaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      colegioId: number,
      alumnos: any[] 
    }
  ) {
    console.log('Datos recibidos en el modal:', data);
    
    this.tarjetaForm = this.fb.group({
      rfid: ['', [
        Validators.required, 
        Validators.pattern(/^\d{10}$/),
        Validators.min(1)
      ]],
      codigo: ['', [
        Validators.required, 
        Validators.minLength(2)
      ]],
      idAlumno: ['', Validators.required],
      idColegio: [this.data.colegioId, Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.tarjetaForm.valid) {
      const formData = this.tarjetaForm.value;
      
      // Convertir a números los campos que deben ser numéricos
      const tarjetaData = {
        rfid: parseInt(formData.rfid, 10),
        codigo: formData.codigo,
        idAlumno: parseInt(formData.idAlumno, 10),
        idColegio: parseInt(formData.idColegio, 10)
      };

      console.log('Datos de tarjeta a enviar:', tarjetaData);
      this.dialogRef.close(tarjetaData);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.tarjetaForm.controls).forEach(key => {
        this.tarjetaForm.get(key)?.markAsTouched();
      });
    }
  }
}