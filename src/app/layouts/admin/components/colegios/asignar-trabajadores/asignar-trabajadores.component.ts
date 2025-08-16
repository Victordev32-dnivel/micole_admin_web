import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-asignar-trabajadores',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './asignar-trabajadores.component.html',
  styleUrls: ['./asignar-trabajadores.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AsignarTrabajadoresComponent {
  trabajadores: any[] = [];
  filteredTrabajadores: any[] = [];
  selectedTrabajadores: any[] = [];
  searchTermControl = new FormControl('');
  displayedColumns: string[] = [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
    'actions',
  ];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AsignarTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { colegioId: number },
    private http: HttpClient
  ) {
    this.searchTermControl.valueChanges.subscribe((value) => {
      this.filterTrabajadores(value || '');
    });
  }

  ngOnInit() {
    this.loadTrabajadores();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadTrabajadores() {
    this.loading = true;
    this.error = null;
    this.http
      .get<any>('https://proy-back-dnivel-44j5.onrender.com/api/Trabajador', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.trabajadores = response
            .filter((t: any) => t.idColegio === 0) // Solo trabajadores libres
            .map((t: any) => ({
              id: t.idTrabajador,
              nombre: t.nombre,
              apellidoPaterno: t.apellidoPaterno,
              apellidoMaterno: t.apellidoMaterno,
              dni: t.dni,
              telefono: t.telefono,
            }));
          this.filteredTrabajadores = [...this.trabajadores];
          this.loading = false;
          this.filterTrabajadores(this.searchTermControl.value || '');
        },
        error: (error) => {
          console.error('Error al cargar trabajadores:', error);
          this.error = 'Error al cargar los trabajadores. Intente de nuevo';
          this.loading = false;
        },
      });
  }

  filterTrabajadores(term: string) {
    term = term.toLowerCase();
    this.filteredTrabajadores = this.trabajadores.filter(
      (trabajador) =>
        trabajador.nombre.toLowerCase().includes(term) ||
        trabajador.apellidoPaterno.toLowerCase().includes(term) ||
        trabajador.apellidoMaterno.toLowerCase().includes(term) ||
        trabajador.dni.toLowerCase().includes(term)
    );
  }

  onAsignar(trabajador: any) {
    if (!this.selectedTrabajadores.includes(trabajador)) {
      this.selectedTrabajadores.push(trabajador);
    }
  }

  onRemove(selectedTrabajador: any) {
    this.selectedTrabajadores = this.selectedTrabajadores.filter(
      (t) => t !== selectedTrabajador
    );
  }

  onConfirm() {
    if (this.selectedTrabajadores.length === 0) {
      this.error = 'Seleccione al menos un trabajador';
      return;
    }

    this.loading = true;
    this.error = null;

    const requests = this.selectedTrabajadores.map((trabajador) => {
      const url = `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${trabajador.id}/colegio`;
      console.log(
        `Asignando trabajador ID ${trabajador.id} a colegio ID ${this.data.colegioId}`
      );
      return this.http.patch(url, `"${this.data.colegioId}"`, {
        headers: this.getHeaders(),
      });
    });

    Promise.all(requests.map((request) => request.toPromise()))
      .then((responses) => {
        console.log('Respuestas de las solicitudes:', responses);
        this.loading = false;
        this.dialogRef.close(this.selectedTrabajadores);
      })
      .catch((error) => {
        console.error('Error al asignar trabajadores:', error);
        this.error = 'Error al asignar los trabajadores. Intente de nuevo';
        this.loading = false;
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
