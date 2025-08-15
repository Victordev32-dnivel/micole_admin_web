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
import { AddTrabajadoresComponent } from '../add-trabajadores/add-trabajador.component';
import { EditTrabajadoresComponent } from '../edit-trabajadores/edit-trabajadores.component';

@Component({
  selector: 'app-trabajadores-list',
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
  templateUrl: './trabajadores-list.component.html',
  styleUrls: ['./trabajadores-list.component.css'],
})
export class TrabajadoresListComponent implements OnInit {
  trabajadores: any[] = [];
  filteredTrabajadores: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  displayedColumns: string[] = [
    'id',
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
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
    this.loadTrabajadores();
    this.searchTermControl.valueChanges.subscribe((value) => {
      this.filterTrabajadores(value || '');
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadTrabajadores() {
    this.http
      .get<any>('https://proy-back-dnivel-44j5.onrender.com/api/Trabajador', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          this.trabajadores = response.data || [];
          this.filteredTrabajadores = [...this.trabajadores];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar trabajadores:', error);
          this.error = 'Error al cargar los trabajadores. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  filterTrabajadores(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        if (!term || term.trim() === '') {
          this.filteredTrabajadores = [...this.trabajadores];
        } else {
          const searchTerm = term.toLowerCase().trim();
          this.filteredTrabajadores = this.trabajadores.filter((trabajador) => {
            const matchesName = trabajador.nombre
              .toLowerCase()
              .includes(searchTerm);
            const matchesApellidoPaterno = trabajador.apellidoPaterno
              .toLowerCase()
              .includes(searchTerm);
            const matchesApellidoMaterno = trabajador.apellidoMaterno
              .toLowerCase()
              .includes(searchTerm);
            const matchesDNI = trabajador.dni
              .toLowerCase()
              .includes(searchTerm);
            return (
              matchesName ||
              matchesApellidoPaterno ||
              matchesApellidoMaterno ||
              matchesDNI
            );
          });
        }
        console.log(
          `Trabajadores filtrados: ${this.filteredTrabajadores.length} de ${this.trabajadores.length} total`
        );
        this.loading = false;
        this.cdr.detectChanges();
      }, 100);
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddTrabajadoresComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '30.2vw',
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }

  openEditDialog(id: number) {
    const dialogRef = this.dialog.open(EditTrabajadoresComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '25vw',
      panelClass: 'custom-dialog',
      data: { id, trabajadores: this.trabajadores },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }

  confirmDelete(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
      width: '20vw',
      maxWidth: '50vw',
      data: { id, message: '¿Estás seguro de eliminar este trabajador?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }
}
