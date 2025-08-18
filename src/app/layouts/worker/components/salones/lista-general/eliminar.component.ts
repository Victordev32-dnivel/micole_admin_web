import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

export interface EliminarData {
  tipo: 'niveles' | 'secciones' | 'grados' | 'salones';
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-eliminar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="eliminar-container">
      <div class="header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirmar eliminación</h2>
      </div>

      <div mat-dialog-content class="content">
        <p>¿Estás seguro de que deseas eliminar este elemento?</p>
        <div class="item-info">
          <strong>{{ getTipoSingular() }}:</strong> {{ data.nombre }}
          <small>(ID: {{ data.id }})</small>
        </div>
        <p class="warning-text">
          Esta acción no se puede deshacer.
        </p>
      </div>

      <div mat-dialog-actions class="actions">
        <button 
          mat-button 
          (click)="cancelar()"
          [disabled]="eliminando"
          class="btn-cancelar"
        >
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="warn"
          (click)="confirmarEliminacion()"
          [disabled]="eliminando"
          class="btn-eliminar"
        >
          <mat-spinner *ngIf="eliminando" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!eliminando">delete</mat-icon>
          {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .eliminar-container {
      padding: 0;
      max-width: 450px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .warning-icon {
      color: #ff9800;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .content {
      padding: 20px 24px;
    }

    .content p {
      margin: 0 0 16px 0;
      color: #555;
      font-size: 1rem;
      line-height: 1.5;
    }

    .item-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      margin: 16px 0;
      border-left: 4px solid #2196f3;
    }

    .item-info small {
      display: block;
      color: #666;
      margin-top: 4px;
      font-size: 0.85rem;
    }

    .warning-text {
      color: #d32f2f !important;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px;
      border-top: 1px solid #e0e0e0;
      margin: 0;
    }

    .btn-cancelar {
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-eliminar {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      justify-content: center;
    }

    .btn-eliminar:disabled {
      opacity: 0.7;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class EliminarComponent {
  eliminando = false;
  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    public dialogRef: MatDialogRef<EliminarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EliminarData,
    private http: HttpClient,
    private userService: UserService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getTipoSingular(): string {
    switch (this.data.tipo) {
      case 'niveles':
        return 'Nivel';
      case 'secciones':
        return 'Sección';
      case 'grados':
        return 'Grado';
      case 'salones':
        return 'Salón';
      default:
        return 'Elemento';
    }
  }

  private getApiEndpoint(): string {
    switch (this.data.tipo) {
      case 'niveles':
        return `${this.apiBase}/nivel/${this.data.id}`;
      case 'secciones':
        return `${this.apiBase}/seccion/${this.data.id}`;
      case 'grados':
        return `${this.apiBase}/grado/${this.data.id}`;
      case 'salones':
        return `${this.apiBase}/salon/${this.data.id}`;
      default:
        throw new Error(`Tipo no soportado: ${this.data.tipo}`);
    }
  }

  confirmarEliminacion(): void {
    this.eliminando = true;
    const url = this.getApiEndpoint();
    
    console.log(`🗑️ Intentando eliminar ${this.data.tipo} con ID: ${this.data.id}`);
    console.log(`📍 URL: ${url}`);
    console.log(`🔑 Token: ${this.userService.getJwtToken()?.substring(0, 20)}...`);

    // Primero intentamos con observe: 'response' para capturar toda la respuesta HTTP
    this.http.delete(url, { 
      headers: this.getHeaders(),
      observe: 'response',
      responseType: 'text'
    }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa:', response);
        console.log('📊 Status:', response.status);
        console.log('📄 Body:', response.body);
        
        if (response.status === 200 || response.status === 204) {
          const message = response.body === 'Se elimino' || response.body === 'Se eliminó' || !response.body
            ? `${this.getTipoSingular()} eliminado correctamente`
            : response.body;
            
          this.dialogRef.close({ 
            success: true, 
            message: message 
          });
        } else {
          throw new Error(`Status inesperado: ${response.status}`);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('❌ Error completo:', error);
        console.error('📊 Status:', error.status);
        console.error('📄 Error message:', error.message);
        console.error('🔍 Error details:', error.error);
        
        let errorMessage = 'Error al eliminar el elemento';
        
        switch (error.status) {
          case 0:
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            break;
          case 401:
            errorMessage = 'No autorizado. Token inválido.';
            break;
          case 403:
            errorMessage = 'No tienes permisos para eliminar este elemento';
            break;
          case 404:
            errorMessage = 'El elemento no fue encontrado';
            break;
          case 409:
            errorMessage = 'No se puede eliminar porque tiene elementos relacionados';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            // Intentar extraer mensaje del error
            if (error.error) {
              if (typeof error.error === 'string') {
                errorMessage = error.error;
              } else if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              }
            }
        }

        this.dialogRef.close({ 
          success: false, 
          error: errorMessage 
        });
      },
      complete: () => {
        this.eliminando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}