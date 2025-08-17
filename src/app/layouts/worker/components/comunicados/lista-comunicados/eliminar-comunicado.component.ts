// Archivo: eliminar-comunicado.component.ts
// Ubicación: D:\WEB_DNIVELAZO\micole_admin_web\src\app\layouts\worker\components\comunicados\lista-comunicados\eliminar-comunicado.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

interface DialogData {
  comunicado: {
    id: number;
    nombre: string;
    tipo: 'general' | 'salon';
  };
  endpoint: string;
}

@Component({
  selector: 'app-eliminar-comunicado',
  template: `
    <div class="eliminar-dialog">
      <h2 mat-dialog-title>
        <mat-icon class="warning-icon">warning</mat-icon>
        Confirmar Eliminación
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <div *ngIf="!eliminando" class="confirmation-message">
          <p><strong>¿Está seguro de que desea eliminar este comunicado?</strong></p>
          
          <div class="comunicado-info">
            <div class="info-row">
              <mat-icon>{{data.comunicado.tipo === 'general' ? 'public' : 'meeting_room'}}</mat-icon>
              <span><strong>Tipo:</strong> {{data.comunicado.tipo === 'general' ? 'Anuncio General' : 'Anuncio por Salón'}}</span>
            </div>
            <div class="info-row">
              <mat-icon>title</mat-icon>
              <span><strong>Nombre:</strong> {{data.comunicado.nombre}}</span>
            </div>
            <div class="info-row">
              <mat-icon>link</mat-icon>
              <span><strong>API Endpoint:</strong> {{data.endpoint}}</span>
            </div>
          </div>
          
          <div class="warning-message">
            <mat-icon>info</mat-icon>
            <span>Esta acción no se puede deshacer.</span>
          </div>
        </div>

        <div *ngIf="eliminando" class="loading-message">
          <mat-progress-spinner 
            mode="indeterminate" 
            diameter="40">
          </mat-progress-spinner>
          <p>Eliminando comunicado...</p>
        </div>

        <div *ngIf="error" class="error-message">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{error}}</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          [disabled]="eliminando">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        
        <button 
          mat-raised-button 
          color="warn" 
          (click)="onConfirmDelete()"
          [disabled]="eliminando">
          <mat-icon>delete_forever</mat-icon>
          {{eliminando ? 'Eliminando...' : 'Eliminar'}}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .eliminar-dialog {
      min-width: 450px;
      max-width: 600px;
    }

    .dialog-content {
      padding: 20px;
    }

    .confirmation-message {
      text-align: center;
    }

    .comunicado-info {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid #ff9800;
    }

    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .warning-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #ff5722;
      font-weight: 500;
      margin-top: 16px;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .loading-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background-color: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
    }

    .error-icon {
      color: #f44336;
    }

    .dialog-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 120px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class EliminarComunicadoComponent implements OnInit {
  eliminando = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EliminarComunicadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('Datos recibidos para eliminar:', this.data);
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  onConfirmDelete(): void {
    this.eliminando = true;
    this.error = null;

    console.log('🔥 ELIMINANDO CON NUEVA API:', this.data.endpoint);

    // ✅ USANDO LA NUEVA API: https://proy-back-dnivel-44j5.onrender.com/{id}
    this.http
      .delete(this.data.endpoint, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Comunicado eliminado exitosamente:', response);
          this.eliminando = false;
          
          this.snackBar.open('✅ Comunicado eliminado exitosamente', 'Cerrar', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });

          // Cerrar modal con éxito
          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          console.error('❌ Error al eliminar comunicado:', error);
          this.eliminando = false;
          
          let errorMessage = 'Error al eliminar el comunicado';
          
          if (error.status === 404) {
            errorMessage = 'El comunicado no fue encontrado';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para eliminar este comunicado';
          } else if (error.status === 0) {
            errorMessage = 'Error de conexión. Verifique su conexión a internet';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.error = errorMessage;
          
          this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
}