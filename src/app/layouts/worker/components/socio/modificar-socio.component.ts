// CREA ESTE ARCHIVO: modificar-socio.component.ts
// En la misma carpeta donde tienes socio.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../services/UserData';

interface SocioData {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  contrasena?: string;
  idColegios?: number[];
}

@Component({
  selector: 'app-modificar-socio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Modificar Socio
        </h2>
        <button
          mat-icon-button
          (click)="onCancel()"
          class="close-button"
          type="button"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="socioForm" class="socio-form">
          <!-- Nombre -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre *</mat-label>
            <input
              matInput
              formControlName="nombre"
              placeholder="Ingrese el nombre"
              maxlength="50"
            />
            <mat-error *ngIf="socioForm.get('nombre')?.hasError('required')">
              El nombre es requerido
            </mat-error>
          </mat-form-field>

          <!-- Apellido Paterno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Paterno *</mat-label>
            <input
              matInput
              formControlName="apellidoPaterno"
              placeholder="Ingrese el apellido paterno"
              maxlength="50"
            />
            <mat-error *ngIf="socioForm.get('apellidoPaterno')?.hasError('required')">
              El apellido paterno es requerido
            </mat-error>
          </mat-form-field>

          <!-- Apellido Materno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Materno</mat-label>
            <input
              matInput
              formControlName="apellidoMaterno"
              placeholder="Ingrese el apellido materno (opcional)"
              maxlength="50"
            />
          </mat-form-field>

          <!-- DNI -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>DNI *</mat-label>
            <input
              matInput
              formControlName="dni"
              placeholder="12345678"
              maxlength="8"
              type="text"
              (input)="onDniInput($event)"
            />
            <mat-error *ngIf="socioForm.get('dni')?.hasError('required')">
              El DNI es requerido
            </mat-error>
            <mat-error *ngIf="socioForm.get('dni')?.hasError('pattern')">
              El DNI debe tener exactamente 8 dígitos
            </mat-error>
          </mat-form-field>

          <!-- Teléfono -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono *</mat-label>
            <input
              matInput
              formControlName="telefono"
              placeholder="987654321"
              maxlength="15"
              type="tel"
            />
            <mat-error *ngIf="socioForm.get('telefono')?.hasError('required')">
              El teléfono es requerido
            </mat-error>
          </mat-form-field>

          <!-- Contraseña -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nueva Contraseña (opcional)</mat-label>
            <input
              matInput
              formControlName="contrasena"
              placeholder="Dejar vacío para mantener la actual"
              type="password"
              maxlength="100"
            />
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button
          mat-button
          (click)="onCancel()"
          type="button"
          [disabled]="loading"
        >
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSubmit()"
          type="button"
          [disabled]="!socioForm.valid || loading"
        >
          <mat-spinner
            *ngIf="loading"
            diameter="20"
            class="button-spinner"
          ></mat-spinner>
          <mat-icon *ngIf="!loading">save</mat-icon>
          {{ loading ? 'Actualizando...' : 'Actualizar Socio' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        display: flex;
        flex-direction: column;
        min-height: 400px;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 0 24px;
        margin-bottom: 16px;
      }

      .dialog-header h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #1976d2;
        font-weight: 500;
      }

      .dialog-content {
        flex: 1;
        padding: 0 24px;
        margin-bottom: 0;
      }

      .socio-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 500px;
      }

      .full-width {
        width: 100%;
      }

      .dialog-actions {
        justify-content: flex-end;
        padding: 16px 24px 20px 24px;
        gap: 8px;
      }

      .button-spinner {
        margin-right: 8px;
      }
    `,
  ],
})
export class ModificarSocioComponent implements OnInit, OnDestroy {
  socioForm: FormGroup;
  loading: boolean = false;
  colegioId: number;
  socioData: SocioData;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ModificarSocioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socio: SocioData; colegioId: number }
  ) {
    this.colegioId = data.colegioId;
    this.socioData = data.socio;
    
    this.socioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: [''],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      contrasena: [''],
    });
  }

  ngOnInit() {
    console.log('🚀 ModificarSocioComponent inicializado');
    this.loadSocioData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSocioData(): void {
    const apellidos = this.socioData.apellidos || '';
    const apellidosArray = apellidos.trim().split(/\s+/);
    
    this.socioForm.patchValue({
      nombre: this.socioData.nombre || '',
      apellidoPaterno: apellidosArray[0] || '',
      apellidoMaterno: apellidosArray.slice(1).join(' ') || '',
      dni: this.socioData.dni || '',
      telefono: this.socioData.telefono || '',
      contrasena: '',
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken || '732612882'}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  onDniInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.socioForm.patchValue({ dni: input.value });
  }

  onSubmit(): void {
    if (this.socioForm.valid && !this.loading) {
      this.updateSocio();
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.socioForm.controls).forEach((key) => {
      this.socioForm.get(key)?.markAsTouched();
    });
  }

  private updateSocio(): void {
    this.loading = true;
    const formValue = this.socioForm.value;
    
    const updateData: any = {
      nombre: formValue.nombre.trim(),
      apellidoPaterno: formValue.apellidoPaterno.trim(),
      apellidoMaterno: formValue.apellidoMaterno ? formValue.apellidoMaterno.trim() : '',
      dni: formValue.dni.trim(),
      telefono: formValue.telefono.trim(),
      idColegios: [this.colegioId],
    };

    if (formValue.contrasena && formValue.contrasena.trim()) {
      updateData.contrasena = formValue.contrasena.trim();
    }

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/${this.socioData.id}`;

    this.http
      .put(url, updateData, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.loading = false;
            this.snackBar.open('✅ Socio actualizado correctamente', 'Cerrar', {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });
            this.dialogRef.close(true);
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.loading = false;
            let errorMessage = 'Error al actualizar el socio';
            
            if (error.status === 400) {
              errorMessage = 'Datos inválidos. Verifique la información';
            } else if (error.status === 404) {
              errorMessage = 'Socio no encontrado';
            }

            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });
          });
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}