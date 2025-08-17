import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

interface ConfirmDeleteData {
  tarjeta: {
    id: number;
    rfid: number;
    codigo: string;
    alumnoNombre?: string;
  };
}

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="confirm-delete-modal">
      <div class="modal-header">
        <div class="header-icon">
          <mat-icon>warning</mat-icon>
        </div>
        <h2 mat-dialog-title>Confirmar eliminación</h2>
        <button 
          mat-icon-button 
          class="close-button" 
          (click)="onCancel()"
          matTooltip="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="modal-content">
        <div class="warning-message">
          <p>¿Está seguro de que desea eliminar esta tarjeta?</p>
        </div>

        <div class="tarjeta-info">
          <div class="info-row">
            <span class="label">Código:</span>
            <span class="value">{{ data.tarjeta.codigo }}</span>
          </div>
          <div class="info-row">
            <span class="label">RFID:</span>
            <span class="value">{{ data.tarjeta.rfid | number : '1.0-0' }}</span>
          </div>
          <div class="info-row" *ngIf="data.tarjeta.alumnoNombre">
            <span class="label">Asignada a:</span>
            <span class="value alumno-name">{{ data.tarjeta.alumnoNombre }}</span>
          </div>
          <div class="info-row" *ngIf="!data.tarjeta.alumnoNombre">
            <span class="label">Estado:</span>
            <span class="value disponible">Sin asignar</span>
          </div>
        </div>

        <div class="warning-note">
          <mat-icon>info</mat-icon>
          <span>Esta acción no se puede deshacer.</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="modal-actions">
        <button 
          mat-button 
          class="cancel-button"
          (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="warn"
          class="delete-button"
          (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          Eliminar Tarjeta
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-delete-modal {
      width: 100%;
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 20px 24px 10px 24px;
      border-bottom: 1px solid #e0e0e0;
      position: relative;
    }

    .header-icon {
      background: #fff3e0;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      color: #ff9800;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    h2 {
      margin: 0;
      flex: 1;
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #666;
    }

    .modal-content {
      padding: 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .warning-message {
      margin-bottom: 20px;
    }

    .warning-message p {
      font-size: 16px;
      color: #333;
      margin: 0;
      font-weight: 500;
    }

    .tarjeta-info {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      border-left: 4px solid #ff9800;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 4px 0;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }

    .value {
      font-weight: 500;
      color: #333;
      font-size: 14px;
      font-family: monospace;
    }

    .alumno-name {
      color: #1976d2;
      font-family: inherit;
      max-width: 200px;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .disponible {
      color: #4caf50;
      font-family: inherit;
    }

    .warning-note {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 4px solid #f44336;
      margin-top: 20px;
    }

    .warning-note mat-icon {
      color: #f44336;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .warning-note span {
      font-size: 13px;
      color: #d32f2f;
      font-weight: 500;
    }

    .modal-actions {
      padding: 16px 24px 24px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-button {
      color: #666;
      border: 1px solid #ddd;
      background: white;
      padding: 8px 20px;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      background: #f5f5f5;
      border-color: #bbb;
    }

    .delete-button {
      background: #f44336;
      color: white;
      padding: 8px 24px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
    }

    .delete-button:hover {
      background: #d32f2f;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
    }

    .cancel-button mat-icon,
    .delete-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 6px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .confirm-delete-modal {
        max-width: 90vw;
      }

      .modal-header {
        padding: 16px 20px 8px 20px;
      }

      .header-icon {
        width: 40px;
        height: 40px;
      }

      .header-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      h2 {
        font-size: 18px;
      }

      .modal-content {
        padding: 20px;
      }

      .tarjeta-info {
        padding: 12px;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .value {
        align-self: flex-end;
      }

      .modal-actions {
        padding: 12px 20px 20px 20px;
        flex-direction: column-reverse;
        gap: 8px;
      }

      .cancel-button,
      .delete-button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ConfirmDeleteModalComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}