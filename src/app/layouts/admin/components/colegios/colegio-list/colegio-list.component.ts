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
    'colegio',
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
      .get<any>('https://proy-back-dnivel.onrender.com/api/colegio', {
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
            const matchesName = colegio.colegio
              .toLowerCase()
              .includes(searchTerm);
            const matchesDireccion = colegio.direccion
              .toLowerCase()
              .includes(searchTerm);
            return matchesName || matchesDireccion;
          });
        }
        console.log(
          `Colegios filtrados: ${this.filteredColegios.length} de ${this.colegios.length} total`
        );
        this.loading = false;
        this.cdr.detectChanges();
      }, 100);
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddColegioComponent, {
      width: '500px', // ancho fijo más compacto
      maxWidth: '90vw', // responsive
      height: 'auto',
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }

  openEditDialog(id: number) {
    const dialogRef = this.dialog.open(EditColegioComponent, {
      width: '100vw', // ancho un poco más amplio para edición
      maxWidth: '90vw', // responsive
      panelClass: 'custom-dialog',
      data: { id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }

  confirmDelete(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
      width: '300px',
      maxWidth: '90vw',
      data: { id, message: '¿Estás seguro de eliminar este colegio?' }, // ahora incluye el id
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadColegios();
    });
  }
}
