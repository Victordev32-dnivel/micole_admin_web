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
    <h2 mat-dialog-title>Editar Trabajador</h2>
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
    this.trabajadorId = data.id;
    
    this.trabajadorForm = this.fb.group({
      nombre: [data.trabajador.nombre || '', Validators.required],
      apellidoPaterno: [data.trabajador.apellidoPaterno || '', Validators.required],
      apellidoMaterno: [data.trabajador.apellidoMaterno || '', Validators.required],
      dni: [data.trabajador.dni || '', Validators.required],
      telefono: [data.trabajador.telefono || '', Validators.required],
      contrasena: ['', [Validators.minLength(6)]], // Opcional al editar
      idColegio: [data.trabajador.idColegio || '', Validators.required],
      tipoUsuario: ['trabajador']
    });

    this.colegios = data.colegios || [];
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
    if (this.trabajadorForm.valid) {
      this.loading = true;
      const formData = this.trabajadorForm.value;
      
      // Si no se modificó la contraseña, la eliminamos del objeto
      if (!formData.contrasena) {
        delete formData.contrasena;
      }

      this.http.put(`https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`, formData, {
        headers: this.getHeaders()
      }).subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al actualizar trabajador:', error);
          this.loading = false;
          alert('Error al actualizar el trabajador. Por favor, intente nuevamente.');
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}