import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

interface ApoderadoCompleto {
  id: number;
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
  // Campos adicionales que pueden venir
  nombre?: string;
  apellidos?: string;
  dni?: string;
  email?: string;
}

interface DialogData {
  id: number;
  apoderados: any[];
}

@Component({
  selector: 'app-edit-apoderados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSelectModule,
  ],
  template: `
    <div class="edit-apoderado-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Editar Apoderado
        </h2>
        <button
          mat-icon-button
          class="close-button"
          (click)="onCancel()"
          [disabled]="loading || updating"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading inicial -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando datos del apoderado...</p>
      </div>

      <!-- Error al cargar -->
      <div *ngIf="loadError && !loading" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <p>{{ loadError }}</p>
        <button mat-raised-button color="primary" (click)="loadApoderadoData()">
          Reintentar
        </button>
      </div>

      <!-- Formulario -->
      <form
        *ngIf="!loading && !loadError && apoderadoForm"
        [formGroup]="apoderadoForm"
        (ngSubmit)="onSubmit()"
        class="edit-form"
      >
        <mat-dialog-content class="dialog-content">
          <!-- Campo Nombres -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombres</mat-label>
            <input
              matInput
              formControlName="nombres"
              placeholder="Ingrese los nombres"
              [disabled]="updating"
            />
            <mat-icon matSuffix>person</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('nombres')?.hasError('required')"
            >
              Los nombres son obligatorios
            </mat-error>
            <mat-error
              *ngIf="apoderadoForm.get('nombres')?.hasError('minlength')"
            >
              Los nombres deben tener al menos 2 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Campo Apellido Paterno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Paterno</mat-label>
            <input
              matInput
              formControlName="apellidoPaterno"
              placeholder="Ingrese el apellido paterno"
              [disabled]="updating"
            />
            <mat-icon matSuffix>person_outline</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('apellidoPaterno')?.hasError('required')"
            >
              El apellido paterno es obligatorio
            </mat-error>
          </mat-form-field>

          <!-- Campo Apellido Materno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Materno</mat-label>
            <input
              matInput
              formControlName="apellidoMaterno"
              placeholder="Ingrese el apellido materno"
              [disabled]="updating"
            />
            <mat-icon matSuffix>person_outline</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('apellidoMaterno')?.hasError('required')"
            >
              El apellido materno es obligatorio
            </mat-error>
          </mat-form-field>

          <!-- Campo DNI -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>DNI</mat-label>
            <input
              matInput
              formControlName="numeroDocumento"
              placeholder="Ingrese el DNI"
              maxlength="8"
              [disabled]="updating"
            />
            <mat-icon matSuffix>badge</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('numeroDocumento')?.hasError('required')"
            >
              El DNI es obligatorio
            </mat-error>
            <mat-error
              *ngIf="apoderadoForm.get('numeroDocumento')?.hasError('pattern')"
            >
              El DNI debe tener 8 dígitos
            </mat-error>
          </mat-form-field>

          <!-- Campo Contraseña -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              formControlName="contrasena"
              placeholder="Ingrese la nueva contraseña"
              [disabled]="updating"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword = !hidePassword"
              [attr.aria-label]="'Ocultar contraseña'"
              [attr.aria-pressed]="hidePassword"
            >
              <mat-icon>{{
                hidePassword ? 'visibility_off' : 'visibility'
              }}</mat-icon>
            </button>
            <mat-error
              *ngIf="apoderadoForm.get('contrasena')?.hasError('required')"
            >
              La contraseña es obligatoria
            </mat-error>
            <mat-error
              *ngIf="apoderadoForm.get('contrasena')?.hasError('minlength')"
            >
              La contraseña debe tener al menos 6 caracteres
            </mat-error>
            <mat-error
              *ngIf="apoderadoForm.get('contrasena')?.hasError('pattern')"
            >
              La contraseña debe contener al menos una letra y un número
            </mat-error>
          </mat-form-field>

          <!-- Campo Teléfono -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              formControlName="telefono"
              placeholder="Ingrese el teléfono"
              maxlength="9"
              [disabled]="updating"
            />
            <mat-icon matSuffix>phone</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('telefono')?.hasError('required')"
            >
              El teléfono es obligatorio
            </mat-error>
            <mat-error
              *ngIf="apoderadoForm.get('telefono')?.hasError('pattern')"
            >
              El teléfono debe tener 9 dígitos
            </mat-error>
          </mat-form-field>

          <!-- Campo Género -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Género</mat-label>
            <mat-select formControlName="genero" [disabled]="updating">
              <mat-option value="M">Masculino</mat-option>
              <mat-option value="F">Femenino</mat-option>
            </mat-select>
            <mat-icon matSuffix>person</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('genero')?.hasError('required')"
            >
              El género es obligatorio
            </mat-error>
          </mat-form-field>

          <!-- Campo Parentesco -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Parentesco</mat-label>
            <mat-select formControlName="parentesco" [disabled]="updating">
              <mat-option value="PADRE">Padre</mat-option>
              <mat-option value="MADRE">Madre</mat-option>
              <mat-option value="ABUELO">Abuelo</mat-option>
              <mat-option value="ABUELA">Abuela</mat-option>
              <mat-option value="TIO">Tío</mat-option>
              <mat-option value="TIA">Tía</mat-option>
              <mat-option value="HERMANO">Hermano</mat-option>
              <mat-option value="HERMANA">Hermana</mat-option>
              <mat-option value="TUTOR">Tutor Legal</mat-option>
              <mat-option value="OTRO">Otro</mat-option>
            </mat-select>
            <mat-icon matSuffix>family_restroom</mat-icon>
            <mat-error
              *ngIf="apoderadoForm.get('parentesco')?.hasError('required')"
            >
              El parentesco es obligatorio
            </mat-error>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions class="dialog-actions">
          <button
            mat-button
            type="button"
            (click)="onCancel()"
            [disabled]="updating"
            class="cancel-button"
          >
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="apoderadoForm.invalid || updating"
            class="save-button"
          >
            <mat-spinner
              *ngIf="updating"
              diameter="20"
              class="button-spinner"
            ></mat-spinner>
            <mat-icon *ngIf="!updating">save</mat-icon>
            {{ updating ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .edit-apoderado-dialog {
        width: 100%;
        max-width: 600px;
        padding: 0;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 0;
      }

      .dialog-header h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
        color: #333;
      }

      .close-button {
        color: #666;
      }

      .close-button:hover {
        background-color: #f5f5f5;
        color: #333;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
        text-align: center;
      }

      .loading-container p {
        margin-top: 16px;
        color: #666;
        font-size: 1rem;
      }

      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 24px;
        text-align: center;
      }

      .error-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #f44336;
        margin-bottom: 16px;
      }

      .error-container p {
        margin-bottom: 20px;
        color: #666;
        font-size: 1rem;
      }

      .dialog-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .edit-form {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .dialog-actions {
        padding: 16px 24px 24px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: auto;
      }

      .cancel-button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .save-button {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 140px;
        justify-content: center;
      }

      .button-spinner {
        margin-right: 8px;
      }

      /* Estilo especial para el campo de contraseña */
      .mat-form-field:has(input[formControlName='contrasena']) {
        background-color: #fff9e6;
        border-radius: 4px;
      }

      .mat-form-field:has(input[formControlName='contrasena'])
        .mat-form-field-outline {
        border: 2px solid #ffc107;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .edit-apoderado-dialog {
          max-width: 100vw;
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
        }

        .dialog-header {
          padding: 16px;
        }

        .dialog-header h2 {
          font-size: 1.3rem;
        }

        .dialog-content {
          padding: 16px;
        }

        .dialog-actions {
          padding: 16px;
          flex-direction: column-reverse;
        }

        .cancel-button,
        .save-button {
          width: 100%;
          justify-content: center;
        }
      }

      /* Estilos para campos con error */
      .mat-mdc-form-field.mat-form-field-invalid .mat-mdc-text-field-wrapper {
        background-color: #fef7f7;
      }

      .mat-mdc-form-field.mat-form-field-invalid .mat-mdc-floating-label {
        color: #f44336;
      }
    `,
  ],
})
export class EditApoderadosComponent implements OnInit {
  apoderadoForm!: FormGroup;
  loading: boolean = true;
  updating: boolean = false;
  loadError: string | null = null;
  apoderadoId: number;
  apoderadoCompleto: ApoderadoCompleto | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditApoderadosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.apoderadoId = data.id;
  }

  ngOnInit() {
    this.initializeForm();
    this.loadApoderadoData();
  }

  private initializeForm() {
    this.apoderadoForm = this.fb.group({
      numeroDocumento: [
        '',
        [Validators.required, Validators.pattern(/^\d{8}$/)],
      ],
      tipoUsuario: ['apoderado'], // Valor fijo
      contrasena: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/), // Al menos una letra y un número
        ],
      ],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      genero: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      parentesco: ['', [Validators.required]],
      idColegio: [1], // Valor fijo según tu API
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadApoderadoData() {
    this.loading = true;
    this.loadError = null;

    // Buscar el apoderado en la lista que se pasó desde el componente padre
    const apoderado = this.data.apoderados.find(
      (a) => a.id === this.apoderadoId
    );

    if (apoderado) {
      // Mapear los datos del listado al formulario de edición
      this.apoderadoForm.patchValue({
        numeroDocumento: apoderado.dni || apoderado.numeroDocumento || '',
        tipoUsuario: apoderado.tipoUsuario || 'APODERADO',
        contrasena: apoderado.contrasena || '', // Incluir la contraseña actual
        nombres: apoderado.nombre || apoderado.nombres || '',
        apellidoPaterno:
          this.extractFirstLastName(apoderado.apellidos) ||
          apoderado.apellidoPaterno ||
          '',
        apellidoMaterno:
          this.extractSecondLastName(apoderado.apellidos) ||
          apoderado.apellidoMaterno ||
          '',
        genero: apoderado.genero || 'M', // Valor por defecto
        telefono: apoderado.telefono || '',
        parentesco: apoderado.parentesco || 'PADRE', // Valor por defecto
        idColegio: apoderado.idColegio || 1,
      });

      // Forzar actualización del formulario
      this.apoderadoForm.updateValueAndValidity();

      this.loading = false;
    } else {
      console.error('❌ Apoderado no encontrado en la lista');
      this.handleLoadError('No se encontró el apoderado seleccionado');
    }
  }

  private extractFirstLastName(apellidos: string): string {
    if (!apellidos) return '';
    const parts = apellidos.trim().split(' ');
    return parts[0] || '';
  }

  private extractSecondLastName(apellidos: string): string {
    if (!apellidos) return '';
    const parts = apellidos.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  }

  private handleLoadError(message: string) {
    this.loadError = message;
    this.loading = false;
    this.snackBar.open(`❌ ${message}`, 'Cerrar', {
      duration: 4000,
      panelClass: ['error-snackbar'],
    });
  }

  onSubmit() {
    if (this.apoderadoForm.valid && !this.updating) {
      this.updateApoderado();
    }
  }

  private updateApoderado() {
    this.updating = true;

    const formData = this.apoderadoForm.value;
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/apoderado/${this.apoderadoId}`;

    // Preparar datos para actualización (INCLUYENDO contraseña)
    const updateData: any = {
      numeroDocumento: formData.numeroDocumento,
      tipoUsuario: 'apoderado',
      contrasena: formData.contrasena, // Incluir la nueva contraseña
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      genero: formData.genero,
      telefono: formData.telefono,
      parentesco: formData.parentesco,
      idColegio: formData.idColegio || 1,
    };

    this.http.put(url, updateData, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.snackBar.open('✅ Apoderado actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });

        this.updating = false;
        this.dialogRef.close(true); // Cerrar con éxito
      },
      error: (error) => {
        console.error('❌ Error al actualizar apoderado:', error);
        this.updating = false;

        let errorMessage = 'Error al actualizar el apoderado';

        if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifique la información';
        } else if (error.status === 404) {
          errorMessage = 'Apoderado no encontrado';
        } else if (error.status === 405) {
          errorMessage = 'Método no permitido. Contacte al administrador';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado para editar este apoderado';
        } else if (error.status === 409) {
          errorMessage = 'El DNI ya está registrado por otro apoderado';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });
      },
    });
  }

  onCancel() {
    if (this.updating) {
      return; // No permitir cancelar si está actualizando
    }
    this.dialogRef.close(false);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.apoderadoForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${fieldName} es obligatorio`;
    }

    if (field?.hasError('minlength')) {
      return `${fieldName} debe tener al menos ${field.errors?.['minlength']?.requiredLength} caracteres`;
    }

    if (field?.hasError('pattern')) {
      if (fieldName === 'numeroDocumento') return 'El DNI debe tener 8 dígitos';
      if (fieldName === 'telefono') return 'El teléfono debe tener 9 dígitos';
      if (fieldName === 'contrasena')
        return 'La contraseña debe contener al menos una letra y un número';
    }

    return '';
  }
}
