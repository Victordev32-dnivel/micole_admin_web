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
      <div class="header-container">
        <h2 mat-dialog-title class="centered-title">Editar Salón</h2>
      </div>

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
              <mat-label>Hora de inicio (HH:MM:SS)</mat-label>
              <input matInput formControlName="horaInicio" placeholder="00:00:00" required
                     (input)="formatTime($event, 'horaInicio')">
              <mat-error *ngIf="editForm.get('horaInicio')?.hasError('required')">
                La hora de inicio es obligatoria
              </mat-error>
              <mat-error *ngIf="editForm.get('horaInicio')?.hasError('pattern')">
                Formato inválido. Use HH:MM:SS (ej: 08:30:00)
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Hora de fin (HH:MM:SS)</mat-label>
              <input matInput formControlName="horaFin" placeholder="00:00:00" required
                     (input)="formatTime($event, 'horaFin')">
              <mat-error *ngIf="editForm.get('horaFin')?.hasError('required')">
                La hora de fin es obligatoria
              </mat-error>
              <mat-error *ngIf="editForm.get('horaFin')?.hasError('pattern')">
                Formato inválido. Use HH:MM:SS (ej: 14:30:00)
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
                <mat-label>Tipo de salón</mat-label>
              <mat-select formControlName="tipo" required>
                <mat-option [value]="1">Tipo 1 (Entrada)</mat-option>
                <mat-option [value]="2">Tipo 2 (Salida)</mat-option>
                <mat-option [value]="3">Tipo 3</mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('tipo')?.hasError('required')">
                El tipo es obligatorio
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Nivel</mat-label>
              <mat-select formControlName="idNivel" required>
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
              <mat-select formControlName="idGrado" required>
                <mat-option *ngFor="let grado of grados" [value]="grado.id">
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
                <mat-option *ngFor="let seccion of secciones" [value]="seccion.id">
                  {{ seccion.nombre }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="editForm.get('idSeccion')?.hasError('required')">
                La sección es obligatoria
              </mat-error>
            </mat-form-field>
          </div>
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
    
    .header-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #1f2937;
      margin: -24px -24px 20px -24px;
      padding: 0 24px;
    }
    
    .centered-title {
      color: white;
      padding: 16px 0;
      margin: 0;
      font-weight: 500;
      text-align: center;
      flex: 1;
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
      
      .header-container {
        margin: -16px -16px 16px -16px;
        padding: 0 16px;
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

  niveles: any[] = [];
  grados: any[] = [];
  secciones: any[] = [];

  private apiBase = '/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditSalonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      nombre: [''], // Campo opcional según la API
      horaInicio: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      horaFin: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      tipo: [1, Validators.required], // Valor por defecto 1
      idNivel: ['', Validators.required],
      idGrado: ['', Validators.required],
      idSeccion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.userService.getJwtToken()}`,
      'Content-Type': 'application/json',
    });
  }

  // Función para formatear automáticamente la hora
  formatTime(event: any, fieldName: string): void {
    let value = event.target.value.replace(/\D/g, ''); // Remover caracteres no numéricos

    if (value.length > 6) {
      value = value.substring(0, 6); // Limitar a 6 dígitos
    }

    // Formatear como HH:MM:SS
    if (value.length > 4) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4) + ':' + value.substring(4);
    } else if (value.length > 2) {
      value = value.substring(0, 2) + ':' + value.substring(2);
    }

    this.editForm.patchValue({ [fieldName]: value });
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
      this.http.get<any>(`${this.apiBase}/salon/${this.data.id}`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            console.log('Datos del salón:', response);

            if (response) {
              this.editForm.patchValue({
                nombre: response.nombre || '',
                horaInicio: response.horarioInicio || response.horaInicio || '',
                horaFin: response.horarioFin || response.horaFin || '',
                tipo: response.tipo || 1,
                idNivel: response.idNivel || '',
                idGrado: response.idGrado || '',
                idSeccion: response.idSeccion || ''
              });
            }
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar salón específico:', err);
            // Si falla el endpoint específico, intentar con el listado
            this.cargarSalonDesdeListado().then(resolve).catch(reject);
          }
        });
    });
  }

  private cargarSalonDesdeListado(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any>(`${this.apiBase}/salon/colegio/${this.data.idColegio}?page=1&pagesize=500`, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            if (response && response.data && Array.isArray(response.data)) {
              const salon = response.data.find((s: any) => s.id === this.data.id);

              if (salon) {
                this.editForm.patchValue({
                  nombre: salon.nombre || '',
                  horaInicio: salon.horarioInicio || salon.horaInicio || '',
                  horaFin: salon.horarioFin || salon.horaFin || '',
                  tipo: salon.tipo || 1,
                  idNivel: salon.idNivel || '',
                  idGrado: salon.idGrado || '',
                  idSeccion: salon.idSeccion || ''
                });
              }
            }
            resolve();
          },
          error: (err) => {
            console.error('Error al cargar salón desde listado:', err);
            reject(err);
          }
        });
    });
  }

  cargarDatos(): void {
    this.cargarDatosIniciales();
  }

  guardar(): void {
    if (this.editForm.invalid) {
      // Mostrar errores de validación
      if (this.editForm.get('horaInicio')?.hasError('pattern') || this.editForm.get('horaFin')?.hasError('pattern')) {
        this.error = 'Formato de hora inválido. Use HH:MM:SS (ej: 08:30:00)';
      }
      return;
    }

    this.saving = true;
    this.error = null;

    // Asegurar que las horas tengan el formato correcto
    const datos = {
      horaInicio: this.ensureTimeFormat(this.editForm.value.horaInicio),
      horaFin: this.ensureTimeFormat(this.editForm.value.horaFin),
      tipoId: this.editForm.value.tipo,
      idGrado: this.editForm.value.idGrado,
      idSeccion: this.editForm.value.idSeccion,
      idNivel: this.editForm.value.idNivel,
      idColegio: this.data.idColegio
    };

    console.log('Datos a enviar:', datos);

    this.http.put(`${this.apiBase}/salon/${this.data.id}`, datos, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).subscribe({
      next: (response: string) => {
        this.saving = false;

        this.snackBar.open('✅ Salón actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        this.dialogRef.close({
          success: true,
          data: {
            id: this.data.id,
            message: response
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al actualizar salón:', err);
        this.saving = false;

        // Mostrar detalles completos del error en consola para debugging
        console.error('Detalles completos del error:', err);

        if (err.status === 400) {
          this.error = 'Datos inválidos. Verifique la información.';
          // Mostrar detalles específicos del error 400
          if (err.error && err.error.errors) {
            const errorDetails = Object.entries(err.error.errors)
              .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
              .join('; ');
            this.error += ` Detalles: ${errorDetails}`;
          } else if (err.error) {
            this.error += ` Error: ${JSON.stringify(err.error)}`;
          }
        } else if (err.status === 404) {
          this.error = 'El salón no existe o ha sido eliminado.';
        } else if (err.status === 409) {
          this.error = 'Ya existe un salón con esa configuración.';
        } else if (err.status === 403) {
          this.error = 'No tiene permisos para realizar esta acción.';
        } else if (err.status === 0) {
          this.error = 'Sin conexión al servidor. Verifique su conexión.';
        } else {
          this.error = 'Error al actualizar el salón. Intente nuevamente.';
        }

        // Mostrar mensaje específico del servidor si está disponible
        if (err.error && typeof err.error === 'string') {
          this.error = err.error;
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        }
      }
    });
  }

  // Función para asegurar el formato HH:MM:SS
  private ensureTimeFormat(time: string): string {
    if (!time) return '00:00:00';

    // Si ya tiene el formato correcto, retornarlo
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
      return time;
    }

    // Si tiene formato HH:MM, agregar :00
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return time + ':00';
    }

    // Si es solo números, formatear
    const numbers = time.replace(/\D/g, '');
    if (numbers.length >= 4) {
      return numbers.substring(0, 2) + ':' + numbers.substring(2, 4) + ':' + (numbers.substring(4, 6) || '00');
    }

    return '00:00:00';
  }

  cancelar(): void {
    this.dialogRef.close({ success: false });
  }
}