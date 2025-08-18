import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDeleteComponent } from '../confirmation-delete/confirmation-delete.component';
import { AddColegioComponent } from '../add-colegio/add-colegio.component';
import { EditColegioComponent } from '../edit-colegio/edit-colegio.component';
import { AsignarTrabajadoresComponent } from '../asignar-trabajadores/asignar-trabajadores.component';
import { VerTrabajadoresComponent } from '../ver-trabajadores/ver-trabajadores.component';

@Component({
  selector: 'app-colegio-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './colegio-list.component.html',
  styleUrls: ['./colegio-list.component.css'],
})
export class ColegioListComponent implements OnInit {
  colegios: any[] = [];
  filteredColegios: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  displayedColumns: string[] = [
    'id',
    'nombre',
    'direccion',
    'celular',
    'actions',
  ];
  searchTermControl = new FormControl('');

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadColegios();
    this.searchTermControl.valueChanges.subscribe((value) => {
      this.filterColegios(value || '');
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadColegios() {
    this.http
      .get<any>('https://proy-back-dnivel-44j5.onrender.com/api/colegio', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.colegios = response.data || [];
          this.filteredColegios = [...this.colegios];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar colegios:', error);
          this.error = 'Error al cargar los colegios. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  filterColegios(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        if (!term || term.trim() === '') {
          this.filteredColegios = [...this.colegios];
        } else {
          const searchTerm = term.toLowerCase().trim();
          this.filteredColegios = this.colegios.filter((colegio) => {
            const matchesName = colegio.nombre
              .toLowerCase()
              .includes(searchTerm);
            const matchesDireccion = colegio.direccion
              .toLowerCase()
              .includes(searchTerm);
            return matchesName || matchesDireccion;
          });
        }
       
        this.loading = false;
        this.cdr.detectChanges();
      }, 100);
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddColegioComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '23vw',
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }

  openEditDialog(id: number) {
    const dialogRef = this.dialog.open(EditColegioComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '25vw',
      panelClass: 'custom-dialog',
      data: { id, colegios: this.colegios },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }

  confirmDelete(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
      width: '20vw',
      maxWidth: '50vw',
      data: { id, message: '¿Estás seguro de eliminar este colegio?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }

  openAsignarTrabajadoresDialog(id: number) {
    const dialogRef = this.dialog.open(AsignarTrabajadoresComponent, {
      width: '60vw',
      maxWidth: '90vw',
      height: '70vh',
      panelClass: 'custom-dialog',
      data: { colegioId: id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.length > 0) {
        this.assignTrabajadores(id, result);
      }
    });
  }

  openVerTrabajadoresDialog(id: number) {
    const dialogRef = this.dialog.open(VerTrabajadoresComponent, {
      width: '60vw',
      maxWidth: '90vw',
      height: '70vh',
      panelClass: 'custom-dialog',
      data: {
        colegioId: id,
        trabajadoresAsignados: this.simulateAsignados(id),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
     
      }
    });
  }

  private simulateAsignados(colegioId: number) {
    return [
      {
        id: 1,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        dni: '12345678',
        telefono: '987654321',
      },
      {
        id: 2,
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Martínez',
        dni: '87654321',
        telefono: '123456789',
      },
    ].filter((t) => Math.random() > 0.5 || t.id % colegioId === 0);
  }

  private assignTrabajadores(colegioId: number, trabajadores: any[]) {
    const requests = trabajadores.map((trabajador) =>
      this.http.patch(
        `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${trabajador.id}`,
        `"${colegioId}"`,
        {
          headers: this.getHeaders(),
        }
      )
    );

    Promise.all(requests.map((request) => request.toPromise()))
      .then(() => {
        this.loadColegios(); // Recargar la lista después de asignar
      })
      .catch((error) => {
        console.error('Error al asignar trabajadores:', error);
        this.error = 'Error al asignar los trabajadores. Intente de nuevo';
        this.cdr.detectChanges();
      });
  }
}
