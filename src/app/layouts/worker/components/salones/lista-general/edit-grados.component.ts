import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-edit-grados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="edit-container">
      <h2 mat-dialog-title>Editar Grado</h2>

      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos del grado...</p>
        </div>

        <div *ngIf="error && !loading" class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-button color="primary" (click)="cargarDatos()">Reintentar</button>
        </div>

        <form *ngIf="!loading && !error" [formGroup]="editForm" class="edit-form">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre del grado</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: 1°, 2°, 3°" required>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('required')">
              El nombre es obligatorio
            </mat-error>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('maxlength')">
              El nombre no puede tener más de 50 caracteres
            </mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()" [disabled]="saving">Cancelar</button>
        <button mat-raised-button color="primary" (click)="guardar()" [disabled]="editForm.invalid || saving">
          <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
          <span *ngIf="!saving">Guardar</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-container {
      padding: 0 10px;
      min-width: 500px;      
    }
    
    h2 {
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      margin: -24px -24px 20px -24px;
      font-weight: 500;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      background: #ffebee;
      border-radius: 4px;
      color: #c62828;
      margin-bottom: 16px;
    }
    
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 30px
    }
    
    .form-field-full {
      width: 100%;
    }
    
    @media (max-width: 600px) {
      .edit-container {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class EditGradosComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;

  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditGradosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  private getHeaders(): HttpHeaders {
    const token = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    // Usar el endpoint que funciona para obtener todos los grados del colegio
    this.http.get<any>(`${this.apiBase}/grado/colegio/${this.data.idColegio}?page=1`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response && response.data && Array.isArray(response.data)) {
            const grado = response.data.find((g: any) => g.id === this.data.id);
            
            if (grado) {
              this.editForm.patchValue({
                nombre: grado.nombre || ''
              });
            } else {
              this.error = 'Grado no encontrado.';
            }
          } else {
            this.error = 'Formato de respuesta inesperado.';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar grado:', err);
          this.error = 'Error al cargar los datos del grado.';
          if (err.status === 404) {
            this.error = 'El grado solicitado no existe.';
          } else if (err.status === 403) {
            this.error = 'No tiene permisos para acceder a este recurso.';
          }
          this.loading = false;
        }
      });
  }

  guardar(): void {
    if (this.editForm.invalid) return;

    this.saving = true;
    this.error = null;

    const datos = {
      nombre: this.editForm.value.nombre,
      idColegio: this.data.idColegio
    };

    // Especificar que esperamos texto como respuesta
    this.http.put(`${this.apiBase}/grado/${this.data.id}`, datos, { 
      headers: this.getHeaders(),
      responseType: 'text' // Esto le dice a Angular que espere texto, no JSON
    }).subscribe({
      next: (response: string) => {
        this.saving = false;
        
        // Mostrar mensaje de éxito
        this.snackBar.open('Grado actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Cerrar el diálogo con éxito
        this.dialogRef.close({ 
          success: true, 
          data: { 
            id: this.data.id,
            nombre: this.editForm.value.nombre,
            message: response 
          } 
        });
      },
      error: (err) => {
        console.error('Error al actualizar grado:', err);
        
        // Manejar diferentes tipos de errores
        if (err.status === 400) {
          this.error = 'Datos inválidos. Por favor, verifique la información.';
        } else if (err.status === 404) {
          this.error = 'El grado no existe o ha sido eliminado.';
        } else if (err.status === 409) {
          this.error = 'Ya existe un grado con ese nombre.';
        } else if (err.status === 403) {
          this.error = 'No tiene permisos para realizar esta acción.';
        } else {
          this.error = 'Error al actualizar el grado. Por favor, intente nuevamente.';
        }
        
        // Si el error tiene un mensaje de texto, usarlo
        if (err.error && typeof err.error === 'string') {
          this.error = err.error;
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        }
        
        this.saving = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}