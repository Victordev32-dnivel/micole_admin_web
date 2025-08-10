import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  MAT_DIALOG_DATA, 
  MatDialogRef, 
  MatDialogModule 
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule 
} from '@angular/forms';

export interface GuardianModalData {
  guardian?: any;
  isEditMode: boolean;
  colegioId: number;
}

export interface GuardianFormData {
  numeroDocumento: string;
  tipoUsuario: string;
  contrasena: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  genero: string;
  telefono: string;
  parentesco: string;
  idColegio: number;
}

@Component({
  selector: 'app-guardian-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        {{ data.isEditMode ? 'Modificar Apoderado' : 'Agregar Apoderado' }}
      </h2>
      <button 
        mat-icon-button 
        class="close-button" 
        (click)="closeModal()"
        type="button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modal-content">
      <form [formGroup]="guardianForm" class="guardian-form">
        <!-- Primera fila -->
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>DNI/Número de Documento</mat-label>
            <input 
              matInput 
              formControlName="numeroDocumento" 
              maxlength="8" 
              placeholder="12345678">
            <mat-error *ngIf="guardianForm.get('numeroDocumento')?.hasError('required')">
              El DNI es obligatorio
            </mat-error>
            <mat-error *ngIf="guardianForm.get('numeroDocumento')?.hasError('pattern')">
              Solo se permiten números
            </mat-error>
            <mat-error *ngIf="guardianForm.get('numeroDocumento')?.hasError('minlength') || guardianForm.get('numeroDocumento')?.hasError('maxlength')">
              El DNI debe tener exactamente 8 dígitos
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Contraseña</mat-label>
            <input 
              matInput 
              type="password" 
              formControlName="contrasena"
              placeholder="Mínimo 6 caracteres">
            <mat-error *ngIf="guardianForm.get('contrasena')?.hasError('required')">
              La contraseña es obligatoria
            </mat-error>
            <mat-error *ngIf="guardianForm.get('contrasena')?.hasError('minlength')">
              La contraseña debe tener al menos 6 caracteres
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Segunda fila -->
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Nombres</mat-label>
            <input 
              matInput 
              formControlName="nombres"
              placeholder="Nombres del apoderado">
            <mat-error *ngIf="guardianForm.get('nombres')?.hasError('required')">
              Los nombres son obligatorios
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Apellido Paterno</mat-label>
            <input 
              matInput 
              formControlName="apellidoPaterno"
              placeholder="Apellido paterno">
            <mat-error *ngIf="guardianForm.get('apellidoPaterno')?.hasError('required')">
              El apellido paterno es obligatorio
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Tercera fila -->
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Apellido Materno</mat-label>
            <input 
              matInput 
              formControlName="apellidoMaterno"
              placeholder="Apellido materno (opcional)">
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Género</mat-label>
            <mat-select formControlName="genero">
              <mat-option value="">Seleccionar género</mat-option>
              <mat-option value="Masculino">Masculino</mat-option>
              <mat-option value="Femenino">Femenino</mat-option>
            </mat-select>
            <mat-error *ngIf="guardianForm.get('genero')?.hasError('required')">
              El género es obligatorio
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Cuarta fila -->
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Teléfono</mat-label>
            <input 
              matInput 
              formControlName="telefono" 
              maxlength="9"
              placeholder="987654321">
            <mat-error *ngIf="guardianForm.get('telefono')?.hasError('required')">
              El teléfono es obligatorio
            </mat-error>
            <mat-error *ngIf="guardianForm.get('telefono')?.hasError('pattern')">
              Solo se permiten números
            </mat-error>
            <mat-error *ngIf="guardianForm.get('telefono')?.hasError('minlength')">
              El teléfono debe tener al menos 7 dígitos
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Parentesco</mat-label>
            <mat-select formControlName="parentesco">
              <mat-option value="">Seleccionar parentesco</mat-option>
              <mat-option value="Padre">Padre</mat-option>
              <mat-option value="Madre">Madre</mat-option>
              <mat-option value="Abuelo">Abuelo</mat-option>
              <mat-option value="Abuela">Abuela</mat-option>
              <mat-option value="Tío">Tío</mat-option>
              <mat-option value="Tía">Tía</mat-option>
              <mat-option value="Hermano">Hermano</mat-option>
              <mat-option value="Hermana">Hermana</mat-option>
              <mat-option value="Tutor">Tutor</mat-option>
              <mat-option value="Otro">Otro</mat-option>
            </mat-select>
            <mat-error *ngIf="guardianForm.get('parentesco')?.hasError('required')">
              El parentesco es obligatorio
            </mat-error>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="modal-actions">
      <button 
        mat-button 
        type="button"
        (click)="closeModal()"
        class="cancel-button">
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary"
        type="button"
        [disabled]="guardianForm.invalid || isLoading"
        (click)="saveGuardian()"
        class="save-button">
        <mat-icon *ngIf="isLoading">hourglass_empty</mat-icon>
        {{ data.isEditMode ? 'Actualizar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }

    .close-button {
      color: #666;
      width: 40px;
      height: 40px;
    }

    .close-button:hover {
      background-color: #f5f5f5;
      color: #333;
    }

    .modal-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .guardian-form {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
    }

    .form-field {
      flex: 1;
      min-width: 0;
    }

    .modal-actions {
      padding: 20px 24px 24px 24px;
      gap: 12px;
      justify-content: flex-end;
    }

    .cancel-button {
      color: #666;
      border: 1px solid #ddd;
    }

    .cancel-button:hover {
      background-color: #f8f9fa;
    }

    .save-button {
      background-color: #007bff;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .save-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .save-button:disabled {
      background-color: #ccc;
      color: #666;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 12px;
      }
      
      .modal-actions {
        flex-direction: column;
        gap: 10px;
      }
      
      .modal-actions button {
        width: 100%;
        order: 1;
      }
      
      .cancel-button {
        order: 2;
      }
    }

    @media (max-width: 480px) {
      .modal-header {
        padding: 16px 16px 0 16px;
      }
      
      .modal-content {
        padding: 0 16px;
      }
      
      .modal-actions {
        padding: 20px 16px 16px 16px;
      }
      
      .modal-header h2 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class GuardianModalComponent implements OnInit {
  guardianForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GuardianModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuardianModalData
  ) {
    // Inicializar formulario
    this.guardianForm = this.fb.group({
      numeroDocumento: ['', [
        Validators.required, 
        Validators.pattern(/^[0-9]{8}$/),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      nombres: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: [''],
      genero: ['', Validators.required],
      telefono: ['', [
        Validators.required, 
        Validators.pattern(/^[0-9]{7,9}$/),
        Validators.minLength(7)
      ]],
      parentesco: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Si es modo edición, llenar el formulario
    if (this.data.isEditMode && this.data.guardian) {
      this.guardianForm.patchValue({
        numeroDocumento: this.data.guardian.numeroDocumento || '',
        nombres: this.data.guardian.nombres || '',
        apellidoPaterno: this.data.guardian.apellidoPaterno || '',
        apellidoMaterno: this.data.guardian.apellidoMaterno || '',
        genero: this.data.guardian.genero || '',
        telefono: this.data.guardian.telefono || '',
        parentesco: this.data.guardian.parentesco || '',
        contrasena: '' // No mostrar contraseña actual
      });
    }
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  saveGuardian(): void {
    if (this.guardianForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formData = this.guardianForm.value;
    
    const guardianData: GuardianFormData = {
      numeroDocumento: formData.numeroDocumento,
      tipoUsuario: 'apoderado',
      contrasena: formData.contrasena,
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno || '',
      genero: formData.genero,
      telefono: formData.telefono,
      parentesco: formData.parentesco,
      idColegio: this.data.colegioId
    };

    // Enviar datos de vuelta al componente padre
    this.dialogRef.close({
      action: 'save',
      data: guardianData,
      isEditMode: this.data.isEditMode,
      guardianId: this.data.guardian?.id
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.guardianForm.controls).forEach(key => {
      const control = this.guardianForm.get(key);
      control?.markAsTouched();
    });
  }
}