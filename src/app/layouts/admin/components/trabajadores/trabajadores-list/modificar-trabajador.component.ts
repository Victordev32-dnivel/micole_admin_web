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
import { MatIconModule } from '@angular/material/icon';

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
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Editar Trabajador (ID: {{trabajadorId}})</h2>
    <div mat-dialog-content>
      <form [formGroup]="trabajadorForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
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
          <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="contrasena" required>
          <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
          </button>
          <mat-hint>Ingresa la nueva contraseña o mantén la actual</mat-hint>
          <mat-error *ngIf="trabajadorForm.get('contrasena')?.errors?.['required']">Este campo es requerido</mat-error>
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
  currentPassword: string = '';
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<EditTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // El ID debe venir del parámetro data.id (que es el ID del trabajador)
    this.trabajadorId = this.data.id;
    this.currentPassword = this.data.trabajador?.contrasena || '';
    
    // Inicializar el formulario con los datos actuales
    this.trabajadorForm = this.fb.group({
      nombre: [this.data.trabajador?.nombre || '', Validators.required],
      apellidoPaterno: [this.data.trabajador?.apellidoPaterno || '', Validators.required],
      apellidoMaterno: [this.data.trabajador?.apellidoMaterno || '', Validators.required],
      dni: [this.data.trabajador?.dni || '', Validators.required],
      telefono: [this.data.trabajador?.telefono || '', Validators.required],
      contrasena: [this.currentPassword, [Validators.required, Validators.minLength(6)]], // Mostrar contraseña actual
      idColegio: [this.data.trabajador?.idColegio || '', Validators.required]
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
      
      // Usar exactamente los campos que espera la API según tu esquema
      const formData = {
        nombre: formValues.nombre,                    // Correcto: nombre (no nombres)
        apellidoMaterno: formValues.apellidoMaterno,
        apellidoPaterno: formValues.apellidoPaterno,
        contrasena: formValues.contrasena,            // Incluir contraseña (requerida)
        dni: formValues.dni,                          // Correcto: dni (no numeroDocumento)
        telefono: formValues.telefono,
        idColegio: Number(formValues.idColegio)       // Asegurar que sea número
      };

      const apiUrl = `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`;

      this.http.put(apiUrl, formData, {
        headers: this.getHeaders()
      }).subscribe({
        next: (response) => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.dialogRef.close(false);
        }
      });
    } else {
      if (!this.trabajadorId) {
        // Error: ID no válido
        this.dialogRef.close(false);
      } else {
        // Formulario inválido - no hacer nada, mostrar errores en campos
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}