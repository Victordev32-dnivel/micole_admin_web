import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-colegio-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="container">
      <h2>Listado de Colegios</h2>
      
      <div class="header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fas fa-plus"></i> Crear Colegio
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let colegio of colegios">
            <td>{{ colegio.id }}</td>
            <td>{{ colegio.nombre }}</td>
            <td>{{ colegio.direccion }}</td>
            <td>
              <button class="btn btn-sm btn-edit" (click)="editColegio(colegio)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-delete" (click)="deleteColegio(colegio.id)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal para crear/editar colegio -->
      <div class="modal" [class.show]="showModal">
        <div class="modal-content">
          <span class="close" (click)="closeModal()">&times;</span>
          <h3>{{ isEditing ? 'Editar Colegio' : 'Crear Colegio' }}</h3>
          
          <form (ngSubmit)="submitForm()">
            <div class="form-group">
              <label>Nombre:</label>
              <input type="text" [(ngModel)]="currentColegio.nombre" name="nombre" required>
            </div>
            <div class="form-group">
              <label>Dirección:</label>
              <input type="text" [(ngModel)]="currentColegio.direccion" name="direccion" required>
            </div>
            <button type="submit" class="btn btn-submit">
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./colegio-list.component.css']
})
export class ColegioListComponent {
  colegios: any[] = [];
  showModal = false;
  isEditing = false;
  currentColegio: any = { id: null, nombre: '', direccion: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadColegios();
  }

  loadColegios() {
    this.http.get<any[]>('https://tu-api.com/colegios').subscribe(
      data => this.colegios = data,
      error => console.error('Error cargando colegios:', error)
    );
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentColegio = { id: null, nombre: '', direccion: '' };
    this.showModal = true;
  }

  editColegio(colegio: any) {
    this.isEditing = true;
    this.currentColegio = { ...colegio };
    this.showModal = true;
  }

  submitForm() {
    if (this.isEditing) {
      this.http.put(`https://tu-api.com/colegios/${this.currentColegio.id}`, this.currentColegio)
        .subscribe(() => {
          this.loadColegios();
          this.closeModal();
        });
    } else {
      this.http.post('https://tu-api.com/colegios', this.currentColegio)
        .subscribe(() => {
          this.loadColegios();
          this.closeModal();
        });
    }
  }

  deleteColegio(id: number) {
    if (confirm('¿Estás seguro de eliminar este colegio?')) {
      this.http.delete(`https://tu-api.com/colegios/${id}`)
        .subscribe(() => this.loadColegios());
    }
  }

  closeModal() {
    this.showModal = false;
  }
}