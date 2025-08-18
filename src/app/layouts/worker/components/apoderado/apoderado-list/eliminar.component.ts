import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface DialogData {
  id: number;
  message: string;
  apoderado?: any; // Datos del apoderado para mostrar info adicional
}

@Component({
  selector: 'app-eliminar-apoderado',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="delete-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirmar Eliminación</h2>
      </div>

      <mat-dialog-content class="dialog-content">
        <p class="warning-message">{{ data.message }}</p>
        
        <div *ngIf="apoderadoInfo" class="apoderado-info">
          <h4>Información del apoderado a eliminar:</h4>
          <div class="info-grid">
            <div class="info-item">
              <strong>Nombre:</strong>
              <span>{{ getApoderadoNombre() }}</span>
            </div>
            <div class="info-item">
              <strong>Apellidos:</strong>
              <span>{{ getApoderadoApellidos() }}</span>
            </div>
            <div class="info-item">
              <strong>DNI:</strong>
              <span>{{ getApoderadoDni() }}</span>
            </div>
            <div class="info-item">
              <strong>Teléfono:</strong>
              <span>{{ getApoderadoTelefono() }}</span>
            </div>
          </div>
        </div>

        <div class="warning-note">
          <mat-icon>info</mat-icon>
          <p>
            <strong>Nota:</strong> Esta acción no se puede deshacer. 
            El apoderado será eliminado permanentemente del sistema.
          </p>
        </div>

        <div *ngIf="error" class="error-message">
          <mat-icon>error</mat-icon>
          <span>{{ error }}</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button
          mat-button
          type="button"
          (click)="onCancel()"
          [disabled]="deleting"
          class="cancel-button"
        >
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>

        <button
          mat-raised-button
          color="warn"
          (click)="onConfirm()"
          [disabled]="deleting"
          class="delete-button"
        >
          <mat-spinner
            *ngIf="deleting"
            diameter="20"
            class="button-spinner"
          ></mat-spinner>
          <mat-icon *ngIf="!deleting">delete_forever</mat-icon>
          {{ deleting ? 'Eliminando...' : 'Eliminar Apoderado' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .delete-dialog {
        width: 100%;
        max-width: 500px;
        padding: 0;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px 24px 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        background-color: #fff3e0;
      }

      .warning-icon {
        color: #ff9800;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .dialog-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
        color: #333;
      }

      .dialog-content {
        padding: 24px;
      }

      .warning-message {
        font-size: 1.1rem;
        margin-bottom: 20px;
        color: #333;
        text-align: center;
        font-weight: 500;
      }

      .apoderado-info {
        background-color: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #2196f3;
      }

      .apoderado-info h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 1rem;
        font-weight: 600;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item strong {
        color: #666;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .info-item span {
        color: #333;
        font-weight: 500;
      }

      .warning-note {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background-color: #fff3cd;
        padding: 16px;
        border-radius: 8px;
        margin: 20px 0;
        border-left: 4px solid #ffc107;
      }

      .warning-note mat-icon {
        color: #856404;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .warning-note p {
        margin: 0;
        color: #856404;
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #f8d7da;
        padding: 12px;
        border-radius: 6px;
        margin: 16px 0;
        border-left: 4px solid #dc3545;
      }

      .error-message mat-icon {
        color: #721c24;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .error-message span {
        color: #721c24;
        font-size: 0.95rem;
      }

      .dialog-actions {
        padding: 16px 24px 24px 24px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        background-color: #fafafa;
      }

      .cancel-button {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
      }

      .cancel-button:hover {
        background-color: #f5f5f5;
      }

      .delete-button {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 160px;
        justify-content: center;
        background-color: #dc3545;
        color: white;
      }

      .delete-button:hover:not([disabled]) {
        background-color: #c82333;
      }

      .delete-button[disabled] {
        background-color: #d6d8db;
        color: #6c757d;
      }

      .button-spinner {
        margin-right: 8px;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .delete-dialog {
          max-width: 100vw;
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
        }

        .dialog-header {
          padding: 16px;
        }

        .dialog-header h2 {
          font-size: 1.3rem;
        }

        .dialog-content {
          padding: 16px;
        }

        .dialog-actions {
          padding: 16px;
          flex-direction: column-reverse;
        }

        .cancel-button,
        .delete-button {
          width: 100%;
          justify-content: center;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EliminarApoderadoComponent implements OnInit {
  deleting: boolean = false;
  error: string | null = null;
  apoderadoInfo: any = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EliminarApoderadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit() {
    // Si se proporcionó información del apoderado, la usamos
    if (this.data.apoderado) {
      this.apoderadoInfo = this.data.apoderado;
    } else {

    }

   
  }

  // Métodos auxiliares para obtener datos del apoderado de forma segura
  getApoderadoNombre(): string {
    if (!this.apoderadoInfo) return 'N/A';
    return this.apoderadoInfo.nombre || 
           this.apoderadoInfo.nombres || 
           'N/A';
  }

  getApoderadoApellidos(): string {
    if (!this.apoderadoInfo) return 'N/A';
    return this.apoderadoInfo.apellidos || 
           `${this.apoderadoInfo.apellidoPaterno || ''} ${this.apoderadoInfo.apellidoMaterno || ''}`.trim() || 
           'N/A';
  }

  getApoderadoDni(): string {
    if (!this.apoderadoInfo) return 'N/A';
    return this.apoderadoInfo.dni || 
           this.apoderadoInfo.numeroDocumento || 
           'N/A';
  }

  getApoderadoTelefono(): string {
    if (!this.apoderadoInfo) return 'N/A';
    return this.apoderadoInfo.telefono || 'N/A';
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onCancel() {
    if (this.deleting) {
      return; // No permitir cancelar si está eliminando
    }
  
    this.dialogRef.close(false);
  }

  onConfirm() {
    if (this.deleting) {
      return; // Evitar múltiples clicks
    }

    this.deleteApoderado();
  }

  private deleteApoderado() {
    this.deleting = true;
    this.error = null;

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/apoderado/${this.data.id}`;
  

    // Configurar headers para aceptar texto plano también
    const headers = new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*'
    });

    this.http.delete(url, { 
      headers: headers,
      responseType: 'text' as 'json' // Tratar respuesta como texto
    }).subscribe({
      next: (response) => {
       

        // La respuesta es texto, no JSON
        const message = response && response.toString().includes('eliminó') 
          ? '✅ Apoderado eliminado correctamente' 
          : '✅ Apoderado eliminado correctamente';

        this.snackBar.open(message, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });

        this.deleting = false;
        this.dialogRef.close(true); // Cerrar con éxito
      },
      error: (error) => {
        console.error('❌ Error al eliminar apoderado:', error);
        this.deleting = false;

        let errorMessage = 'Error al eliminar el apoderado';

        // Manejo específico de errores HTTP
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud inválida. El apoderado no puede ser eliminado';
            break;
          case 401:
            errorMessage = 'No autorizado para eliminar este apoderado';
            break;
          case 403:
            errorMessage = 'Acceso denegado. Sin permisos para eliminar';
            break;
          case 404:
            errorMessage = 'Apoderado no encontrado. Puede que ya haya sido eliminado';
            break;
          case 409:
            errorMessage = 'No se puede eliminar. El apoderado tiene estudiantes asociados';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Intente más tarde';
            break;
          default:
            // Si el error tiene un mensaje de texto, usarlo
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
        }

        this.error = errorMessage;

        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
          duration: 6000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });
      },
    });
  }
}