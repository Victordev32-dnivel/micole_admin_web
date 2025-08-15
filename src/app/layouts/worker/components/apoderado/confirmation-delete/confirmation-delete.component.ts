import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-confirmation-delete',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirmation-delete.component.html',
  styleUrls: ['./confirmation-delete.component.css'],
})
export class ConfirmationDeleteComponent {
  loading = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; message: string },
    private http: HttpClient
  ) {}

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
        `https://proy-back-dnivel-44j5.onrender.com/api/colegio/${this.data.id}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.error = `Error al eliminar: ${error.status} - ${error.statusText}. ${error.message}`;
          this.loading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
