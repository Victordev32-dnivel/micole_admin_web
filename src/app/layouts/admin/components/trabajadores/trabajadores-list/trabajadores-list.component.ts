import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trabajadores-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="container">
      <h2>Listado de Trabajadores</h2>
      
      <div class="header-actions">
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fas fa-plus"></i> Crear Trabajador
        </button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Tipo</th>
        
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let trabajador of trabajadores">
            <td>{{ trabajador.id }}</td>
            <td>{{ trabajador.nombre }}</td>
            <td>{{ trabajador.numeroDocumento }}</td>
            <td>{{ trabajador.tipoUsuario }}</td>
            <td>
              <button class="btn btn-sm btn-edit" (click)="editTrabajador(trabajador)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-delete" (click)="deleteTrabajador(trabajador.id)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal para crear/editar trabajador -->
      <div class="modal" [class.show]="showModal">
        <div class="modal-content">
          <span class="close" (click)="closeModal()">&times;</span>
          <h3>{{ isEditing ? 'Editar Trabajador' : 'Crear Trabajador' }}</h3>
          
          <form (ngSubmit)="submitForm()">
            <div class="form-group">
              <label>Nombre:</label>
              <input type="text" [(ngModel)]="currentTrabajador.nombre" name="nombre" required>
            </div>
            <div class="form-group">
              <label>Documento:</label>
              <input type="text" [(ngModel)]="currentTrabajador.numeroDocumento" name="documento" required>
            </div>
            <div class="form-group">
              <label>Contraseña:</label>
              <input type="password" [(ngModel)]="currentTrabajador.contrasena" name="contrasena" [required]="!isEditing">
            </div>
            <div class="form-group">
              <label>Tipo de Usuario:</label>
              <select [(ngModel)]="currentTrabajador.tipoUsuario" name="tipoUsuario" required>
                <option value="admin">Administrador</option>
                <option value="trabajador">Trabajador</option>
              </select>
            </div>
            <button type="submit" class="btn btn-submit">
              {{ isEditing ? 'Actualizar' : 'Crear' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./trabajadores-list.component.css']
})
export class TrabajadoresListComponent {
  trabajadores: any[] = [];
  showModal = false;
  isEditing = false;
  currentTrabajador: any = { 
    id: null, 
    nombre: '', 
    numeroDocumento: '', 
    contrasena: '', 
    tipoUsuario: 'trabajador' 
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTrabajadores();
  }

  loadTrabajadores() {
    this.http.get<any[]>('https://tu-api.com/trabajadores').subscribe(
      data => this.trabajadores = data,
      error => console.error('Error cargando trabajadores:', error)
    );
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentTrabajador = { 
      id: null, 
      nombre: '', 
      numeroDocumento: '', 
      contrasena: '', 
      tipoUsuario: 'trabajador' 
    };
    this.showModal = true;
  }

  editTrabajador(trabajador: any) {
    this.isEditing = true;
    this.currentTrabajador = { ...trabajador };
    this.showModal = true;
  }

  submitForm() {
    const payload = { ...this.currentTrabajador };
    if (!this.isEditing) {
      payload.valueToken = 'string';
    }

    if (this.isEditing) {
      this.http.put(`https://tu-api.com/trabajadores/${this.currentTrabajador.id}`, payload)
        .subscribe(() => {
          this.loadTrabajadores();
          this.closeModal();
        });
    } else {
      this.http.post('https://tu-api.com/trabajadores', payload)
        .subscribe(() => {
          this.loadTrabajadores();
          this.closeModal();
        });
    }
  }

  deleteTrabajador(id: number) {
    if (confirm('¿Estás seguro de eliminar este trabajador?')) {
      this.http.delete(`https://tu-api.com/trabajadores/${id}`)
        .subscribe(() => this.loadTrabajadores());
    }
  }

  closeModal() {
    this.showModal = false;
  }
}