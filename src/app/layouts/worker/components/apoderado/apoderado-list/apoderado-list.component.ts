import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EditApoderadoComponent } from '../edit-apoderado/edit-apoderado.component';
import { ConfirmationDeleteComponent } from '../confirmation-delete/confirmation-delete.component';
import { AddApoderadosComponent } from '../add-apoderado/add-apoderado.component';

@Component({
  selector: 'app-apoderados',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './apoderado-list.component.html',
  styleUrls: ['./apoderado-list.component.css'],
})
export class ApoderadoListComponent implements OnInit {
  apoderados: any[] = [];
  filteredApoderados: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTermControl = new FormControl('');

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadApoderados();
    this.searchTermControl.valueChanges.subscribe((term) => {
      this.filterApoderados(term || '');
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadApoderados() {
    this.loading = true;
    this.http
      .get<any>('https://proy-back-dnivel-44j5.onrender.com/api/apoderado', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (resp) => {
          // Ajusta según la estructura exacta de tu API: resp.data, resp, etc.
          this.apoderados = resp?.data || resp || [];
          this.filteredApoderados = [...this.apoderados];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[Apoderados] Error al cargar:', error);
          this.error = 'Error al cargar los apoderados. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  filterApoderados(term: string) {
    this.ngZone.run(() => {
      const search = term.toLowerCase().trim();
      if (!search) {
        this.filteredApoderados = [...this.apoderados];
        return;
      }
      this.filteredApoderados = this.apoderados.filter((a) => {
        const byNombre = a?.nombre?.toLowerCase().includes(search);
        const byApellido = a?.apellido?.toLowerCase().includes(search);
        const byDni = a?.dni?.toLowerCase?.()
          ? a.dni.toLowerCase().includes(search)
          : (a?.dni || '').includes(search);
        return !!(byNombre || byApellido || byDni);
      });
      this.cdr.detectChanges();
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddApoderadosComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '30vw',
      panelClass: 'custom-dialog',
      data: { isEditMode: false, apoderado: null }, // por consistencia
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadApoderados();
    });
  }

  openEditDialog(apoderado: any) {
    const dialogRef = this.dialog.open(EditApoderadoComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '30vw',
      panelClass: 'custom-dialog',
      data: { id: apoderado.id, apoderados: this.apoderados },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadApoderados();
    });
  }

  confirmDelete(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDeleteComponent, {
      width: '20vw',
      maxWidth: '50vw',
      panelClass: 'custom-dialog',
      data: { id, message: '¿Estás seguro de eliminar este apoderado?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadApoderados();
    });
  }
}
