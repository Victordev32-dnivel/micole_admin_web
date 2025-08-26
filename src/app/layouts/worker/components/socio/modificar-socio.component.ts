import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatOptionModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../services/UserData';

interface SocioData {
  id: number;
  nombre: string;
  apellidos: string; // ✅ CAMPO REQUERIDO PARA LA ACTUALIZACIÓN
  dni: string;
  telefono: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  contrasena?: string;
  idColegios?: number[];
  nomColegios?: string[];
}

interface Colegio {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modificar-socio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatOptionModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>edit</mat-icon>
          Modificar Socio
        </h2>
        <button
          mat-icon-button
          (click)="onCancel()"
          class="close-button"
          type="button"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="socioForm" class="socio-form">
          <!-- Nombre -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre *</mat-label>
            <input
              matInput
              formControlName="nombre"
              placeholder="Ingrese el nombre"
              maxlength="50"
            />
            <mat-error *ngIf="socioForm.get('nombre')?.hasError('required')">
              El nombre es requerido
            </mat-error>
            <mat-error *ngIf="socioForm.get('nombre')?.hasError('minlength')">
              El nombre debe tener al menos 2 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Apellido Paterno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Paterno *</mat-label>
            <input
              matInput
              formControlName="apellidoPaterno"
              placeholder="Ingrese el apellido paterno"
              maxlength="50"
            />
            <mat-error *ngIf="socioForm.get('apellidoPaterno')?.hasError('required')">
              El apellido paterno es requerido
            </mat-error>
            <mat-error *ngIf="socioForm.get('apellidoPaterno')?.hasError('minlength')">
              El apellido paterno debe tener al menos 2 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Apellido Materno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Materno</mat-label>
            <input
              matInput
              formControlName="apellidoMaterno"
              placeholder="Ingrese el apellido materno (opcional)"
              maxlength="50"
            />
          </mat-form-field>

          <!-- DNI -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>DNI *</mat-label>
            <input
              matInput
              formControlName="dni"
              placeholder="12345678"
              maxlength="8"
              type="text"
              (input)="onDniInput($event)"
            />
            <mat-error *ngIf="socioForm.get('dni')?.hasError('required')">
              El DNI es requerido
            </mat-error>
            <mat-error *ngIf="socioForm.get('dni')?.hasError('pattern')">
              El DNI debe tener exactamente 8 dígitos numéricos
            </mat-error>
          </mat-form-field>

          <!-- Teléfono -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono *</mat-label>
            <input
              matInput
              formControlName="telefono"
              placeholder="987654321"
              maxlength="15"
              type="tel"
            />
            <mat-error *ngIf="socioForm.get('telefono')?.hasError('required')">
              El teléfono es requerido
            </mat-error>
            <mat-error *ngIf="socioForm.get('telefono')?.hasError('minlength')">
              El teléfono debe tener al menos 7 dígitos
            </mat-error>
          </mat-form-field>

          <!-- Contraseña -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nueva Contraseña (opcional)</mat-label>
            <input
              matInput
              formControlName="contrasena"
              placeholder="Dejar vacío para mantener la actual"
              type="text"
              maxlength="100"
            />
            <mat-error *ngIf="socioForm.get('contrasena')?.hasError('minlength')">
              La contraseña debe tener al menos 6 caracteres
            </mat-error>
          </mat-form-field>

          <!-- SELECTOR DE COLEGIOS -->
          <div class="colegios-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Colegios Asociados</mat-label>
              <mat-select
                formControlName="idColegios"
                multiple
                placeholder="Seleccione uno o más colegios (opcional)"
                (selectionChange)="onColegiosChange($event)"
              >
                <mat-option
                  *ngFor="let colegio of colegiosDisponibles; trackBy: trackByColegio"
                  [value]="colegio.id"
                  [disabled]="colegiosDisponibles.length === 0"
                >
                  {{ colegio.nombre || 'Colegio Desconocido (ID: ' + colegio.id + ')' }}
                </mat-option>
              </mat-select>

              <mat-error *ngIf="socioForm.get('idColegios')?.hasError('maxSelection')">
                Máximo {{ maxColegiosPermitidos }} colegios permitidos
              </mat-error>

              <mat-hint>
                Seleccionados: {{ getSelectedColegios().length }} de {{ maxColegiosPermitidos }}
              </mat-hint>
            </mat-form-field>

            <!-- Botones de acción rápida -->
            <div class="colegios-actions">
              <button
                mat-stroked-button
                type="button"
                (click)="selectAllColegios()"
                [disabled]="colegiosDisponibles.length === 0"
                class="action-button"
              >
                <mat-icon>select_all</mat-icon>
                Seleccionar Todos
              </button>

              <button
                mat-stroked-button
                type="button"
                (click)="clearSelection()"
                [disabled]="getSelectedColegios().length === 0"
                class="action-button"
              >
                <mat-icon>clear</mat-icon>
                Limpiar
              </button>
            </div>

            <!-- Chips de colegios seleccionados -->
            <div class="selected-colegios-chips" *ngIf="getSelectedColegios().length > 0">
              <h4>Colegios Seleccionados:</h4>
              <mat-chip-set>
                <mat-chip
                  *ngFor="let colegio of getSelectedColegios(); trackBy: trackByColegio"
                  [removable]="true"
                  (removed)="removeColegioChip(colegio.id)"
                  class="colegio-chip"
                >
                  {{ colegio.nombre || 'Colegio Desconocido (ID: ' + colegio.id + ')' }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip>
              </mat-chip-set>
            </div>

            <!-- Mensaje cuando no hay colegios disponibles -->
            <div *ngIf="colegiosDisponibles.length === 0" class="no-colegios-message">
              <p>No se pudieron cargar los colegios. Los colegios actuales del socio se mantendrán.</p>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button
          mat-button
          (click)="onCancel()"
          type="button"
          [disabled]="loading"
        >
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSubmit()"
          type="button"
          [disabled]="!socioForm.valid || loading"
        >
          <mat-spinner
            *ngIf="loading"
            diameter="20"
            class="button-spinner"
          ></mat-spinner>
          <mat-icon *ngIf="!loading">save</mat-icon>
          {{ loading ? 'Actualizando...' : 'Actualizar Socio' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        display: flex;
        flex-direction: column;
        min-height: 600px;
        width: 100%;
        max-width: 600px;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 0 24px;
        margin-bottom: 16px;
      }

      .dialog-header h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #1976d2;
        font-weight: 500;
      }

      .close-button {
        color: #666;
      }

      .dialog-content {
        flex: 1;
        padding: 0 24px;
        margin-bottom: 0;
        overflow-y: auto;
      }

      .socio-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 100%;
      }

      .full-width {
        width: 100%;
      }

      .colegios-section {
        margin-top: 8px;
      }

      .colegios-actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;
        margin-bottom: 16px;
      }

      .action-button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .selected-colegios-chips {
        margin-top: 16px;
      }

      .selected-colegios-chips h4 {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 14px;
        font-weight: 500;
      }

      .colegio-chip {
        margin: 4px;
      }

      .dialog-actions {
        justify-content: flex-end;
        padding: 16px 24px 20px 24px;
        gap: 8px;
      }

      .button-spinner {
        display: inline-block;
        margin-right: 8px;
        vertical-align: middle;
      }

      .no-colegios-message {
        color: #d32f2f;
        font-size: 14px;
        margin-top: 8px;
        padding: 8px;
        background-color: #ffebee;
        border-radius: 4px;
      }
    `,
  ],
})
export class ModificarSocioComponent implements OnInit, OnDestroy {
  socioForm: FormGroup;
  loading = false;
  colegioId: number;
  socioData: SocioData;
  colegiosDisponibles: Colegio[] = [];
  maxColegiosPermitidos = 5;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ModificarSocioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { socio: SocioData; colegioId: number }
  ) {
    this.colegioId = data.colegioId;
    this.socioData = data.socio;

    this.socioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidoMaterno: ['', [Validators.maxLength(50)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      contrasena: ['', [Validators.minLength(6)]],
      idColegios: [[], [this.maxColegiosValidator.bind(this)]],
    });
  }

  ngOnInit() {
    console.log('🚀 ModificarSocioComponent inicializado');
    console.log('📋 Datos del socio a modificar:', this.socioData);
    this.loadSocioData();
    this.loadColegiosDisponibles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private maxColegiosValidator(control: FormControl) {
    const value = control.value as number[];
    if (value?.length > this.maxColegiosPermitidos) {
      return { maxSelection: true };
    }
    return null;
  }

  private loadSocioData(): void {
    console.log('📝 Cargando datos del socio en el formulario...');
    
    const apellidos = this.socioData.apellidos?.trim() || '';
    const apellidosArray = apellidos.split(/\s+/).filter(part => part.length > 0);

    // Handle invalid DNI
    let dni = this.socioData.dni?.trim() || '';
    if (!/^\d{8}$/.test(dni)) {
      console.warn(`⚠️ DNI inválido: ${dni}. Se usará un valor temporal.`);
      dni = '';
      this.snackBar.open('El DNI proporcionado no es válido. Por favor, ingrese un DNI de 8 dígitos.', 'Cerrar', {
        duration: 5000,
      });
    }

    // Initialize colegiosDisponibles with socio's colleges
    if (this.socioData.idColegios && this.socioData.nomColegios) {
      this.colegiosDisponibles = this.socioData.idColegios.map((id, index) => ({
        id,
        nombre: (this.socioData.nomColegios?.[index]?.trim() || `Colegio Desconocido (ID: ${id})`),
      })).filter(colegio => colegio.nombre && colegio.nombre !== ',');
      console.log('🏫 Colegios inicializados:', this.colegiosDisponibles);
    }

    const formData = {
      nombre: this.socioData.nombre?.trim() || '',
      apellidoPaterno: this.socioData.apellidoPaterno || apellidosArray[0] || '',
      apellidoMaterno: this.socioData.apellidoMaterno || (apellidosArray.length > 1 ? apellidosArray.slice(1).join(' ') : ''),
      dni: this.socioData.dni,
      telefono: this.socioData.telefono?.trim() || '',
      contrasena: '', // ✅ SIEMPRE VACÍO INICIALMENTE
      idColegios: this.socioData.idColegios?.length ? this.socioData.idColegios : [],
    };

    console.log('📝 Datos cargados en el formulario:', formData);
    this.socioForm.patchValue(formData);

    // Mark DNI as touched if invalid to show error immediately
    if (!dni) {
      this.socioForm.get('dni')?.markAsTouched();
    }

    this.cdr.detectChanges();
  }

  private loadColegiosDisponibles(): void {
    console.log('🏫 Cargando lista de colegios disponibles...');
    const url = 'https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista';

    this.http
      .get<Colegio[]>(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta de colegios:', response);
          
          const newColegios = Array.isArray(response)
            ? response
            : response?.['data'] || response?.['colegios'] || [];

          // Merge API colleges with socio's colleges
          if (this.socioData.idColegios && this.socioData.nomColegios) {
            this.socioData.idColegios.forEach((id, index) => {
              if (!newColegios.some(colegio => colegio.id === id)) {
                newColegios.push({
                  id,
                  nombre: (this.socioData.nomColegios?.[index]?.trim() || `Colegio Desconocido (ID: ${id})`),
                });
              }
            });
          }

          // Filter out invalid entries and ensure unique IDs
          this.colegiosDisponibles = newColegios
            .filter(colegio => colegio.id && colegio.nombre && colegio.nombre !== ',')
            .reduce((unique, colegio) => {
              return unique.some(c => c.id === colegio.id) ? unique : [...unique, colegio];
            }, [] as Colegio[]);

          console.log('🏫 Colegios disponibles procesados:', this.colegiosDisponibles);

          if (!this.colegiosDisponibles.length) {
            this.snackBar.open('No se encontraron colegios disponibles. Usando colegios actuales del socio.', 'Cerrar', {
              duration: 5000,
            });
          }

          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Error al cargar colegios:', error);
          this.snackBar.open(
            `Error al cargar colegios: ${error.status === 404 ? 'Endpoint no encontrado' : 'Error del servidor'}. Usando colegios actuales del socio.`,
            'Cerrar',
            { duration: 5000 }
          );
          this.cdr.detectChanges();
        },
      });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  trackByColegio(_index: number, colegio: Colegio): number {
    return colegio?.id ?? _index;
  }

  onColegiosChange(event: any): void {
    const selectedIds = event.value as number[];
    if (selectedIds.length > this.maxColegiosPermitidos) {
      const limitedSelection = selectedIds.slice(0, this.maxColegiosPermitidos);
      this.socioForm.patchValue({ idColegios: limitedSelection });
      this.snackBar.open(`Máximo ${this.maxColegiosPermitidos} colegios permitidos`, 'Cerrar', { duration: 3000 });
    }
    console.log('🏫 Colegios seleccionados:', selectedIds);
  }

  getSelectedColegios(): Colegio[] {
    const selectedIds = this.socioForm.get('idColegios')?.value as number[] || [];
    const selected = this.colegiosDisponibles.filter(colegio => colegio && selectedIds.includes(colegio.id));
    return selected;
  }

  selectAllColegios(): void {
    const allIds = this.colegiosDisponibles
      .slice(0, this.maxColegiosPermitidos)
      .map(c => c.id);
    this.socioForm.patchValue({ idColegios: allIds });
    console.log('🏫 Seleccionados todos los colegios:', allIds);
  }

  clearSelection(): void {
    this.socioForm.patchValue({ idColegios: [] });
    console.log('🏫 Selección de colegios limpiada');
  }

  removeColegioChip(colegioId: number): void {
    const currentSelection = this.socioForm.get('idColegios')?.value as number[] || [];
    const newSelection = currentSelection.filter(id => id !== colegioId);
    this.socioForm.patchValue({ idColegios: newSelection });
    console.log('🏫 Colegio removido, nueva selección:', newSelection);
  }

  onDniInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 8);
    this.socioForm.patchValue({ dni: value });
    input.value = value;
  }

  onSubmit(): void {
    console.log('📤 Intentando enviar formulario...');
    console.log('📋 Formulario válido:', this.socioForm.valid);
    console.log('📋 Valores del formulario:', this.socioForm.value);
    
    if (!this.socioForm.valid || this.loading) {
      console.log('❌ Formulario inválido o cargando, marcando campos como touched');
      this.markAllFieldsAsTouched();
      return;
    }
    this.updateSocio();
  }

  private markAllFieldsAsTouched(): void {
    Object.values(this.socioForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // ✅ MÉTODO CORREGIDO CON APELLIDOS COMPLETOS
  private updateSocio(): void {
    console.log('🔄 Iniciando actualización del socio...');
    this.loading = true;
    const formValue = this.socioForm.value;

    // ✅ RECONSTRUIR EL CAMPO APELLIDOS
    const apellidoPaterno = formValue.apellidoPaterno?.trim() || '';
    const apellidoMaterno = formValue.apellidoMaterno?.trim() || '';
    const apellidosCompletos = apellidoMaterno 
      ? `${apellidoPaterno} ${apellidoMaterno}`.trim()
      : apellidoPaterno;

    const updateData: Partial<SocioData> = {
      nombre: formValue.nombre.trim(),
      apellidos: apellidosCompletos, // ✅ CAMPO PRINCIPAL REQUERIDO
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaterno,
      contrasena: formValue.contrasena?.trim() || '', // ✅ SIEMPRE ENVIAR, AUNQUE ESTÉ VACÍO
      dni: formValue.dni.trim(),
      telefono: formValue.telefono.trim(),
      idColegios: formValue.idColegios || [],
    };

    console.log('📋 Datos originales del socio:', this.socioData);
    console.log('📝 Valores del formulario:', formValue);
    console.log('📤 Payload de actualización:', updateData);

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/${this.socioData.id}`;
    console.log('🌐 URL de actualización:', url);

    this.http
      .put<SocioData>(url, updateData, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Actualización exitosa, respuesta del servidor:', response);
          this.ngZone.run(() => {
            this.loading = false;
            this.snackBar.open('✅ Socio actualizado correctamente', 'Cerrar', {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });
            console.log('🔄 Cerrando diálogo con resultado: true');
            this.dialogRef.close(true); // ✅ ESTO DEBE ACTIVAR LA RECARGA EN EL COMPONENTE PADRE
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Error en la actualización:', error);
          console.error('❌ Status:', error.status);
          console.error('❌ Error body:', error.error);
          
          this.ngZone.run(() => {
            this.loading = false;
            const errorMessages: { [key: number]: string } = {
              400: 'Datos inválidos. Verifique la información ingresada.',
              404: 'Socio no encontrado. Es posible que el socio no exista.',
              409: 'El DNI ya existe en el sistema.',
            };

            const errorMessage = errorMessages[error.status] || 'Error al actualizar el socio. Por favor, intenta de nuevo.';

            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            });
          });
        },
      });
  }

  onCancel(): void {
    console.log('❌ Cancelando edición del socio');
    this.dialogRef.close(false);
  }
}