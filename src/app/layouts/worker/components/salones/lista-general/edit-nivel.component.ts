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
  selector: 'app-edit-nivel',
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
      <div class="header-container">
        <h2 mat-dialog-title class="centered-title">Editar Nivel</h2>
      </div>

      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos del nivel...</p>
        </div>

        <div *ngIf="error && !loading" class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-button color="primary" (click)="cargarDatos()">Reintentar</button>
        </div>

        <form *ngIf="!loading && !error" [formGroup]="editForm" class="edit-form">
          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Nombre del nivel</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: Primaria, Secundaria" required>
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
    
    .header-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #1f2937;
      margin: -24px -24px 20px -24px;
      padding: 0 24px;
    }
    
    .centered-title {
      color: white;
      padding: 16px 0;
      margin: 0;
      font-weight: 500;
      text-align: center;
      flex: 1;
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
      
      .header-container {
        margin: -16px -16px 16px -16px;
        padding: 0 16px;
      }
    }
  `]
})
export class EditNivelComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;
  showDebugInfo = true; // Cambiar a false en producción

  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditNivelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    console.log('🔧 Iniciando EditNivelComponent con data:', this.data);
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

    console.log('🔍 Cargando datos para nivel:', {
      id: this.data.id,
      idColegio: this.data.idColegio
    });

    // Primero intentar cargar desde el listado de niveles del colegio
    this.cargarDesdeListado();
  }

  private cargarDesdeListado(): void {
    console.log('🔍 Cargando desde listado de niveles del colegio');
    
    const url = `${this.apiBase}/nivel/colegio/${this.data.idColegio}?all=true`;
    console.log('📋 URL del listado:', url);

    this.http.get<any>(url, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('📋 Respuesta del listado de niveles:', response);
          this.procesarRespuestaListado(response);
        },
        error: (err) => {
          console.error('❌ Error al cargar listado de niveles:', err);
          this.manejarErrorCarga(err);
        }
      });
  }

  private procesarRespuestaListado(response: any): void {
    let niveles = [];
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response)) {
      niveles = response;
    } else if (response && Array.isArray(response.data)) {
      niveles = response.data;
    } else if (response && Array.isArray(response.niveles)) {
      niveles = response.niveles;
    } else if (response && response.content && Array.isArray(response.content)) {
      niveles = response.content;
    } else {
      console.error('❌ Formato de respuesta no reconocido:', response);
      this.error = 'Formato de respuesta inesperado del servidor.';
      this.loading = false;
      return;
    }

    console.log('📊 Niveles disponibles:', niveles.map((n: any) => ({ id: n.id, nombre: n.nombre })));
    console.log('🔍 Buscando nivel con ID:', this.data.id);

    // Buscar el nivel con diferentes estrategias de comparación
    const nivel = this.buscarNivel(niveles);

    if (nivel) {
      console.log('✅ Nivel encontrado:', nivel);
      this.editForm.patchValue({
        nombre: nivel.nombre || nivel.Nombre || ''
      });
      this.loading = false;
    } else {
      console.error('❌ Nivel no encontrado en el listado');
      console.log('🔍 IDs en el listado:', niveles.map((n: any) => n.id));
      console.log('🎯 ID buscado:', this.data.id, typeof this.data.id);
      
      this.error = `No se encontró el nivel con ID ${this.data.id}. ` +
                  `Verifique que existe en el colegio ${this.data.idColegio}`;
      this.loading = false;
    }
  }

  private buscarNivel(niveles: any[]): any {
    return niveles.find((n: any) => {
      // Diferentes estrategias de búsqueda
      return (
        n.id == this.data.id || // Comparación flexible
        Number(n.id) === Number(this.data.id) || // Comparación numérica
        String(n.id) === String(this.data.id) || // Comparación string
        (n.idNivel && n.idNivel == this.data.id) || // Por si acaso tiene otro nombre
        (n.ID && n.ID == this.data.id) // Por si acaso el campo se llama ID
      );
    });
  }

  private manejarErrorCarga(err: any): void {
    this.loading = false;
    
    if (err.status === 404) {
      this.error = 'No se encontraron niveles para este colegio.';
    } else if (err.status === 403) {
      this.error = 'No tiene permisos para acceder a este recurso.';
    } else if (err.status === 401) {
      this.error = 'No autorizado. Por favor, inicie sesión nuevamente.';
    } else if (err.status === 0) {
      this.error = 'Sin conexión al servidor. Verifique su conexión.';
    } else {
      this.error = `Error al cargar los datos: ${err.status} ${err.statusText}`;
    }

    console.error('📊 Detalles del error:', err);
  }

  guardar(): void {
    if (this.editForm.invalid) {
      console.log('❌ Formulario inválido:', this.editForm.errors);
      this.mostrarErrorFormulario();
      return;
    }

    this.saving = true;
    this.error = null;

    const datos = {
      nombre: this.editForm.value.nombre.trim(),
      idColegio: this.data.idColegio
    };

    const url = `${this.apiBase}/nivel/${this.data.id}`;
    console.log('💾 Actualizando nivel:', { url, datos });

    this.http.put(url, datos, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: (response: string) => {
        console.log('✅ Nivel actualizado exitosamente:', response);
        this.manejarExitoGuardado(response);
      },
      error: (err) => {
        this.manejarErrorGuardado(err);
      }
    });
  }

  private mostrarErrorFormulario(): void {
    if (this.editForm.get('nombre')?.hasError('required')) {
      this.error = 'El nombre del nivel es obligatorio';
    } else if (this.editForm.get('nombre')?.hasError('maxlength')) {
      this.error = 'El nombre no puede tener más de 50 caracteres';
    }
  }

  private manejarExitoGuardado(response: string): void {
    this.saving = false;
    
    this.snackBar.open('✅ Nivel actualizado correctamente', 'Cerrar', {
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
    console.error('❌ Error al guardar nivel:', err);

    if (err.status === 400) {
      this.error = 'Datos inválidos. Verifique el nombre del nivel.';
    } else if (err.status === 404) {
      this.error = 'El nivel no existe o ha sido eliminado.';
    } else if (err.status === 409) {
      this.error = 'Ya existe un nivel con ese nombre en este colegio.';
    } else if (err.status === 403) {
      this.error = 'No tiene permisos para actualizar este nivel.';
    } else if (err.status === 422) {
      this.error = 'Los datos enviados no son válidos.';
    } else if (err.status === 0) {
      this.error = 'Sin conexión al servidor. Verifique su conexión.';
    } else {
      this.error = 'Error al actualizar el nivel. Intente nuevamente.';
    }
    
    // Mostrar error específico del servidor si está disponible
    if (err.error && typeof err.error === 'string' && err.error.trim()) {
      this.error = err.error;
    } else if (err.error && err.error.message) {
      this.error = err.error.message;
    }
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}