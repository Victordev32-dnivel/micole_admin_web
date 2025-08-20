import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-trabajadores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Editar Trabajador (ID: {{trabajadorId}})</h2>
    <div mat-dialog-content>
      <form [formGroup]="trabajadorForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombres</mat-label>
          <input matInput formControlName="nombre" required>
          <mat-error *ngIf="trabajadorForm.get('nombre')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido Paterno</mat-label>
          <input matInput formControlName="apellidoPaterno" required>
          <mat-error *ngIf="trabajadorForm.get('apellidoPaterno')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido Materno</mat-label>
          <input matInput formControlName="apellidoMaterno" required>
          <mat-error *ngIf="trabajadorForm.get('apellidoMaterno')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>DNI</mat-label>
          <input matInput formControlName="dni" required>
          <mat-error *ngIf="trabajadorForm.get('dni')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" required>
          <mat-error *ngIf="trabajadorForm.get('telefono')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="contrasena">
          <mat-hint>Dejar en blanco si no desea cambiar la contraseña</mat-hint>
          <mat-error *ngIf="trabajadorForm.get('contrasena')?.errors?.['minlength']">Mínimo 6 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Colegio</mat-label>
          <mat-select formControlName="idColegio" required>
            <mat-option *ngFor="let colegio of colegios" [value]="colegio.id">
              {{ colegio.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="trabajadorForm.get('idColegio')?.invalid">Este campo es requerido</mat-error>
        </mat-form-field>
      </form>

      <!-- DEBUG INFO - Remover en producción -->
      <div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 12px;">
        <strong>DEBUG INFO:</strong><br>
        ID del trabajador: {{ trabajadorId }}<br>
        URL que se va a usar: {{ getApiUrl() }}<br>
        Datos recibidos: {{ debugDataReceived() }}
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onSubmit()" 
              [disabled]="!trabajadorForm.valid || loading">
        <span *ngIf="!loading">Guardar</span>
        <mat-spinner *ngIf="loading" diameter="20" class="button-spinner"></mat-spinner>
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    mat-dialog-content {
      padding: 20px;
    }
    mat-dialog-actions {
      padding: 20px;
      margin-top: 10px;
    }
    .button-spinner {
      display: inline-block;
      margin: 0 8px;
    }
  `]
})
export class EditTrabajadoresComponent implements OnInit {
  trabajadorForm: FormGroup;
  colegios: any[] = [];
  loading: boolean = false;
  trabajadorId: number;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Debug: Imprimir todos los datos recibidos
    console.log('=== DATOS RECIBIDOS EN EDIT DIALOG ===');
    console.log('data completo:', this.data);
    console.log('data.id:', this.data.id);
    console.log('data.trabajador:', this.data.trabajador);
    console.log('data.trabajador.id:', this.data.trabajador?.id);
    
    // Asignar el ID - usar el ID del parámetro data.id
    this.trabajadorId = this.data.id;
    
    // Si por alguna razón data.id no existe, usar el del trabajador
    if (!this.trabajadorId && this.data.trabajador?.id) {
      this.trabajadorId = this.data.trabajador.id;
    }
    
    console.log('ID final asignado:', this.trabajadorId);
    console.log('=====================================');
    
    this.trabajadorForm = this.fb.group({
      nombre: [this.data.trabajador?.nombre || '', Validators.required],
      apellidoPaterno: [this.data.trabajador?.apellidoPaterno || '', Validators.required],
      apellidoMaterno: [this.data.trabajador?.apellidoMaterno || '', Validators.required],
      dni: [this.data.trabajador?.dni || '', Validators.required],
      telefono: [this.data.trabajador?.telefono || '', Validators.required],
      contrasena: ['', [Validators.minLength(6)]], // Opcional al editar
      idColegio: [this.data.trabajador?.idColegio || '', Validators.required],
      tipoUsuario: ['trabajador']
    });

    this.colegios = this.data.colegios || [];
  }

  ngOnInit() {
    if (this.colegios.length === 0) {
      this.loadColegios();
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer 732612882',
      'Content-Type': 'application/json'
    });
  }

  // Método para debug - mostrar la URL que se va a usar
  getApiUrl(): string {
    return `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`;
  }

  // Método para debug - mostrar los datos recibidos
  debugDataReceived(): string {
    return JSON.stringify({
      id: this.data.id,
      trabajador: this.data.trabajador,
      trabajadorId: this.trabajadorId
    }, null, 2);
  }

  loadColegios() {
    this.http.get<any>('https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        this.colegios = response.data;
      },
      error: (error) => {
        console.error('Error al cargar colegios:', error);
      }
    });
  }

  onSubmit() {
    if (this.trabajadorForm.valid && this.trabajadorId) {
      this.loading = true;
      const formValues = this.trabajadorForm.value;
      
      // Mapear los campos al formato que espera el backend
      const formData: any = {
        nombres: formValues.nombre,              // Cambio: nombre -> nombres
        apellidoMaterno: formValues.apellidoMaterno,
        apellidoPaterno: formValues.apellidoPaterno,
        numeroDocumento: formValues.dni,         // Cambio: dni -> numeroDocumento
        telefono: formValues.telefono,
        idColegio: Number(formValues.idColegio), // Asegurar que sea número
        tipoUsuario: 'trabajador'                // Agregar tipoUsuario
      };

      // Solo agregar contraseña si se modificó
      if (formValues.contrasena && formValues.contrasena.trim() !== '') {
        formData.contrasena = formValues.contrasena;
      }

      const apiUrl = `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`;
      
      console.log('=== ENVIANDO ACTUALIZACIÓN ===');
      console.log('URL:', apiUrl);
      console.log('ID del trabajador:', this.trabajadorId);
      console.log('Datos del formulario:', formValues);
      console.log('Datos mapeados para enviar:', formData);
      console.log('Headers:', this.getHeaders());
      console.log('===============================');

      this.http.put(apiUrl, formData, {
        headers: this.getHeaders(),
        responseType: 'text' as 'json'  // Cambio: tratar respuesta como texto para debug
      }).subscribe({
        next: (response) => {
          console.log('Respuesta del servidor (texto):', response);
          this.loading = false;
          alert('Trabajador actualizado exitosamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('=== ERROR COMPLETO ===');
          console.error('Error object:', error);
          console.error('Error status:', error.status);
          console.error('Error statusText:', error.statusText);
          console.error('Error headers:', error.headers);
          console.error('Error body:', error.error);
          console.error('URL utilizada:', apiUrl);
          console.error('ID enviado:', this.trabajadorId);
          console.error('Datos enviados:', formData);
          console.error('=====================');
          
          this.loading = false;
          
          let errorMessage = 'Error al actualizar el trabajador.';
          if (error.status === 404) {
            errorMessage = 'Error: Trabajador no encontrado (404). Verifique que el ID sea correcto.';
          } else if (error.status === 400) {
            errorMessage = 'Error: Datos inválidos (400). Verifique los campos enviados.';
          } else if (error.status === 401) {
            errorMessage = 'Error: No autorizado (401). Verifique el token de autenticación.';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor (500).';
          }
          
          alert(errorMessage + '\n\nRevise la consola para más detalles.');
        }
      });
    } else {
      if (!this.trabajadorId) {
        alert('Error: No se puede actualizar - ID del trabajador no válido');
        console.error('ID del trabajador no válido:', this.trabajadorId);
      } else {
        alert('Por favor, complete todos los campos requeridos');
        console.error('Formulario inválido:', this.trabajadorForm.errors);
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}