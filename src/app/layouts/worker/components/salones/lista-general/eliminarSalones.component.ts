import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-eliminar-salones',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Eliminar Salón</h2>
    <mat-dialog-content>
      ¿Estás seguro de que deseas eliminar el salón <strong>{{ data.nombre }}</strong> (ID: {{ data.id }})?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="warn" (click)="eliminarSalon()" [disabled]="loading">
        <span *ngIf="!loading">Eliminar</span>
        <span *ngIf="loading">Eliminando...</span>
      </button>
    </mat-dialog-actions>
  `,
})
export class EliminarSalonesComponent {
  loading = false;
  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private dialogRef: MatDialogRef<EliminarSalonesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {}

  private getHeaders() {
    const token = this.userService.getJwtToken() || '732612882';
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      responseType: 'json' as const
    };
  }

  eliminarSalon() {
    this.loading = true;
    const url = `${this.apiBase}/salon/${this.data.id}`; // Cambia a /seccion/ si es necesario

    this.http.delete(url, this.getHeaders()).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.dialogRef.close({ 
          success: true,
          message: 'Salón eliminado correctamente'
        });
      },
      error: (err) => {
        console.error('Error completo:', err);
        let errorMessage = 'Error al eliminar el salón';
        
        if (err.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage = `Error: ${err.error.message}`;
        } else {
          // Error del servidor
          errorMessage = err.error?.message || err.message || errorMessage;
        }

        this.dialogRef.close({ 
          success: false, 
          error: errorMessage 
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}