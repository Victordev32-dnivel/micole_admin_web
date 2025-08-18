import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

interface DialogData {
  comunicado: {
    id: number;
    nombre: string;
    horario: string;
    tipo: 'general' | 'salon';
    imagen?: string;
    url?: string;
    pdf?: string;
    salon?: {
      id: number;
      nombre: string;
    };
  };
  colegioId: number;
  salones?: Array<{ id: number; nombre: string }>;
}

interface UpdatePayload {
  nombre: string;
  horario: string;
  imagen?: string;
  idColegio: number;
  idUsuario: number;
  idSalon?: number;
  url?: string;
  pdf?: string;
}

@Component({
  selector: 'app-editar-comunicado',
  template: `
    <div class="editar-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="edit-icon">edit</mat-icon>
        Editar
        {{
          data.comunicado.tipo === 'general'
            ? 'Anuncio General'
            : 'Anuncio por Salón'
        }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <div *ngIf="!guardando && !error" class="form-container">
          <form [formGroup]="editForm" class="edit-form">
            <!-- Información del comunicado -->
            <div class="info-header">
              <div class="info-item">
                <mat-icon>{{
                  data.comunicado.tipo === 'general' ? 'public' : 'meeting_room'
                }}</mat-icon>
                <span
                  ><strong>Tipo:</strong>
                  {{
                    data.comunicado.tipo === 'general'
                      ? 'Anuncio General'
                      : 'Anuncio por Salón'
                  }}</span
                >
              </div>
              <div class="info-item">
                <mat-icon>numbers</mat-icon>
                <span><strong>ID:</strong> {{ data.comunicado.id }}</span>
              </div>
            </div>

            <!-- Campo Nombre -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>
                <mat-icon matPrefix>title</mat-icon>
                Nombre del Comunicado
              </mat-label>
              <input
                matInput
                formControlName="nombre"
                placeholder="Ingrese el nombre del comunicado"
                maxlength="255"
              />
              <mat-hint align="end"
                >{{ editForm.get('nombre')?.value?.length || 0 }}/255</mat-hint
              >
              <mat-error *ngIf="editForm.get('nombre')?.hasError('required')">
                El nombre es obligatorio
              </mat-error>
              <mat-error *ngIf="editForm.get('nombre')?.hasError('minlength')">
                El nombre debe tener al menos 3 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Campo Horario -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>
                <mat-icon matPrefix>schedule</mat-icon>
                Horario
              </mat-label>
              <input
                matInput
                formControlName="horario"
                placeholder="Ej: 08:00 - 17:00, 2025-01-15, etc."
                maxlength="100"
              />
              <mat-hint>Puede ser una fecha, hora o rango de tiempo</mat-hint>
              <mat-error *ngIf="editForm.get('horario')?.hasError('required')">
                El horario es obligatorio
              </mat-error>
            </mat-form-field>

            <!-- Campos específicos para Anuncios Generales -->
            <div
              *ngIf="data.comunicado.tipo === 'general'"
              class="general-fields"
            >
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>
                  <mat-icon matPrefix>image</mat-icon>
                  URL de la Imagen
                </mat-label>
                <input
                  matInput
                  formControlName="imagen"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  type="url"
                />
                <mat-hint>URL completa de la imagen (opcional)</mat-hint>
                <mat-error *ngIf="editForm.get('imagen')?.hasError('pattern')">
                  Ingrese una URL válida
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>
                  <mat-icon matPrefix>link</mat-icon>
                  URL del Enlace
                </mat-label>
                <input
                  matInput
                  formControlName="url"
                  placeholder="https://ejemplo.com"
                  type="url"
                />
                <mat-hint>Enlace externo (opcional)</mat-hint>
                <mat-error *ngIf="editForm.get('url')?.hasError('pattern')">
                  Ingrese una URL válida
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Campos específicos para Anuncios por Salón -->
            <div *ngIf="data.comunicado.tipo === 'salon'" class="salon-fields">
              <mat-form-field
                appearance="outline"
                class="full-width"
                *ngIf="data.salones && data.salones.length > 0"
              >
                <mat-label>
                  <mat-icon matPrefix>meeting_room</mat-icon>
                  Salón
                </mat-label>
                <mat-select formControlName="idSalon">
                  <mat-option
                    *ngFor="let salon of data.salones"
                    [value]="salon.id"
                  >
                    {{ salon.nombre }}
                  </mat-option>
                </mat-select>
                <mat-hint>Selecciona el salón para este anuncio</mat-hint>
                <mat-error
                  *ngIf="editForm.get('idSalon')?.hasError('required')"
                >
                  Debe seleccionar un salón
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>
                  <mat-icon matPrefix>picture_as_pdf</mat-icon>
                  URL del PDF
                </mat-label>
                <input
                  matInput
                  formControlName="pdf"
                  placeholder="https://ejemplo.com/documento.pdf"
                  type="url"
                />
                <mat-hint>URL del documento PDF (opcional)</mat-hint>
                <mat-error *ngIf="editForm.get('pdf')?.hasError('pattern')">
                  Ingrese una URL válida
                </mat-error>
              </mat-form-field>
            </div>
          </form>
        </div>

        <div *ngIf="guardando" class="loading-message">
          <mat-progress-spinner mode="indeterminate" diameter="40">
          </mat-progress-spinner>
          <p>Guardando cambios...</p>
        </div>

        <div *ngIf="error" class="error-message">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{ error }}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" [disabled]="guardando">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="guardando || editForm.invalid"
        >
          <mat-icon>save</mat-icon>
          {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .editar-dialog {
        min-width: 500px;
        max-width: 700px;
      }

      .dialog-content {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .edit-icon {
        color: #2196f3;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .info-header {
        background-color: #f5f5f5;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        border-left: 4px solid #2196f3;
      }

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .info-item:last-child {
        margin-bottom: 0;
      }

      .info-item mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #666;
      }

      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .general-fields,
      .salon-fields {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        background-color: #fafafa;
      }

      .general-fields {
        border-left: 4px solid #4caf50;
      }

      .salon-fields {
        border-left: 4px solid #ff9800;
      }

      .loading-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 40px;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f44336;
        background-color: #ffebee;
        padding: 12px;
        border-radius: 4px;
        margin: 16px 0;
      }

      .error-icon {
        color: #f44336;
      }

      .dialog-actions {
        padding: 16px 24px;
        gap: 12px;
      }

      .dialog-actions button {
        min-width: 120px;
      }

      .mat-mdc-form-field-prefix mat-icon {
        margin-right: 8px;
        color: #666;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class EditarComunicadoComponent implements OnInit {
  editForm: FormGroup;
  guardando = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditarComunicadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('Datos recibidos para editar:', this.data);
    this.populateForm();
  }

  private createForm(): FormGroup {
    const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

    return this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      horario: ['', Validators.required],
      imagen: ['', [Validators.pattern(urlPattern)]], // Solo para generales
      url: ['', [Validators.pattern(urlPattern)]], // Solo para generales
      pdf: ['', [Validators.pattern(urlPattern)]], // Solo para salón
      idSalon: [''], // Solo para salón
    });
  }

  private populateForm(): void {
    this.editForm.patchValue({
      nombre: this.data.comunicado.nombre || '',
      horario: this.data.comunicado.horario || '',
      imagen: this.data.comunicado.imagen || '',
      url: this.data.comunicado.url || '',
      pdf: this.data.comunicado.pdf || '',
      idSalon: this.data.comunicado.salon?.id || '',
    });

    // Para anuncios por salón, hacer idSalon requerido si hay salones disponibles
    if (
      this.data.comunicado.tipo === 'salon' &&
      this.data.salones &&
      this.data.salones.length > 0
    ) {
      this.editForm.get('idSalon')?.setValidators(Validators.required);
      this.editForm.get('idSalon')?.updateValueAndValidity();
    }
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.guardando = true;
    this.error = null;

    const formValues = this.editForm.value;

    // ✅ DEBUGGING: Verificar datos antes de construir payload
    console.log('🔍 Form Values:', formValues);
    console.log('🔍 Comunicado Original:', this.data.comunicado);
    console.log('🔍 Colegio ID:', this.data.colegioId);

    // ✅ CORREGIR: Obtener userId de manera más robusta
    const userId = this.getUserId();
    console.log('🔍 User ID obtenido:', userId);

    // Construir payload según la API
    const updatePayload: any = {
      nombre: formValues.nombre?.trim(),
      horario: formValues.horario?.trim(),
      idColegio: Number(this.data.colegioId) || 1,
      idUsuario: Number(userId) || 2, // Valor por defecto si falla
    };

    // ✅ CORREGIR: Agregar campos específicos según el tipo
    if (this.data.comunicado.tipo === 'general') {
      // Para anuncios generales
      if (formValues.imagen && formValues.imagen.trim()) {
        updatePayload.imagen = formValues.imagen.trim();
      }
      if (formValues.url && formValues.url.trim()) {
        updatePayload.url = formValues.url.trim();
      }
      // ✅ IMPORTANTE: Agregar tipo si es requerido por la API
      updatePayload.tipo = 'general';
    } else {
      // Para anuncios por salón
      if (formValues.pdf && formValues.pdf.trim()) {
        updatePayload.pdf = formValues.pdf.trim();
      }
      if (formValues.idSalon) {
        updatePayload.idSalon = Number(formValues.idSalon);
      }
      // ✅ IMPORTANTE: Agregar tipo si es requerido por la API
      updatePayload.tipo = 'salon';
    }

    // ✅ DEBUGGING: Limpiar campos vacíos
    Object.keys(updatePayload).forEach((key) => {
      if (
        updatePayload[key] === null ||
        updatePayload[key] === undefined ||
        updatePayload[key] === ''
      ) {
        delete updatePayload[key];
      }
    });

    console.log('🔄 PAYLOAD FINAL LIMPIO:', updatePayload);
    console.log(
      '🔄 PAYLOAD SIZE:',
      JSON.stringify(updatePayload).length,
      'bytes'
    );

    const endpoint = `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/${this.data.comunicado.id}`;
    console.log('🔄 ENDPOINT:', endpoint);

    this.http
      .put(endpoint, updatePayload, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Comunicado editado exitosamente:', response);
          this.guardando = false;

          this.snackBar.open(
            '✅ Comunicado actualizado exitosamente',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );

          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          console.error('❌ Error al editar comunicado:', error);
          console.error('❌ Error Status:', error.status);
          console.error('❌ Error Body:', error.error);
          console.error('❌ Payload enviado:', updatePayload);

          this.guardando = false;

          let errorMessage = 'Error al actualizar el comunicado';

          if (error.status === 400) {
            console.error('❌ BAD REQUEST - Detalles:', {
              error: error.error,
              message: error.error?.message,
              errors: error.error?.errors,
              payload: updatePayload,
            });

            if (error.error?.message) {
              errorMessage = `Datos inválidos: ${error.error.message}`;
            } else if (error.error?.errors) {
              errorMessage =
                'Errores de validación: ' + JSON.stringify(error.error.errors);
            } else {
              errorMessage =
                'Datos inválidos. Verifique que todos los campos requeridos estén completos';
            }
          } else if (error.status === 404) {
            errorMessage = 'El comunicado no fue encontrado';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para editar este comunicado';
          } else if (error.status === 0) {
            errorMessage =
              'Error de conexión. Verifique su conexión a internet';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.error = errorMessage;

          this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
            duration: 7000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editForm.controls).forEach((key) => {
      this.editForm.get(key)?.markAsTouched();
    });
  }

 private getUserId(): number {
    try {
      // ✅ CORREGIR: Usar solo propiedades que existen en UserData
      const userData = this.userService.getUserData();
      console.log('🔍 UserData completo:', userData);
      
      // Usar solo la propiedad 'id' que existe en tu interfaz
      if (userData?.id) {
        console.log('✅ ID encontrado en userData:', userData.id);
        return Number(userData.id);
      }
      
      // Si no funciona, intentar desde localStorage directamente
      const userFromStorage = localStorage.getItem('userData') || localStorage.getItem('user');
      if (userFromStorage) {
        try {
          const parsedUser = JSON.parse(userFromStorage);
          console.log('🔍 User from localStorage:', parsedUser);
          
          if (parsedUser?.id) {
            console.log('✅ ID encontrado en localStorage:', parsedUser.id);
            return Number(parsedUser.id);
          }
        } catch (parseError) {
          console.error('❌ Error parsing localStorage:', parseError);
        }
      }
      
      console.warn('⚠️ No se pudo obtener userId, usando valor por defecto 2');
      return 2; // Valor por defecto
      
    } catch (error) {
      console.error('❌ Error al obtener userId:', error);
      return 2; // Valor por defecto
    }
  }
}
