import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

interface Colegio {
  id: number;
  nombre: string;
  celular: string;
}

interface Anuncio {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  colegio_id: number;
  horario?: string;
  imagen?: string;
  url?: string;
  pdf?: string;
  tipo?: string;
  idUsuario?: number;
  idSalon?: number;
}

interface AnuncioEdit {
  nombre: string;
  horario: string;
  imagen: string;
  tipo: string;
  idColegio: number;
  idUsuario: number;
  idSalon: number;
  url: string;
  pdf: string;
}

interface AnuncioResponse {
  id: number;
  titulo: string;
  contenido: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  colegio_id: number;
  nombre?: string;
  horario?: string;
  imagen?: string;
  tipo?: string;
  idUsuario?: number;
  idSalon?: number;
  url?: string;
  pdf?: string;
}

@Component({
  selector: 'app-anuncio-socio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="main-content">
      <div class="container">
        <h2>Anuncios para Socios</h2>
        
        <!-- Selector de colegio -->
        <div class="form-group">
          <label for="colegioSelect">Seleccionar Colegio:</label>
          <select 
            id="colegioSelect" 
            class="form-control" 
            [(ngModel)]="selectedColegioId" 
            (change)="onColegioChange()"
            [disabled]="loadingColegios">
            <option value="">-- Seleccione un colegio --</option>
            <option *ngFor="let colegio of colegios" [value]="colegio.id">
              {{ colegio.nombre }}
            </option>
          </select>
        </div>

        <!-- Loading colegios -->
        <div *ngIf="loadingColegios" class="alert alert-info">
          Cargando colegios...
        </div>

        <!-- Loading anuncios -->
        <div *ngIf="loadingAnuncios" class="alert alert-info">
          Cargando anuncios...
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <!-- Lista de anuncios -->
        <div *ngIf="anuncios.length > 0">
          <h3>Anuncios del colegio seleccionado</h3>
          <div class="anuncios-container">
            <div *ngFor="let anuncio of anuncios" class="anuncio-card">
              <div class="anuncio-header">
                <h4>{{ anuncio.titulo }}</h4>
                <div class="action-buttons">
                  <button 
                    class="btn btn-edit" 
                    (click)="openEditModal(anuncio)"
                    title="Editar anuncio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L14.5 5.207l-3-3L12.854.146a.5.5 0 0 1 .292-.146zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V13h3.293l6.5-6.5z"/>
                      <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                    </svg>
                    Editar
                  </button>
                  
                  <button 
                    class="btn btn-delete" 
                    (click)="openDeleteConfirmModal(anuncio)"
                    title="Eliminar anuncio"
                    [disabled]="deleting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
              <p>{{ anuncio.contenido }}</p>
              <div class="anuncio-footer">
                <small>Creado: {{ anuncio.fecha_creacion | date:'short' }}</small>
                <small>Actualizado: {{ anuncio.fecha_actualizacion | date:'short' }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje cuando no hay anuncios -->
        <div *ngIf="selectedColegioId && !loadingAnuncios && anuncios.length === 0" class="alert alert-info">
          No hay anuncios para el colegio seleccionado.
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div *ngIf="showDeleteModal" class="modal-overlay" (click)="closeDeleteModal()">
      <div class="modal-container delete-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Confirmar Eliminación</h3>
          <button type="button" class="modal-close" (click)="closeDeleteModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="delete-confirmation">
            <div class="delete-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </div>
            <h4>¿Está seguro de que desea eliminar este anuncio?</h4>
            <p><strong>{{ anuncioToDelete?.titulo }}</strong></p>
            <p>Esta acción no se puede deshacer.</p>
          </div>

          <!-- Error message del modal -->
          <div *ngIf="deleteErrorMessage" class="alert alert-danger">
            {{ deleteErrorMessage }}
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-danger" 
              (click)="confirmDelete()"
              [disabled]="deleting">
              <span *ngIf="deleting" class="loading-spinner-small"></span>
              {{ deleting ? 'Eliminando...' : 'Sí, Eliminar' }}
            </button>
            
            <button 
              type="button" 
              class="btn btn-secondary" 
              (click)="closeDeleteModal()"
              [disabled]="deleting">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div *ngIf="showEditModal" class="modal-overlay" (click)="closeEditModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Editar Anuncio</h3>
          <button type="button" class="modal-close" (click)="closeEditModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Error message del modal -->
          <div *ngIf="editErrorMessage" class="alert alert-danger">
            {{ editErrorMessage }}
          </div>

          <!-- Success message del modal -->
          <div *ngIf="editSuccessMessage" class="alert alert-success">
            {{ editSuccessMessage }}
          </div>

          <!-- Formulario de edición -->
          <form *ngIf="editAnuncio" (ngSubmit)="onSubmitEdit()" #editForm="ngForm" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label for="editNombre">Nombre del Anuncio <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="editNombre" 
                  name="editNombre"
                  class="form-control" 
                  [(ngModel)]="editAnuncio.nombre" 
                  required
                  maxlength="255"
                  placeholder="Ingrese el nombre del anuncio">
                <div class="form-help">Máximo 255 caracteres</div>
              </div>

             
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editHorario">Horario</label>
                <input 
                  type="text" 
                  id="editHorario" 
                  name="editHorario"
                  class="form-control" 
                  [(ngModel)]="editAnuncio.horario" 
                  placeholder="Ej: 08:00 - 17:00">
              </div>

              <div class="form-group">
                <label for="editIdColegio">Colegio <span class="required">*</span></label>
                <select 
                  id="editIdColegio" 
                  name="editIdColegio"
                  class="form-control" 
                  [(ngModel)]="editAnuncio.idColegio" 
                  required>
                  <option value="0">-- Seleccione un colegio --</option>
                  <option *ngFor="let colegio of colegios" [value]="colegio.id">
                    {{ colegio.nombre }}
                  </option>
                </select>
              </div>
            </div>

            

            <div class="form-group">
              <label for="editImagen">URL de Imagen</label>
              <input 
                type="url" 
                id="editImagen" 
                name="editImagen"
                class="form-control" 
                [(ngModel)]="editAnuncio.imagen" 
                placeholder="https://ejemplo.com/imagen.jpg">
              <div class="form-help">URL completa de la imagen</div>
            </div>

            <div class="form-group">
              <label for="editUrl">URL Adicional</label>
              <input 
                type="url" 
                id="editUrl" 
                name="editUrl"
                class="form-control" 
                [(ngModel)]="editAnuncio.url" 
                placeholder="https://ejemplo.com">
              <div class="form-help">URL adicional relacionada con el anuncio</div>
            </div>

           

            <!-- Preview de imagen -->
            <div *ngIf="editAnuncio.imagen" class="image-preview">
              <label>Vista previa de la imagen:</label>
              <img [src]="editAnuncio.imagen" alt="Preview" (error)="onImageError($event)">
            </div>

            <div class="modal-actions">
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="!editForm.form.valid || updatingEdit">
                <span *ngIf="updatingEdit" class="loading-spinner-small"></span>
                {{ updatingEdit ? 'Actualizando...' : 'Actualizar Anuncio' }}
              </button>
              
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="resetEditForm()">
                Restablecer
              </button>

              <button 
                type="button" 
                class="btn btn-cancel" 
                (click)="closeEditModal()">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-content {
      margin-left: 280px; /* Más espacio para el sidebar */
      margin-top: 80px; /* Espacio para el header */
      min-height: calc(100vh - 80px);
      background-color: #f8f9fa;
      padding: 0;
    }

    .container {
      padding: 30px;
      max-width: none;
      width: 100%;
      box-sizing: border-box;
    }

    h2 {
      margin-bottom: 30px;
      color: #333;
      font-size: 28px;
      font-weight: 600;
    }

    h3 {
      margin-bottom: 20px;
      color: #444;
      font-size: 22px;
      font-weight: 500;
    }

    .form-group {
      margin-bottom: 30px;
      max-width: 400px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 16px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      background-color: white;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-control:disabled {
      background-color: #f8f9fa;
      opacity: 0.6;
    }

    .anuncios-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
      margin-top: 30px;
    }

    .anuncio-card {
      border: 1px solid #e1e5e9;
      border-radius: 12px;
      padding: 24px;
      background-color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      position: relative;
    }

    .anuncio-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .anuncio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 15px;
    }

    .anuncio-card h4 {
      margin: 0;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.3;
      flex: 1;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .anuncio-card p {
      margin-bottom: 20px;
      color: #555;
      line-height: 1.6;
      font-size: 15px;
    }

    .anuncio-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f0f2f5;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 13px;
      color: #6c757d;
    }

    .anuncio-footer small {
      font-weight: 500;
    }

    .alert {
      padding: 16px 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 1px solid transparent;
      font-size: 15px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alert-info {
      background-color: #e3f2fd;
      color: #0277bd;
      border-color: #bbdefb;
    }

    .alert-danger {
      background-color: #ffebee;
      color: #c62828;
      border-color: #ffcdd2;
    }

    .alert-success {
      background-color: #e8f5e8;
      color: #2e7d32;
      border-color: #c8e6c9;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }

    .btn-edit {
      background-color: #28a745;
      color: white;
      font-size: 13px;
      padding: 6px 10px;
      flex-shrink: 0;
    }

    .btn-edit:hover {
      background-color: #218838;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-delete {
      background-color: #dc3545;
      color: white;
      font-size: 13px;
      padding: 6px 10px;
      flex-shrink: 0;
    }

    .btn-delete:hover:not(:disabled) {
      background-color: #c82333;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn-delete:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .btn-edit svg,
    .btn-delete svg {
      flex-shrink: 0;
    }

    /* ESTILOS DEL MODAL */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      animation: modalSlideIn 0.3s ease-out;
    }

    .delete-modal {
      max-width: 500px;
    }

    @keyframes modalSlideIn {
      from {
        transform: scale(0.9) translateY(-20px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e1e5e9;
      background-color: #f8f9fa;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
    }

    .modal-close {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: #6c757d;
      transition: color 0.15s ease;
      border-radius: 4px;
    }

    .modal-close:hover {
      color: #333;
      background-color: #e9ecef;
    }

    .modal-body {
      padding: 24px;
      max-height: calc(90vh - 140px);
      overflow-y: auto;
    }

    .delete-confirmation {
      text-align: center;
      margin-bottom: 24px;
    }

    .delete-icon {
      color: #dc3545;
      margin-bottom: 16px;
    }

    .delete-confirmation h4 {
      margin: 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .delete-confirmation p {
      margin: 8px 0;
      color: #6c757d;
      font-size: 14px;
    }

    .edit-form .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .edit-form .form-group {
      margin-bottom: 20px;
      max-width: none;
    }

    .edit-form .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .required {
      color: #dc3545;
    }

    .form-help {
      font-size: 11px;
      color: #6c757d;
      margin-top: 4px;
    }

    .image-preview {
      margin: 20px 0;
    }

    .image-preview img {
      max-width: 250px;
      max-height: 150px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      object-fit: cover;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e1e5e9;
      flex-wrap: wrap;
    }

    .modal-actions .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-secondary:disabled {
      background-color: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
    }

    .btn-cancel {
      background-color: #dc3545;
      color: white;
    }

    .btn-cancel:hover {
      background-color: #c82333;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .btn-danger:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #0277bd;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive design */
    @media (max-width: 1200px) {
      .main-content {
        margin-left: 250px; /* Ajustado para tablets */
      }
      
      .anuncios-container {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .modal-container {
        width: 95%;
        max-width: 700px;
      }
    }

    @media (max-width: 992px) {
      .main-content {
        margin-left: 0;
        margin-top: 60px;
        padding-top: 20px;
      }
      
      .container {
        padding: 20px;
      }
      
      .anuncios-container {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      
      h2 {
        font-size: 24px;
      }

      .edit-form .form-row {
        grid-template-columns: 1fr;
        gap: 0;
      }

      .modal-container {
        width: 98%;
        max-height: 95vh;
      }

      .modal-body {
        padding: 20px;
      }

      .action-buttons {
        flex-direction: column;
        gap: 6px;
      }
    }

    @media (max-width: 576px) {
      .container {
        padding: 15px;
      }
      
      .anuncios-container {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .anuncio-card {
        padding: 20px;
      }
      
      .anuncio-footer {
        flex-direction: column;
        gap: 4px;
      }
      
      .anuncio-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      
      .action-buttons {
        align-self: flex-end;
        flex-direction: row;
      }

      .modal-container {
        width: 100%;
        height: 100%;
        border-radius: 0;
        max-height: none;
      }

      .modal-actions {
        flex-direction: column;
      }

      .modal-actions .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AnuncioSocioListComponent implements OnInit {
  colegios: Colegio[] = [];
  anuncios: Anuncio[] = [];
  selectedColegioId: number | null = null;
  loadingColegios: boolean = false;
  loadingAnuncios: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Variables para el modal de edición
  showEditModal: boolean = false;
  editAnuncio: AnuncioEdit | null = null;
  originalEditAnuncio: AnuncioEdit | null = null;
  currentEditId: number = 0;
  updatingEdit: boolean = false;
  editErrorMessage: string = '';
  editSuccessMessage: string = '';

  // Variables para el modal de eliminación
  showDeleteModal: boolean = false;
  anuncioToDelete: Anuncio | null = null;
  deleting: boolean = false;
  deleteErrorMessage: string = '';

  private apiUrl = 'https://proy-back-dnivel-44j5.onrender.com';
  private bearerToken = '732612882';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnInit(): void {
    this.loadColegios();
  }

  loadColegios(): void {
    this.loadingColegios = true;
    this.errorMessage = '';

    const headers = this.getHeaders();

    this.http.get<{data: Colegio[]}>(`${this.apiUrl}/api/colegio/lista`, { headers })
      .pipe(
        finalize(() => this.loadingColegios = false)
      )
      .subscribe({
        next: (response) => {
          this.colegios = response.data;
          console.log('Colegios cargados:', this.colegios);
        },
        error: (error) => {
          console.error('Error loading colegios:', error);
          this.errorMessage = 'Error al cargar la lista de colegios.';
        }
      });
  }

  onColegioChange(): void {
    if (this.selectedColegioId) {
      this.loadAnuncios(this.selectedColegioId);
    } else {
      this.anuncios = [];
    }
  }

loadAnuncios(colegioId: number): void {
  this.loadingAnuncios = true;
  this.errorMessage = '';
  this.successMessage = '';

  const headers = this.getHeaders();
  const url = `${this.apiUrl}/api/anuncio/general/colegio/socios/${colegioId}`;

  console.log('Cargando anuncios desde:', url);

  // Configurar para aceptar tanto JSON como texto plano
  const options = {
    headers: headers,
    responseType: 'text' as 'json' // Permite manejar respuestas de texto
  };

  this.http.get<any>(url, options)
    .pipe(
      finalize(() => this.loadingAnuncios = false)
    )
    .subscribe({
      next: (response: any) => {
        try {
          // Intentar parsear como JSON
          const data = typeof response === 'string' ? JSON.parse(response) : response;
          
          if (Array.isArray(data)) {
            this.anuncios = data;
            console.log('Anuncios cargados:', this.anuncios);
          } else {
            // Si no es un array, asumir que no hay anuncios
            this.anuncios = [];
            console.log('No hay anuncios para este colegio');
          }
        } catch (error) {
          // Si el parsing falla, podría ser un mensaje de texto
          console.log('Respuesta del servidor:', response);
          this.anuncios = [];
        }
      },
      error: (error) => {
        console.error('Error loading anuncios:', error);
        
        // Manejar específicamente el error 404 (no encontrado)
        if (error.status === 404) {
          // 404 podría significar "no hay anuncios" en lugar de un error real
          this.anuncios = [];
          console.log('No hay anuncios para el colegio seleccionado');
        } else {
          this.errorMessage = 'Error al cargar los anuncios del colegio.';
          this.anuncios = [];
        }
      }
    });
}

  // Métodos para el modal de edición
  openEditModal(anuncio: Anuncio): void {
    this.currentEditId = anuncio.id;
    this.showEditModal = true;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
    
    // Usar los datos del anuncio directamente, sin hacer petición al servidor
    this.editAnuncio = {
      nombre: anuncio.titulo || '',
      horario: anuncio.horario || '',
      imagen: anuncio.imagen || '',
      tipo: anuncio.tipo || '',
      idColegio: anuncio.colegio_id || 0,
      idUsuario: anuncio.idUsuario || 0,
      idSalon: anuncio.idSalon || 0,
      url: anuncio.url || '',
      pdf: anuncio.pdf || ''
    };
    this.originalEditAnuncio = { ...this.editAnuncio };
    console.log('Anuncio cargado para edición:', this.editAnuncio);
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editAnuncio = null;
    this.originalEditAnuncio = null;
    this.currentEditId = 0;
    this.updatingEdit = false;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
  }

  onSubmitEdit(): void {
    if (!this.currentEditId || !this.editAnuncio) {
      this.editErrorMessage = 'ID de anuncio no válido';
      return;
    }

    this.updatingEdit = true;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';

    const headers = this.getHeaders();

    this.http.put<any>(`${this.apiUrl}/api/anuncio/${this.currentEditId}`, this.editAnuncio, { headers })
      .pipe(
        finalize(() => this.updatingEdit = false)
      )
      .subscribe({
        next: (response) => {
          this.editSuccessMessage = 'Anuncio actualizado correctamente';
          this.originalEditAnuncio = { ...this.editAnuncio! };
          console.log('Anuncio actualizado:', response);
          
          // Recargar la lista de anuncios si hay un colegio seleccionado
          if (this.selectedColegioId) {
            this.loadAnuncios(this.selectedColegioId);
          }
          
          // Auto-ocultar mensaje de éxito después de 3 segundos
          setTimeout(() => {
            this.editSuccessMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating anuncio:', error);
          this.editErrorMessage = 'Error al actualizar el anuncio. Verifique los datos e intente nuevamente.';
        }
      });
  }

  resetEditForm(): void {
    if (this.originalEditAnuncio) {
      this.editAnuncio = { ...this.originalEditAnuncio };
    }
    this.editErrorMessage = '';
    this.editSuccessMessage = '';
  }

  // Métodos para el modal de eliminación
  openDeleteConfirmModal(anuncio: Anuncio): void {
    this.anuncioToDelete = anuncio;
    this.showDeleteModal = true;
    this.deleteErrorMessage = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.anuncioToDelete = null;
    this.deleting = false;
    this.deleteErrorMessage = '';
  }

confirmDelete(): void {
  if (!this.anuncioToDelete) {
    return;
  }

  this.deleting = true;
  this.deleteErrorMessage = '';
  this.errorMessage = '';
  this.successMessage = '';

  const headers = this.getHeaders();
  const deleteUrl = `https://proy-back-dnivel-44j5.onrender.com/${this.anuncioToDelete.id}`;

  console.log('Eliminando anuncio en:', deleteUrl);

  // Configurar para aceptar texto plano en lugar de JSON
  const options = {
    headers: headers,
    responseType: 'text' as 'json' // Esto permite manejar respuestas de texto
  };

  this.http.delete<any>(deleteUrl, options)
    .pipe(
      finalize(() => this.deleting = false)
    )
    .subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);
        this.successMessage = `Anuncio "${this.anuncioToDelete!.titulo}" eliminado correctamente`;
        
        // Cerrar modal
        this.closeDeleteModal();
        
        // Recargar la lista de anuncios si hay un colegio seleccionado
        if (this.selectedColegioId) {
          this.loadAnuncios(this.selectedColegioId);
        }
        
        // Auto-ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Error deleting anuncio:', error);
        this.deleteErrorMessage = 'Error al eliminar el anuncio. Intente nuevamente.';
      }
    });
}

// Método alternativo usando POST para eliminar (si DELETE no funciona)
private tryDeleteWithPost(): void {
  if (!this.anuncioToDelete) {
    return;
  }

  const headers = this.getHeaders();
  const deleteUrl = `${this.apiUrl}/${this.anuncioToDelete.id}`;

  console.log('Intentando eliminar con POST en:', deleteUrl);

  // Intentar con POST (algunas APIs usan POST para delete)
  this.http.post<any>(deleteUrl, {}, { headers })
    .subscribe({
      next: (response) => {
        console.log('Anuncio eliminado con POST:', response);
        this.successMessage = `Anuncio "${this.anuncioToDelete!.titulo}" eliminado correctamente`;
        
        this.closeDeleteModal();
        
        if (this.selectedColegioId) {
          this.loadAnuncios(this.selectedColegioId);
        }
        
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Error con POST:', error);
        this.deleteErrorMessage = 'No se pudo eliminar el anuncio. Verifique la conexión.';
      }
    });
}
  onImageError(event: any): void {
    event.target.style.display = 'none';
  }
}