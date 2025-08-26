import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../services/UserData';

interface SocioData {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  contrasena: string;
  idColegios: number[];
  nomColegios: string[];
}

interface DialogData {
  socio: SocioData;
  apiUrl: string;
}

@Component({
  selector: 'app-eliminar-socio',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="eliminar-socio-dialog">
      <!-- Header del diálogo -->
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirmar Eliminación</h2>
      </div>

      <!-- Contenido principal -->
      <div class="dialog-content" *ngIf="!loading">
        <div class="socio-info">
          <p class="main-message">
            ¿Está seguro de que desea eliminar el siguiente socio?
          </p>
          
          <div class="socio-details">
            <div class="detail-row">
              <span class="label">Nombre:</span>
              <span class="value">{{ data.socio.nombre }} {{ data.socio.apellidos }}</span>
            </div>
            <div class="detail-row">
              <span class="label">DNI:</span>
              <span class="value">{{ data.socio.dni || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Teléfono:</span>
              <span class="value">{{ data.socio.telefono || 'N/A' }}</span>
            </div>
            <div class="detail-row" *ngIf="data.socio.nomColegios?.length">
              <span class="label">Colegios:</span>
              <span class="value">{{ data.socio.nomColegios.join(', ') }}</span>
            </div>
          </div>

          <div class="warning-message">
            <mat-icon class="warning-icon-small">info</mat-icon>
            <span>Esta acción no se puede deshacer</span>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div class="dialog-content loading-content" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p class="loading-text">Eliminando socio...</p>
      </div>

      <!-- Botones de acción -->
      <div class="dialog-actions" *ngIf="!loading">
        <button
          mat-button
          color="basic"
          (click)="onCancel()"
          class="cancel-button"
        >
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        
        <button
          mat-raised-button
          color="warn"
          (click)="onConfirmDelete()"
          class="delete-button"
        >
          <mat-icon>delete</mat-icon>
          Eliminar Socio
        </button>
      </div>

      <!-- Botón de cerrar cuando está cargando -->
      <div class="dialog-actions" *ngIf="loading">
        <button
          mat-button
          disabled
          class="loading-button"
        >
          <mat-spinner diameter="20"></mat-spinner>
          Eliminando...
        </button>
      </div>
    </div>
  `,
  styles: [`
    .eliminar-socio-dialog {
      padding: 0;
      min-width: 450px;
      max-width: 600px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #fff3e0;
    }

    .dialog-header h2 {
      margin: 0 0 0 12px;
      font-size: 20px;
      font-weight: 500;
      color: #e65100;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-content {
      padding: 24px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 24px;
    }

    .loading-text {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .socio-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .main-message {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #333;
      text-align: center;
    }

    .socio-details {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #ff9800;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .label {
      font-weight: 500;
      color: #666;
      min-width: 80px;
    }

    .value {
      color: #333;
      font-weight: 400;
      text-align: right;
      flex: 1;
      margin-left: 16px;
    }

    .warning-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background-color: #fff3e0;
      border-radius: 6px;
      border: 1px solid #ffcc02;
    }

    .warning-icon-small {
      color: #ff9800;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .warning-message span {
      color: #e65100;
      font-size: 14px;
      font-weight: 500;
    }

    .dialog-actions {
      padding: 16px 24px 24px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #e0e0e0;
      background-color: #fafafa;
    }

    .cancel-button {
      color: #666;
    }

    .cancel-button:hover {
      background-color: #f5f5f5;
    }

    .delete-button {
      background-color: #f44336;
      color: white;
    }

    .delete-button:hover {
      background-color: #d32f2f;
    }

    .loading-button {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .loading-button mat-spinner {
      margin-right: 4px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .eliminar-socio-dialog {
        min-width: 300px;
        max-width: 90vw;
      }

      .dialog-header,
      .dialog-content,
      .dialog-actions {
        padding-left: 16px;
        padding-right: 16px;
      }

      .dialog-actions {
        flex-direction: column;
      }

      .detail-row {
        flex-direction: column;
        gap: 4px;
      }

      .value {
        text-align: left;
        margin-left: 0;
      }
    }
  `]
})
export class EliminarSocioComponent implements OnDestroy {
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<EliminarSocioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    console.log('🗑️ EliminarSocioComponent iniciado con datos:', data);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja la cancelación del diálogo
   */
  public onCancel(): void {
    console.log('❌ Eliminación cancelada por el usuario');
    this.dialogRef.close('cancelled');
  }

  /**
   * Confirma y ejecuta la eliminación del socio
   */
  public onConfirmDelete(): void {
    console.log('🔄 Iniciando eliminación del socio:', this.data.socio.id);
    
    if (!this.data.socio.id) {
      console.error('❌ ID del socio no disponible');
      this.snackBar.open('❌ Error: ID del socio no disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      this.dialogRef.close('error');
      return;
    }

    this.loading = true;
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/${this.data.socio.id}`;
    
    console.log('🌐 Llamando a API DELETE:', url);

    this.http
      .delete(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Socio eliminado exitosamente:', response);
          this.loading = false;
          
          this.snackBar.open(
            `✅ ${this.data.socio.nombre} ${this.data.socio.apellidos} eliminado correctamente`, 
            'Cerrar', 
            {
              duration: 4000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
              panelClass: ['success-snackbar']
            }
          );
          
          // Cerrar el diálogo con éxito
          this.dialogRef.close('deleted');
        },
        error: (error) => {
          console.error('❌ Error al eliminar socio:', error);
          this.loading = false;
          
          let errorMessage = 'Error al eliminar el socio';
          
          if (error.status === 404) {
            errorMessage = 'El socio no fue encontrado';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para eliminar este socio';
          } else if (error.status === 401) {
            errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Verifique su internet';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          
          // Cerrar el diálogo con error
          this.dialogRef.close('error');
        },
      });
  }

  /**
   * Genera los headers HTTP con autenticación
   */
  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    console.log('🔑 Token para eliminar socio:', jwtToken ? 'Presente' : 'Ausente');
    
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken || '732612882'}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }
}