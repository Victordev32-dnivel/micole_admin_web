import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirmation-delete',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './confirmation-delete.component.html',
  styleUrls: ['./confirmation-delete.component.css'],
})
export class ConfirmationDeleteComponent {
  colegioId: number;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; message: string },
    private http: HttpClient
  ) {
    this.colegioId = data.id;
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onConfirm() {
    this.loading = true;
  
    this.http
      .delete(
        `https://proy-back-dnivel-44j5.onrender.com/api/colegio/${this.colegioId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
      
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al eliminar colegio:', error);
          this.error = `Error al eliminar el colegio: ${error.status} - ${error.statusText}. Detalle: ${error.message}`;
          this.loading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
