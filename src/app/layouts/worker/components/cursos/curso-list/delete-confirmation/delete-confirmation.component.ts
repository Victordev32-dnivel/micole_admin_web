import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-delete-confirmation',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
    template: `
    <h2 mat-dialog-title>Confirmar Eliminación</h2>
    <mat-dialog-content>
      <p>¿Estás seguro de que deseas eliminar el curso <strong>{{ data.curso.titulo }}</strong>?</p>
      <p class="warning-text">Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="warn" (click)="onYesClick()">
        <mat-icon>delete</mat-icon> Eliminar
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .warning-text {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: 10px;
    }
  `]
})
export class DeleteConfirmationComponent {
    constructor(
        public dialogRef: MatDialogRef<DeleteConfirmationComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(): void {
        this.dialogRef.close(true);
    }
}
