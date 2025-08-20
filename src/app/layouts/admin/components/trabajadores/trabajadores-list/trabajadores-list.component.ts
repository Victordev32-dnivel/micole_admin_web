// trabajadores-list.component.ts
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
import { AddTrabajadoresComponent } from '../trabajadores-list/add-trabajadores.component';
import { EditTrabajadoresComponent } from '../trabajadores-list/modificar-trabajador.component';

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
  colegios: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  displayedColumns: string[] = [
    'id',
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
    'colegio',
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

  getNombreColegio(idColegio: number): string {
    const colegio = this.colegios.find(c => c.id === idColegio);
    return colegio ? colegio.nombre : 'Desconocido';
  }

  loadColegios() {
    this.http.get<any>('https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        this.colegios = response.data.map((colegio: any) => ({
          id: colegio.id,
          nombre: colegio.nombre
        }));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar colegios:', error);
      }
    });
  }

  loadTrabajadores() {
    this.loading = true;
    this.http
      .get<any[]>('https://proy-back-dnivel-44j5.onrender.com/api/Trabajador', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          console.log('Respuesta del API:', response); // Para debug
          this.trabajadores = response.map((t: any) => {
            console.log('ID del trabajador:', t.id); // Para debug
            return {
              id: t.id, // Corregido: usar t.id directamente
              nombre: t.nombres,
              apellidoPaterno: t.apellidoPaterno,
              apellidoMaterno: t.apellidoMaterno,
              dni: t.numeroDocumento,
              telefono: t.telefono,
              idColegio: t.idColegio,
              tipoUsuario: t.tipoUsuario,
              contrasena: t.contrasena
            };
          });
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
            const matchesName = trabajador.nombre.toLowerCase().includes(searchTerm);
            const matchesApellidoPaterno = trabajador.apellidoPaterno.toLowerCase().includes(searchTerm);
            const matchesApellidoMaterno = trabajador.apellidoMaterno.toLowerCase().includes(searchTerm);
            const matchesDNI = trabajador.dni.toLowerCase().includes(searchTerm);
            const matchesColegio = this.getNombreColegio(trabajador.idColegio).toLowerCase().includes(searchTerm);
            return matchesName || matchesApellidoPaterno || matchesApellidoMaterno || matchesDNI || matchesColegio;
          });
        }
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
      data: { colegios: this.colegios }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }

  openEditDialog(id: number) {
    console.log('Abriendo dialog para ID:', id); // Para debug
    const trabajador = this.trabajadores.find((t) => t.id === id);
    console.log('Trabajador encontrado:', trabajador); // Para debug
    
    if (!trabajador) {
      console.error('No se encontró el trabajador con ID:', id);
      alert('Error: No se encontró el trabajador seleccionado');
      return;
    }

    const dialogRef = this.dialog.open(EditTrabajadoresComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '25vw',
      panelClass: 'custom-dialog',
      data: { 
        id, 
        trabajador,
        colegios: this.colegios 
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }

  confirmDelete(id: number) {
    console.log('Eliminando trabajador con ID:', id); // Para debug
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
      width: '20vw',
      maxWidth: '50vw',
      data: { 
        id, 
        message: '¿Estás seguro de eliminar este trabajador?',
        endpoint: 'Trabajador',
        headers: this.getHeaders()
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadTrabajadores();
    });
  }

  // Método para mejorar el rendimiento de la lista
  trackByTrabajadorId(index: number, trabajador: any): number {
    return trabajador.id;
  }
}