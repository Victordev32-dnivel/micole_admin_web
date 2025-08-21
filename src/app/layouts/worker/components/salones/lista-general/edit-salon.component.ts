import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-edit-salon',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="edit-container">
      <h2 mat-dialog-title>Editar Salón</h2>

      <mat-dialog-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos del salón...</p>
        </div>

        <div *ngIf="error && !loading" class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-button color="primary" (click)="cargarDatos()">Reintentar</button>
        </div>

        <form *ngIf="!loading && !error" [formGroup]="editForm" class="edit-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field-full">
              <mat-label>Nombre del salón (opcional)</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej: Aula 101">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Hora de inicio</mat-label>
              <input matInput type="time" formControlName="horaInicio" required>
              <mat-error *ngIf="editForm.get('horaInicio')?.hasError('required')">
                La hora de inicio es obligatoria
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Hora de fin</mat-label>
              <input matInput type="time" formControlName="horaFin" required>
              <mat-error *ngIf="editForm.get('horaFin')?.hasError('required')">
                La hora de fin es obligatoria
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Tipo de salón</mat-label>
              <mat-select formControlName="tipo" required>
                <mat-option *ngFor="let tipo of tiposSalon" [value]="tipo">
                  {{ tipo }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('tipo')?.hasError('required')">
                El tipo es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nivel</mat-label>
              <mat-select formControlName="idNivel" required (selectionChange)="onNivelChange()">
                <mat-option *ngFor="let nivel of niveles" [value]="nivel.id">
                  {{ nivel.nombre }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('idNivel')?.hasError('required')">
                El nivel es obligatorio
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Grado</mat-label>
              <mat-select formControlName="idGrado" required (selectionChange)="onGradoChange()">
                <mat-option *ngFor="let grado of gradosFiltered" [value]="grado.id">
                  {{ grado.nombre }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('idGrado')?.hasError('required')">
                El grado es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Sección</mat-label>
              <mat-select formControlName="idSeccion" required>
                <mat-option *ngFor="let seccion of seccionesFiltered" [value]="seccion.id">
                  {{ seccion.nombre }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('idSeccion')?.hasError('required')">
                La sección es obligatoria
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="form-field-full">
            <mat-label>Descripción (opcional)</mat-label>
            <textarea matInput formControlName="descripcion" rows="3" maxlength="200"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cancelar()" [disabled]="saving">Cancelar</button>
        <button mat-raised-button color="primary" (click)="guardar()" [disabled]="editForm.invalid || saving">
          <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
          <span *ngIf="!saving">Guardar</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-container {
      padding: 0 10px;
      min-width: 600px;
    }
    
    h2 {
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      margin: -24px -24px 20px -24px;
      font-weight: 500;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      background: #ffebee;
      border-radius: 4px;
      color: #c62828;
      margin-bottom: 16px;
    }
    
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .form-field {
      flex: 1;
    }
    
    .form-field-full {
      width: 100%;
    }
    
    @media (max-width: 600px) {
      .edit-container {
        min-width: unset;
        width: 100%;
      }
      
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class EditSalonComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;

  // Datos para los selects
  tiposSalon = ['Aula', 'Laboratorio', 'Taller', 'Auditorio', 'Gimnasio', 'Biblioteca', 'Oficina', 'Otro'];
  niveles: any[] = [];
  grados: any[] = [];
  secciones: any[] = [];
  gradosFiltered: any[] = [];
  seccionesFiltered: any[] = [];

  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditSalonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      nombre: [''],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      tipo: ['', Validators.required],
      idNivel: ['', Validators.required],
      idGrado: ['', Validators.required],
      idSeccion: ['', Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  private getHeaders(): HttpHeaders {
    const token = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  cargarDatosIniciales(): void {
    this.loading = true;
    this.error = null;

    // Cargar datos en paralelo
    Promise.all([
      this.cargarNiveles(),
      this.cargarGrados(),
      this.cargarSecciones(),
      this.cargarDatosSalon()
    ]).then(() => {
      this.loading = false;
    }).catch((error) => {
      console.error('Error al cargar datos iniciales:', error);
      this.error = 'Error al cargar los datos necesarios.';
      this.loading = false;
    });
  }

  private cargarNiveles(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiBase}/nivel/colegio/${this.data.idColegio}?page=1`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.niveles = response.data || [];
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar niveles:', err);
            reject(err);
          }
        });
    });
  }

  private cargarGrados(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiBase}/grado/colegio/${this.data.idColegio}?page=1`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.grados = response.data || [];
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar grados:', err);
            reject(err);
          }
        });
    });
  }

  private cargarSecciones(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiBase}/seccion/colegio/${this.data.idColegio}?page=1`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.secciones = response.data || [];
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar secciones:', err);
            reject(err);
          }
        });
    });
  }

  private cargarDatosSalon(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiBase}/salon/colegio/${this.data.idColegio}?page=1&pagesize=500`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            if (response && response.data && Array.isArray(response.data)) {
              const salon = response.data.find((s: any) => s.id === this.data.id);
              
              if (salon) {
                this.editForm.patchValue({
                  nombre: salon.nombre || '',
                  horaInicio: salon.horaInicio || '',
                  horaFin: salon.horaFin || '',
                  tipo: salon.tipo || '',
                  idNivel: salon.idNivel || '',
                  idGrado: salon.idGrado || '',
                  idSeccion: salon.idSeccion || '',
                  descripcion: salon.descripcion || ''
                });
                
                // Filtrar grados y secciones basados en el nivel seleccionado
                this.filterGradosBySalon(salon);
                this.filterSeccionesBySalon(salon);
              }
            }
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar salón:', err);
            reject(err);
          }
        });
    });
  }

  private filterGradosBySalon(salon: any): void {
    if (salon.idNivel) {
      this.gradosFiltered = this.grados.filter(g => g.idNivel === salon.idNivel);
    }
  }

  private filterSeccionesBySalon(salon: any): void {
    if (salon.idGrado) {
      this.seccionesFiltered = this.secciones.filter(s => s.idGrado === salon.idGrado);
    }
  }

  onNivelChange(): void {
    const nivelId = this.editForm.get('idNivel')?.value;
    this.gradosFiltered = this.grados.filter(g => g.idNivel === nivelId);
    this.seccionesFiltered = [];
    
    // Resetear los campos dependientes
    this.editForm.patchValue({
      idGrado: '',
      idSeccion: ''
    });
  }

  onGradoChange(): void {
    const gradoId = this.editForm.get('idGrado')?.value;
    this.seccionesFiltered = this.secciones.filter(s => s.idGrado === gradoId);
    
    // Resetear sección
    this.editForm.patchValue({
      idSeccion: ''
    });
  }

  cargarDatos(): void {
    this.cargarDatosIniciales();
  }

  guardar(): void {
    if (this.editForm.invalid) return;

    this.saving = true;
    this.error = null;

    const datos = {
      horaInicio: this.editForm.value.horaInicio,
      horaFin: this.editForm.value.horaFin,
      tipo: this.editForm.value.tipo,
      idGrado: this.editForm.value.idGrado,
      idSeccion: this.editForm.value.idSeccion,
      idNivel: this.editForm.value.idNivel,
      idColegio: this.data.idColegio
    };

    this.http.put(`${this.apiBase}/salon/${this.data.id}`, datos, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.dialogRef.close({ success: true, data: response });
        },
        error: (err) => {
          console.error('Error al actualizar salón:', err);
          this.error = 'Error al actualizar el salón.';
          this.saving = false;
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}