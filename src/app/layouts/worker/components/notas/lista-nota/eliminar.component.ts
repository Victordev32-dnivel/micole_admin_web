import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface DeleteNotaData {
  nota: {
    id: number;
    nombre: string;
    link: string;
  };
}

@Component({
  selector: 'app-delete-nota-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="delete-modal">
      <div class="modal-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirmar Eliminación</h2>
      </div>
      
      <mat-dialog-content class="modal-content">
        <div class="warning-message">
          <p class="main-message">
            ¿Está seguro de que desea eliminar la siguiente nota?
          </p>
          
          <div class="nota-info">
            <mat-icon>description</mat-icon>
            <div class="nota-details">
              <strong>{{ data.nota.nombre }}</strong>
            </div>
          </div>
          
          <div class="warning-text">
            <mat-icon class="small-icon">info</mat-icon>
            <span>Esta acción no se puede deshacer.</span>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="modal-actions">
        <button 
          mat-button 
          (click)="onCancel()" 
          class="cancel-btn"
          [disabled]="isDeleting">
          Cancelar
        </button>
        
        <button 
          mat-raised-button 
          color="warn" 
          (click)="onConfirmDelete()" 
          class="delete-btn"
          [disabled]="isDeleting">
          <mat-spinner 
            *ngIf="isDeleting" 
            diameter="20" 
            class="loading-spinner">
          </mat-spinner>
          <mat-icon *ngIf="!isDeleting">delete</mat-icon>
          {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-modal {
      max-width: 500px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding: 8px 0;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }

    .modal-content {
      padding: 0 0 16px 0;
    }

    .warning-message {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .main-message {
      font-size: 16px;
      margin: 0;
      color: #555;
      line-height: 1.5;
    }

    .nota-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .nota-info mat-icon {
      color: #2196F3;
      margin-top: 2px;
    }

    .nota-details {
      flex: 1;
    }

    .nota-details strong {
      display: block;
      font-size: 16px;
      color: #333;
      word-break: break-word;
    }

    .warning-text {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      color: #856404;
    }

    .small-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding: 16px 0 0 0;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      color: #666;
      border: 1px solid #ddd;
    }

    .cancel-btn:hover:not(:disabled) {
      background-color: #f5f5f5;
    }

    .delete-btn {
      background-color: #f44336 !important;
      color: white !important;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      justify-content: center;
    }

    .delete-btn:hover:not(:disabled) {
      background-color: #d32f2f !important;
    }

    .delete-btn:disabled {
      background-color: #ffcdd2 !important;
      color: rgba(0, 0, 0, 0.38) !important;
    }

    .loading-spinner {
      color: white !important;
    }

    .loading-spinner ::ng-deep circle {
      stroke: white;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .delete-modal {
        max-width: 95vw;
      }
      
      .modal-actions {
        flex-direction: column-reverse;
        gap: 8px;
      }
      
      .modal-actions button {
        width: 100%;
      }
    }
  `]
})
export class DeleteNotaModalComponent {
  isDeleting = false;

  constructor(
    public dialogRef: MatDialogRef<DeleteNotaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteNotaData,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  onCancel(): void {
    if (this.isDeleting) return;
    this.dialogRef.close(false);
  }

  onConfirmDelete(): void {
    if (this.isDeleting) return;
    
    this.isDeleting = true;
    this.deleteNota();
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  private deleteNota(): void {
    const notaId = this.data.nota.id;
    
    this.http
      .delete(
        `https://proy-back-dnivel-44j5.onrender.com/api/nota/${notaId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
      
          
          this.snackBar.open('✅ Nota eliminada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
          
          this.isDeleting = false;
          this.dialogRef.close(true); // Devuelve true para indicar éxito
        },
        error: (error) => {
          console.error('Error al eliminar nota:', error);
          this.isDeleting = false;
          
          let errorMessage = 'Error al eliminar la nota';
          
          if (error.status === 404) {
            errorMessage = 'La nota no fue encontrada';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para eliminar esta nota';
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Verifique su internet';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
          
          this.dialogRef.close(false);
        },
      });
  }
}