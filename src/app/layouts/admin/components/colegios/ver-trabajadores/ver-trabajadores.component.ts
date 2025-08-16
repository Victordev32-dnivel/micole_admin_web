import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-ver-trabajadores',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatToolbar,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ver-trabajadores.component.html',
  styleUrls: ['./ver-trabajadores.component.css'],
})
export class VerTrabajadoresComponent {
  displayedColumns: string[] = [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
    'actions',
  ];
  trabajadoresDesasignados: any[] = [];
  trabajadoresAsignados: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<VerTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { colegioId: number; trabajadoresAsignados: any[] },
    private http: HttpClient
  ) {
    this.trabajadoresAsignados = data.trabajadoresAsignados.filter(
      (t) => t.idColegio === data.colegioId
    );
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onDesasignar(trabajador: any) {
    if (!this.trabajadoresDesasignados.includes(trabajador)) {
      this.trabajadoresDesasignados.push(trabajador);
    }
  }

  onRemove(trabajador: any) {
    this.trabajadoresDesasignados = this.trabajadoresDesasignados.filter(
      (t) => t !== trabajador
    );
  }

  onConfirm() {
    if (this.trabajadoresDesasignados.length === 0) {
      this.error = 'Seleccione al menos un trabajador para desasignar';
      return;
    }

    this.loading = true;
    this.error = null;

    const requests = this.trabajadoresDesasignados.map((trabajador) => {
      const url = `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${trabajador.id}/colegio`;
      console.log(
        `Desasignando trabajador ID ${trabajador.id} con cuerpo: "0"`
      );
      return this.http.patch(url, '"0"', {
        headers: this.getHeaders(),
      });
    });

    Promise.all(requests.map((request) => request.toPromise()))
      .then((responses) => {
        console.log(
          'Respuestas de las solicitudes de desasignación:',
          responses
        );
        this.loading = false;
        this.dialogRef.close(this.trabajadoresDesasignados);
      })
      .catch((error) => {
        console.error('Error al desasignar trabajadores:', error);
        this.error = 'Error al desasignar los trabajadores. Intente de nuevo';
        this.loading = false;
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
