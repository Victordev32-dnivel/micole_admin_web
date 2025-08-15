import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-confirmation-delete',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirmation-delete.component.html',
  styleUrls: ['./confirmation-delete.component.css'],
})
export class ConfirmationDeleteComponent {
  trabajadorId: number;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; message: string },
    private http: HttpClient
  ) {
    this.trabajadorId = data.id;
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
        `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`,
        {
          headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al eliminar trabajador:', error);
          this.error = 'Error al eliminar el trabajador. Intente de nuevo';
          this.loading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
