import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../../services/UserData';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';

@Component({
  selector: 'app-edit-nota',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule
  ],
  template: `
    <div class="edit-container">
      <h2 mat-dialog-title class="dialog-title">Editar Nota</h2>

      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos...</p>
        </div>

        <div *ngIf="error" class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-button color="primary" (click)="cargarAlumnos()">Reintentar</button>
        </div>

        <form *ngIf="!loading && !error" [formGroup]="editForm" class="edit-form">
          <!-- Selección de alumno -->
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Seleccionar Alumno</mat-label>
            <mat-select formControlName="idAlumno" required>
              <mat-option *ngFor="let alumno of alumnos" [value]="alumno.id">
                {{ alumno.nombre_completo }} - {{ alumno.numero_documento }} ({{ alumno.grado }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="editForm.get('idAlumno')?.hasError('required')">
              La selección de alumno es obligatoria
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre de la nota</mat-label>
            <input matInput formControlName="nombre" placeholder="Nombre de la nota" required>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('required')">
              El nombre es obligatorio
            </mat-error>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('maxlength')">
              El nombre no puede exceder los 200 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>PDF (URL o nombre del archivo)</mat-label>
            <textarea matInput formControlName="pdf" placeholder="URL o nombre del archivo PDF" rows="3" required></textarea>
            <mat-error *ngIf="editForm.get('pdf')?.hasError('required')">
              El campo PDF es obligatorio
            </mat-error>
          </mat-form-field>

          <div class="readonly-fields">
            <h3>Información del colegio</h3>
            <div class="readonly-field">
              <label>ID del Colegio:</label>
              <span>{{ idColegio }}</span>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="loading">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSave()" 
                [disabled]="editForm.invalid || loading">
          <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
          <span *ngIf="!loading">Guardar Cambios</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-container {
      padding: 0;
      min-width: 500px;
    }
    
    .dialog-title {
      background: #1f2937;
      color: white !important;
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
    }
    
    .form-field-full {
      width: 100%;
    }
    
    .readonly-fields {
      margin-top: 20px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .readonly-fields h3 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
    }
    
    .readonly-field {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .readonly-field label {
      font-weight: 500;
      color: #333;
    }
    
    .readonly-field span {
      color: #666;
    }
    
    @media (max-width: 600px) {
      .edit-container {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class EditNotasComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  error: string | null = null;
  alumnos: any[] = [];
  idColegio: number = 0;

  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditNotasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Obtener idColegio del servicio de usuario
    const userData = this.userService.getUserData();
    this.idColegio = userData?.colegio || 0;
    
    // Inicializar el formulario
    this.editForm = this.fb.group({
      idAlumno: [data.nota?.idAlumno || '', Validators.required],
      nombre: [data.nota?.nombre || '', [Validators.required, Validators.maxLength(200)]],
      pdf: [data.nota?.pdf || '', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarAlumnos();
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    });
  }

  cargarAlumnos(): void {
    this.loading = true;
    this.error = null;

    if (this.idColegio === 0) {
      this.error = 'No se pudo obtener el ID del colegio. Por favor, inicie sesión nuevamente.';
      this.loading = false;
      return;
    }

    this.http.get<any>(
      `${this.apiBase}/alumno/colegio/${this.idColegio}`,
      { headers: this.getHeaders() }
    )
    .pipe(
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        let errorMessage = 'Error al cargar la lista de alumnos';
        
        if (error.status === 404) {
          errorMessage = 'No se encontraron alumnos para este colegio';
        } else if (error.status === 401) {
          errorMessage = 'No tiene autorización para acceder a estos datos';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para ver los alumnos';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su internet.';
        }

        this.error = errorMessage;
        return throwError(() => error);
      })
    )
    .subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response && Array.isArray(response.data)) {
          this.alumnos = response.data;
          
          // Si estamos editando una nota existente, seleccionar el alumno correspondiente
          if (this.data.nota?.idAlumno) {
            const alumnoExistente = this.alumnos.find(a => a.id === this.data.nota.idAlumno);
            if (!alumnoExistente) {
              this.error = 'El alumno asociado a esta nota no fue encontrado';
            } else {
              this.editForm.patchValue({
                idAlumno: this.data.nota.idAlumno
              });
            }
          }
        } else {
          this.error = 'Formato de respuesta inesperado al cargar alumnos';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar alumnos:', error);
      }
    });
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading = true;

    // Payload con el formato especificado
    const payload = {
      idAlumno: this.editForm.value.idAlumno,
      pdf: this.editForm.value.pdf.trim(),
      idColegio: this.idColegio,
      nombre: this.editForm.value.nombre.trim()
    };

    // PRUEBA DIFERENTES MÉTODOS HTTP - el error 405 indica método no permitido
    const methodsToTry = ['put', 'patch', 'post'];
    let currentMethodIndex = 0;

    const tryNextMethod = () => {
      if (currentMethodIndex >= methodsToTry.length) {
        this.loading = false;
        this.snackBar.open('Error: Ningún método HTTP funcionó para actualizar la nota', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      const method = methodsToTry[currentMethodIndex];
      currentMethodIndex++;

      // Para edición usar el endpoint con ID, para creación sin ID
      const url = this.data.nota?.id 
        ? `${this.apiBase}/nota/${this.data.nota.id}`
        : `${this.apiBase}/nota`;

      this.http.request(method, url, {
        body: payload,
        headers: this.getHeaders(),
        responseType: 'text'
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Si es error 405, probar el siguiente método
          if (error.status === 405 && currentMethodIndex < methodsToTry.length) {
            console.log(`Método ${method} falló (405), probando siguiente...`);
            tryNextMethod();
            return throwError(() => error);
          }
          
          this.loading = false;
          this.handleError(error, method);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.handleSuccess(response);
        },
        error: (error) => {
          // El error ya se maneja en catchError
        }
      });
    };

    // Comenzar con el primer método
    tryNextMethod();
  }

  private handleError(error: HttpErrorResponse, method: string): void {
    console.error(`Error al ${method} nota:`, error);
    
    let errorMessage = 'Error al guardar la nota';
    
    if (error.status === 400) {
      errorMessage = 'Datos inválidos. Verifique la información.';
    } else if (error.status === 404) {
      errorMessage = 'El recurso no fue encontrado.';
    } else if (error.status === 401) {
      errorMessage = 'No tiene autorización para realizar esta acción';
    } else if (error.status === 403) {
      errorMessage = 'No tiene permisos para realizar esta acción';
    } else if (error.status === 405) {
      errorMessage = `Método ${method.toUpperCase()} no permitido para este endpoint`;
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su internet.';
    }

    this.snackBar.open(errorMessage, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private handleSuccess(response: any): void {
    const successMessage = this.data.nota?.id 
      ? 'Nota actualizada correctamente' 
      : 'Nota creada correctamente';
    
    this.snackBar.open(successMessage, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    
    // Retornar los datos actualizados/creados
    this.dialogRef.close({
      success: true,
      nota: { 
        ...(this.data.nota || {}),
        idAlumno: this.editForm.value.idAlumno,
        pdf: this.editForm.value.pdf.trim(),
        idColegio: this.idColegio,
        nombre: this.editForm.value.nombre.trim()
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}