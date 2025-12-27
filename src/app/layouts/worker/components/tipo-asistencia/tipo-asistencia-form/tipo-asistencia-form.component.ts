import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TipoAsistenciaService, TipoAsistencia } from '../../../../../services/tipo-asistencia.service';

@Component({
    selector: 'app-tipo-asistencia-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressSpinnerModule
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Tipo de Asistencia</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo</mat-label>
          <input matInput formControlName="tipo" placeholder="Ej: Tardanza">
          <mat-error *ngIf="form.get('tipo')?.hasError('required')">
            El tipo es obligatorio
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
        <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
        <span *ngIf="!saving">Guardar</span>
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class TipoAsistenciaFormComponent {
    form: FormGroup;
    isEdit: boolean = false;
    saving: boolean = false;

    constructor(
        private fb: FormBuilder,
        private tipoAsistenciaService: TipoAsistenciaService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<TipoAsistenciaFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: TipoAsistencia | null
    ) {
        this.isEdit = !!data;
        this.form = this.fb.group({
            tipo: [data?.tipo || '', Validators.required]
        });
    }

    cancel(): void {
        this.dialogRef.close();
    }

    save(): void {
        if (this.form.invalid) return;

        this.saving = true;
        const tipoValue = this.form.get('tipo')?.value;

        if (this.isEdit && this.data) {
            this.tipoAsistenciaService.update(this.data.id, { id: this.data.id, tipo: tipoValue }).subscribe({
                next: () => {
                    this.snackBar.open('Actualizado correctamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    console.error('Error updating:', err);
                    this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
                    this.saving = false;
                }
            });
        } else {
            this.tipoAsistenciaService.create({ tipo: tipoValue }).subscribe({
                next: () => {
                    this.snackBar.open('Creado correctamente', 'Cerrar', { duration: 3000 });
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    console.error('Error creating:', err);
                    this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000 });
                    this.saving = false;
                }
            });
        }
    }
}
