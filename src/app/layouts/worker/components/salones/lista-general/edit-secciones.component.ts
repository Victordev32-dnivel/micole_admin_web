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
  selector: 'app-edit-secciones',
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
      <h2 mat-dialog-title>Editar Sección</h2>

      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos de la sección...</p>
        </div>

        <div *ngIf="error && !loading" class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-button color="primary" (click)="cargarDatos()">Reintentar</button>
        </div>

        <form *ngIf="!loading && !error" [formGroup]="editForm" class="edit-form">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre de la sección</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: A, B, C" required>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('required')">
              El nombre es obligatorio
            </mat-error>
            <mat-error *ngIf="editForm.get('nombre')?.hasError('maxlength')">
              El nombre no puede tener más de 50 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Mostrar información de debug si es necesario -->
          <div *ngIf="showDebugInfo" class="debug-info">
            <p><strong>ID Sección:</strong> {{ data.id }}</p>
            <p><strong>ID Colegio:</strong> {{ data.idColegio }}</p>
          </div>
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
  h2[mat-dialog-title] {
        background: #1f2937; /* gris oscuro */
        color: white; /* blanco */
        padding: 16px 24px;
        margin: -24px -24px 20px -24px;
        font-weight: 500;
      },
    .edit-container {
      padding: 0 10px;
      min-width: 450px;
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
      padding-top: 30px;
    }
    
    .form-field-full {
      width: 100%;
    }

    .debug-info {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 10px;
    }
    
    @media (max-width: 600px) {
      .edit-container {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class EditSeccionesComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;
  showDebugInfo = false; // Cambiar a true para debug

  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditSeccionesComponent>,
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

    console.log('🔍 Cargando datos para sección:', {
      id: this.data.id,
      idColegio: this.data.idColegio,
      data: this.data
    });

    // Intentar cargar desde el listado de secciones del colegio
    this.cargarDesdeListado();
  }

  private cargarDesdeListado(): void {
    console.log('🔍 Cargando desde listado de secciones del colegio');
    
    // Primero intentar sin paginación
    this.http.get<any>(`${this.apiBase}/seccion/colegio/${this.data.idColegio}?all=true`, { 
      headers: this.getHeaders() 
    }).subscribe({
      next: (response) => {
        console.log('📋 Respuesta del listado (all=true):', response);
        this.procesarRespuestaListado(response);
      },
      error: (err) => {
        console.warn('⚠️ Intentando con paginación normal...', err);
        // Si falla, intentar con paginación normal
        this.http.get<any>(`${this.apiBase}/seccion/colegio/${this.data.idColegio}?page=1&limit=100`, { 
          headers: this.getHeaders() 
        }).subscribe({
          next: (response) => {
            console.log('📋 Respuesta del listado (paginado):', response);
            this.procesarRespuestaListado(response);
          },
          error: (err) => {
            console.error('❌ Error al cargar listado de secciones:', err);
            this.manejarErrorCarga(err);
          }
        });
      }
    });
  }

  private procesarRespuestaListado(response: any): void {
    let secciones = [];
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response)) {
      secciones = response;
    } else if (response && Array.isArray(response.data)) {
      secciones = response.data;
    } else if (response && Array.isArray(response.secciones)) {
      secciones = response.secciones;
    } else if (response && response.content && Array.isArray(response.content)) {
      secciones = response.content;
    }

    console.log('📊 Secciones procesadas:', secciones);
    console.log('🔍 Buscando sección con ID:', this.data.id);

    // Buscar la sección con diferentes estrategias de comparación
    const seccion = this.buscarSeccion(secciones);

    if (seccion) {
      console.log('✅ Sección encontrada:', seccion);
      this.editForm.patchValue({
        nombre: seccion.nombre || seccion.Nombre || ''
      });
      this.loading = false;
    } else {
      console.error('❌ Sección no encontrada en el listado');
      this.error = `No se encontró la sección con ID ${this.data.id}. ` +
                  `Verifique que existe en el colegio ${this.data.idColegio}`;
      this.loading = false;
    }
  }

  private buscarSeccion(secciones: any[]): any {
    return secciones.find((s: any) => {
      // Diferentes estrategias de búsqueda
      return (
        s.id == this.data.id || // Comparación flexible
        Number(s.id) === Number(this.data.id) || // Comparación numérica
        String(s.id) === String(this.data.id) || // Comparación string
        (s.idSeccion && s.idSeccion == this.data.id) || // Por si acaso tiene otro nombre
        (s.ID && s.ID == this.data.id) // Por si acaso el campo se llama ID
      );
    });
  }

  private manejarErrorCarga(err: any): void {
    this.loading = false;
    
    if (err.status === 404) {
      this.error = 'No se encontraron secciones para este colegio.';
    } else if (err.status === 403) {
      this.error = 'No tiene permisos para acceder a este recurso.';
    } else if (err.status === 401) {
      this.error = 'No autorizado. Por favor, inicie sesión nuevamente.';
    } else if (err.status === 0) {
      this.error = 'Sin conexión al servidor. Verifique su conexión.';
    } else {
      this.error = `Error al cargar los datos: ${err.status} ${err.statusText}`;
    }

    // Mostrar detalles del error en consola para debug
    console.error('Detalles del error:', err);
  }

  guardar(): void {
    if (this.editForm.invalid) {
      this.mostrarErrorFormulario();
      return;
    }

    this.saving = true;
    this.error = null;

    const datos = {
      nombre: this.editForm.value.nombre.trim(),
      idColegio: this.data.idColegio
    };

    console.log('💾 Guardando sección:', {
      id: this.data.id,
      datos: datos
    });

    // Usar PUT para actualizar la sección
    this.http.put(`${this.apiBase}/seccion/${this.data.id}`, datos, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: (response: string) => {
        this.manejarExitoGuardado(response);
      },
      error: (err) => {
        this.manejarErrorGuardado(err);
      }
    });
  }

  private mostrarErrorFormulario(): void {
    if (this.editForm.get('nombre')?.hasError('required')) {
      this.error = 'El nombre de la sección es obligatorio';
    } else if (this.editForm.get('nombre')?.hasError('maxlength')) {
      this.error = 'El nombre no puede tener más de 50 caracteres';
    }
  }

  private manejarExitoGuardado(response: string): void {
    this.saving = false;
    
    this.snackBar.open('✅ Sección actualizada correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    
    this.dialogRef.close({ 
      success: true, 
      data: { 
        id: this.data.id,
        nombre: this.editForm.value.nombre,
        message: response 
      } 
    });
  }

  private manejarErrorGuardado(err: any): void {
    this.saving = false;
    console.error('❌ Error al guardar:', err);

    if (err.status === 400) {
      this.error = 'Datos inválidos. Verifique la información.';
    } else if (err.status === 404) {
      this.error = 'La sección no existe o ha sido eliminada.';
    } else if (err.status === 409) {
      this.error = 'Ya existe una sección con ese nombre en este colegio.';
    } else if (err.status === 403) {
      this.error = 'No tiene permisos para realizar esta acción.';
    } else if (err.status === 0) {
      this.error = 'Sin conexión al servidor. Verifique su conexión.';
    } else {
      this.error = 'Error al actualizar la sección. Intente nuevamente.';
    }

    // Mensaje específico del servidor
    if (err.error && typeof err.error === 'string') {
      this.error = err.error;
    } else if (err.error && err.error.message) {
      this.error = err.error.message;
    }
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}