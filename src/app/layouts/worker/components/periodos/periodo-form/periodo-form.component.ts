import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PeriodoService, Periodo } from '../../../../../services/periodo.service';
import { AuthService } from '../../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-periodo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Periodo</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Periodo</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej. 2024-I">
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">
            El nombre es requerido
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || loading">
        {{ loading ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class PeriodoFormComponent implements OnInit {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private periodoService: PeriodoService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<PeriodoFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: Periodo | null
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const formValue = this.form.value;

    if (this.data) {
      // Editar
      const colegioId = this.authService.getColegioId();
      if (!colegioId) {
        this.snackBar.open('Error: No se pudo identificar el colegio', 'Cerrar', { duration: 3000 });
        this.loading = false;
        return;
      }

      this.periodoService.update(this.data.id, { colegioId, ...formValue }).subscribe({
        next: () => {
          this.snackBar.open('Periodo actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error updating periodo:', err);
          this.snackBar.open('Error al actualizar el periodo', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      // Crear
      const colegioId = this.authService.getColegioId();
      if (!colegioId) {
        this.snackBar.open('Error: No se pudo identificar el colegio', 'Cerrar', { duration: 3000 });
        this.loading = false;
        return;
      }

      this.periodoService.create(formValue, colegioId).subscribe({
        next: () => {
          this.snackBar.open('Periodo creado correctamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error creating periodo:', err);
          this.snackBar.open('Error al crear el periodo', 'Cerrar', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }
}
