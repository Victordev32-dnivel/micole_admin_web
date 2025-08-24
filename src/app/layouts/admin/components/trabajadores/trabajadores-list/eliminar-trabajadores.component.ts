import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface EliminarTrabajadorData {
  id: number;
  message: string;
  trabajador?: any;
}

@Component({
  selector: 'app-eliminar-trabajador',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2>Confirmar Eliminación</h2>
      </div>
      
      <div class="dialog-content">
        <p class="confirmation-message">{{ data.message }}</p>
        
        <div class="trabajador-details" *ngIf="data.trabajador">
          <div class="detail-row">
            <strong>ID:</strong> {{ data.trabajador.id }}
          </div>
          <div class="detail-row">
            <strong>Nombre:</strong> {{ data.trabajador.nombre }} {{ data.trabajador.apellidoPaterno }} {{ data.trabajador.apellidoMaterno }}
          </div>
          <div class="detail-row">
            <strong>DNI:</strong> {{ data.trabajador.dni }}
          </div>
          <div class="detail-row">
            <strong>Teléfono:</strong> {{ data.trabajador.telefono }}
          </div>
        </div>
        
        <div class="warning-text">
          <mat-icon class="small-warning">info</mat-icon>
          <span>Esta acción no se puede deshacer.</span>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()" 
          [disabled]="deleting"
          class="cancel-button">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="warn" 
          (click)="onConfirm()" 
          [disabled]="deleting"
          class="confirm-button">
          <mat-spinner *ngIf="deleting" diameter="16" class="spinner"></mat-spinner>
          <mat-icon *ngIf="!deleting">delete</mat-icon>
          {{ deleting ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      max-width: 500px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #fff5f5;
    }

    .warning-icon {
      color: #f44336;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .dialog-content {
      padding: 24px;
    }

    .confirmation-message {
      font-size: 1rem;
      margin-bottom: 20px;
      color: #555;
      line-height: 1.5;
    }

    .trabajador-details {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid #2196f3;
    }

    .detail-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-row strong {
      min-width: 80px;
      color: #333;
      margin-right: 8px;
    }

    .warning-text {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 0.875rem;
      color: #856404;
    }

    .small-warning {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff9800;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 20px;
      border-top: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .cancel-button {
      color: #666;
      border: 1px solid #ddd;
      background-color: white;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
    }

    .cancel-button:hover {
      background-color: #f5f5f5;
    }

    .confirm-button {
      background-color: #f44336;
      color: white;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .confirm-button:hover:not(:disabled) {
      background-color: #d32f2f;
    }

    .confirm-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      margin-right: 4px;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .dialog-container {
        max-width: 90vw;
      }
      
      .dialog-header {
        padding: 16px 20px 12px;
      }
      
      .dialog-content {
        padding: 20px;
      }
      
      .dialog-actions {
        padding: 12px 20px 16px;
        flex-direction: column;
      }
      
      .dialog-actions button {
        width: 100%;
        margin: 4px 0;
      }
      
      .detail-row {
        flex-direction: column;
        gap: 4px;
      }
      
      .detail-row strong {
        min-width: unset;
      }
    }
  `]
})
export class EliminarTrabajadorComponent implements OnInit {
  deleting: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EliminarTrabajadorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EliminarTrabajadorData,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Configurar el diálogo para que no se cierre al hacer clic fuera
    this.dialogRef.disableClose = true;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onCancel(): void {
    if (!this.deleting) {
      this.dialogRef.close(false);
    }
  }

  onConfirm(): void {
    if (this.deleting) return;

    this.deleting = true;
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.data.id}`;

    console.log('Eliminando trabajador:', this.data.id);
    console.log('URL:', url);

    this.http.delete(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        console.log('Trabajador eliminado exitosamente:', response);
        
        this.snackBar.open('✅ Trabajador eliminado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        
        this.deleting = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar trabajador:', error);
        
        let errorMessage = 'Error al eliminar el trabajador';
        
        if (error.status === 404) {
          errorMessage = 'El trabajador no existe o ya fue eliminado';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para eliminar este trabajador';
        } else if (error.status === 409) {
          errorMessage = 'No se puede eliminar: el trabajador tiene datos asociados';
        } else if (error.status === 0) {
          errorMessage = 'Error de conexión. Verifique su internet';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center'
        });
        
        this.deleting = false;
      }
    });
  }
}