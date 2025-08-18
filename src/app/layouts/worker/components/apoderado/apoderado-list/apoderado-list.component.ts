import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EditApoderadosComponent } from '../apoderado-list/edit-apoderados.component';
import { EliminarApoderadoComponent } from '../apoderado-list/eliminar.component'; // Importar el nuevo componente
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
      .get<any>('https://proy-back-dnivel-44j5.onrender.com/api/apoderado/colegio/lista/1', {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (resp) => {
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
        const byApellidos = a?.apellidos?.toLowerCase().includes(search);
        const byDni = a?.dni?.toLowerCase?.()
          ? a.dni.toLowerCase().includes(search)
          : (a?.dni || '').includes(search);
        return !!(byNombre || byApellidos || byDni);
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
      data: { isEditMode: false, apoderado: null },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadApoderados();
    });
  }

  openEditDialog(apoderado: any) {
    const dialogRef = this.dialog.open(EditApoderadosComponent, {
      width: '40vw', // Aumenté el ancho para el formulario de edición
      maxWidth: '600px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: { id: apoderado.id, apoderados: this.apoderados },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadApoderados();
    });
  }

  confirmDelete(apoderado: any) {
    console.log('🔍 Datos del apoderado a eliminar:', apoderado);
    
    // Determinar el ID del apoderado
    const apoderadoId = typeof apoderado === 'object' ? apoderado.id : apoderado;
    
    // Buscar la información completa del apoderado
    const apoderadoCompleto = this.apoderados.find(a => a.id === apoderadoId) || apoderado;
    
    console.log('📋 Información completa encontrada:', apoderadoCompleto);
    
    const dialogRef = this.dialog.open(EliminarApoderadoComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      disableClose: false, // Permitir cerrar haciendo clic fuera
      data: { 
        id: apoderadoId,
        message: '¿Estás seguro de que deseas eliminar este apoderado?',
        apoderado: apoderadoCompleto // Pasar la información completa
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('✅ Apoderado eliminado, recargando lista...');
        this.loadApoderados();
      } else {
        console.log('❌ Eliminación cancelada');
      }
    });
  }

  // Método auxiliar para obtener información de un apoderado por ID
  private getApoderadoById(id: number): any {
    return this.apoderados.find(a => a.id === id) || null;
  }
}