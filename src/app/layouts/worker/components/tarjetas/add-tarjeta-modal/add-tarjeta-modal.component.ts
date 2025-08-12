import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

interface Alumno {
  id: number;
  numero_documento: string;
  nombre_completo: string;
  codigo: string;
  telefono: string | null;
}

@Component({
  selector: 'app-add-tarjeta-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>credit_card</mat-icon>
        Agregar Nueva Tarjeta
      </h2>
    </div>

    <mat-dialog-content>
      <div
        *ngIf="!data.alumnos || data.alumnos.length === 0"
        class="no-alumnos"
      >
        <mat-icon>info</mat-icon>
        <h3>No hay alumnos disponibles</h3>
        <p>No hay alumnos sin tarjeta asignada en este salón.</p>
      </div>

      <form
        *ngIf="data.alumnos && data.alumnos.length > 0"
        [formGroup]="tarjetaForm"
        class="tarjeta-form"
      >
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Número RFID</mat-label>
          <input
            matInput
            formControlName="rfid"
            type="text"
            placeholder="Ingrese 10 dígitos"
            maxlength="10"
            (input)="onRfidInput($event)"
            required
          />
          <mat-icon matPrefix>nfc</mat-icon>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('required')">
            El RFID es requerido
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('pattern')">
            El RFID debe tener exactamente 10 dígitos numéricos
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('rfid')?.hasError('invalidRfid')">
            El RFID debe ser un número válido de 10 dígitos
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Código de Tarjeta</mat-label>
          <input
            matInput
            formControlName="codigo"
            placeholder="Código identificador"
            required
          />
          <mat-icon matPrefix>qr_code</mat-icon>
          <mat-error *ngIf="tarjetaForm.get('codigo')?.hasError('required')">
            El código es requerido
          </mat-error>
          <mat-error *ngIf="tarjetaForm.get('codigo')?.hasError('minlength')">
            El código debe tener al menos 2 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Buscar y Seleccionar Alumno</mat-label>
          <input
            matInput
            formControlName="alumnoSearch"
            [matAutocomplete]="auto"
            placeholder="Escriba para buscar..."
            (input)="onSearchInput($event)"
            required
          />
          <mat-icon matPrefix>person_search</mat-icon>
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="displayFn"
            (optionSelected)="onAlumnoSelected($event)"
          >
            <mat-option
              *ngFor="let alumno of filteredAlumnos | async"
              [value]="alumno"
              class="alumno-option-auto"
            >
              <div class="alumno-info">
                <div class="alumno-nombre">
                  {{ cleanName(alumno.nombre_completo) }}
                </div>
                <div class="alumno-details">
                  <span class="alumno-codigo"
                    >Código: {{ alumno.codigo || 'Sin código' }}</span
                  >
                  <span class="alumno-documento"
                    >DNI: {{ alumno.numero_documento }}</span
                  >
                </div>
              </div>
            </mat-option>
            <mat-option
              *ngIf="
                (filteredAlumnos | async)?.length === 0 &&
                tarjetaForm.get('alumnoSearch')?.value
              "
              disabled
            >
              No se encontraron alumnos
            </mat-option>
          </mat-autocomplete>
          <mat-error
            *ngIf="tarjetaForm.get('alumnoSearch')?.hasError('required')"
          >
            Debe seleccionar un alumno
          </mat-error>
        </mat-form-field>

        <input type="hidden" formControlName="idAlumno" />

        <div *ngIf="selectedAlumno" class="selected-alumno">
          <mat-icon>check_circle</mat-icon>
          <div class="selected-info">
            <div class="selected-name">
              {{ cleanName(selectedAlumno.nombre_completo) }}
            </div>
            <div class="selected-details">
              <span>ID: {{ selectedAlumno.id }}</span>
              <span>{{ selectedAlumno.codigo || 'Sin código' }}</span>
              <span>DNI: {{ selectedAlumno.numero_documento }}</span>
            </div>
          </div>
          <button
            type="button"
            mat-icon-button
            (click)="clearSelection()"
            class="clear-btn"
            title="Limpiar selección"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="info-field">
          <mat-icon>school</mat-icon>
          <span>Colegio ID: {{ data.colegioId }}</span>
          <span class="alumnos-count"
            >| {{ data.alumnos.length }} alumnos disponibles</span
          >
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button
        *ngIf="data.alumnos && data.alumnos.length > 0"
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!isFormValid()"
        class="submit-btn"
      >
        <mat-icon>save</mat-icon>
        Guardar Tarjeta
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .modal-header {
        padding: 20px 20px 0 20px;
        border-bottom: 1px solid #e0e0e0;
      }

      .modal-header h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #1976d2;
        font-size: 20px;
        font-weight: 500;
        margin: 0;
      }

      .modal-header mat-icon {
        color: #42a5f5;
      }

      .tarjeta-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px 0;
      }

      .form-field {
        width: 100%;
      }

      .form-field .mat-form-field-prefix mat-icon {
        color: #666;
        margin-right: 8px;
      }

      .info-field {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: #f5f5f5;
        border-radius: 4px;
        color: #666;
        font-size: 14px;
      }

      .info-field mat-icon {
        color: #1976d2;
        font-size: 20px;
      }

      .alumnos-count {
        color: #4caf50;
        font-weight: 500;
      }

      .alumno-option-auto {
        padding: 0 !important;
      }

      .alumno-info {
        padding: 8px 0;
        width: 100%;
      }

      .alumno-nombre {
        font-weight: 500;
        color: #333;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .alumno-details {
        display: flex;
        gap: 12px;
        font-size: 12px;
        flex-wrap: wrap;
      }

      .alumno-codigo {
        color: #666;
        font-family: monospace;
        background-color: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
      }

      .alumno-documento {
        color: #999;
      }

      .selected-alumno {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 8px;
        position: relative;
        animation: fadeIn 0.3s ease-in;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .selected-alumno mat-icon:first-child {
        color: #4caf50;
        font-size: 24px;
      }

      .selected-info {
        flex: 1;
      }

      .selected-name {
        font-weight: 500;
        color: #2e7d2e;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .selected-details {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: #666;
        flex-wrap: wrap;
      }

      .selected-details span {
        background-color: rgba(255, 255, 255, 0.5);
        padding: 2px 6px;
        border-radius: 3px;
      }

      .clear-btn {
        color: #666;
        width: 32px;
        height: 32px;
        transition: all 0.2s ease;
      }

      .clear-btn:hover {
        background-color: rgba(244, 67, 54, 0.1);
        color: #f44336;
      }

      .clear-btn mat-icon {
        font-size: 18px;
      }

      .no-alumnos {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        padding: 40px 20px;
        text-align: center;
        color: #666;
      }

      .no-alumnos mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #ff9800;
      }

      .no-alumnos h3 {
        margin: 0;
        color: #333;
        font-size: 18px;
      }

      .no-alumnos p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      mat-dialog-content {
        padding: 0 20px !important;
        min-height: 300px;
      }

      mat-dialog-actions {
        padding: 20px !important;
        background-color: #fafafa;
        border-top: 1px solid #e0e0e0;
        gap: 10px;
      }

      .cancel-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #666;
        transition: all 0.2s ease;
      }

      .cancel-btn:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .submit-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 150px;
        transition: all 0.2s ease;
      }

      .submit-btn:disabled {
        background-color: #e0e0e0 !important;
        color: #999 !important;
      }

      .submit-btn:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
      }

      .mat-error {
        font-size: 12px;
        margin-top: 5px;
      }

      ::ng-deep .mat-autocomplete-panel {
        max-height: 300px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      ::ng-deep .mat-option {
        height: auto !important;
        line-height: normal !important;
        padding: 8px 16px !important;
        transition: all 0.2s ease;
      }

      ::ng-deep .mat-option:hover {
        background-color: #f5f5f5 !important;
      }

      ::ng-deep .mat-option.mat-active {
        background-color: #e3f2fd !important;
      }

      @media (max-width: 600px) {
        .modal-header {
          padding: 15px;
        }

        .modal-header h2 {
          font-size: 18px;
        }

        mat-dialog-content {
          padding: 0 15px !important;
        }

        mat-dialog-actions {
          padding: 15px !important;
          flex-direction: column-reverse;
        }

        .cancel-btn,
        .submit-btn {
          width: 100%;
          justify-content: center;
        }

        .selected-details,
        .alumno-details {
          flex-direction: column;
          gap: 4px;
        }

        .selected-details span,
        .alumno-details span {
          align-self: flex-start;
        }
      }
    `,
  ],
})
export class AddTarjetaModalComponent {
  tarjetaForm: FormGroup;
  filteredAlumnos: Observable<Alumno[]>;
  selectedAlumno: Alumno | null = null;
  private _alumnos: Alumno[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddTarjetaModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      colegioId: number;
      alumnos: Alumno[];
    }
  ) {
    // Limpiar nombres de alumnos al inicializar
    this._alumnos = this.data.alumnos.map((alumno) => ({
      ...alumno,
      nombre_completo: this.cleanName(alumno.nombre_completo),
    }));

    this.tarjetaForm = this.fb.group({
      rfid: ['', [Validators.required, this.rfidValidator]],
      codigo: ['', [Validators.required, Validators.minLength(2)]],
      alumnoSearch: ['', Validators.required],
      idAlumno: ['', Validators.required],
      idColegio: [this.data.colegioId, Validators.required],
    });

    this.filteredAlumnos = this.tarjetaForm
      .get('alumnoSearch')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => this._filter(value))
      );
  }

  private rfidValidator(control: any) {
    if (!control.value) return null;
    const value = control.value.toString();
    if (!/^\d{10}$/.test(value)) return { pattern: true };
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return { invalidRfid: true };
    return null;
  }

  private _filter(value: string | Alumno): Alumno[] {
    // Si el valor es un objeto (Alumno seleccionado), no filtrar
    if (typeof value === 'object' && value !== null) {
      return this._alumnos;
    }

    const filterValue = (value as string)?.toLowerCase() || '';

    if (!filterValue.trim()) {
      return this._alumnos;
    }

    return this._alumnos.filter((alumno) => {
      const nombre = alumno.nombre_completo.toLowerCase();
      const codigo = (alumno.codigo || '').toLowerCase();
      const documento = alumno.numero_documento.toLowerCase();

      return (
        nombre.includes(filterValue) ||
        codigo.includes(filterValue) ||
        documento.includes(filterValue)
      );
    });
  }

  onSearchInput(event: any): void {
    const inputValue = event.target.value;

    // Si hay una selección previa y el usuario está escribiendo algo diferente, limpiar la selección
    if (
      this.selectedAlumno &&
      inputValue !== this.selectedAlumno.nombre_completo
    ) {
      this.clearSelection();
    }
  }

  onAlumnoSelected(event: any): void {
    const alumno: Alumno = event.option.value;

    // Actualizar la selección
    this.selectedAlumno = alumno;

    // Actualizar los controles del formulario sin emitir eventos
    this.tarjetaForm.patchValue(
      {
        idAlumno: alumno.id,
        alumnoSearch: alumno.nombre_completo,
      },
      { emitEvent: false }
    );

    // Forzar la validación
    this.tarjetaForm.get('alumnoSearch')?.updateValueAndValidity();
    this.tarjetaForm.get('idAlumno')?.updateValueAndValidity();
  }

  displayFn(alumno: Alumno): string {
    return alumno ? alumno.nombre_completo : '';
  }

  clearSelection(): void {
    this.selectedAlumno = null;
    this.tarjetaForm.patchValue({
      idAlumno: '',
      alumnoSearch: '',
    });
    this.tarjetaForm.get('alumnoSearch')?.updateValueAndValidity();
  }

  onRfidInput(event: any): void {
    const value = event.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    if (value !== numericValue) {
      this.tarjetaForm.patchValue({ rfid: numericValue });
    }
  }

  cleanName(name: string): string {
    return name?.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim() || '';
  }

  isFormValid(): boolean {
    return this.tarjetaForm.valid && !!this.selectedAlumno;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onSubmit(): void {
    if (this.isFormValid()) {
      const formData = this.tarjetaForm.value;

      const tarjetaData = {
        rfid: Number(formData.rfid),
        codigo: formData.codigo.trim(),
        idAlumno: Number(formData.idAlumno),
        idColegio: Number(formData.idColegio),
      };

      // AGREGAR ESTOS LOGS PARA DEBUG:
      console.log('📤 Datos finales antes de enviar:', tarjetaData);
      console.log('🔍 Tipos de datos:', {
        rfid: typeof tarjetaData.rfid,
        codigo: typeof tarjetaData.codigo,
        idAlumno: typeof tarjetaData.idAlumno,
        idColegio: typeof tarjetaData.idColegio,
      });
      console.log('✅ Validaciones:', {
        rfidEsNumero: !isNaN(tarjetaData.rfid),
        rfidTiene10Digitos: tarjetaData.rfid.toString().length === 10,
        codigoNoVacio: tarjetaData.codigo.length > 0,
        idAlumnoValido: tarjetaData.idAlumno > 0,
        idColegioValido: tarjetaData.idColegio > 0,
      });

      this.dialogRef.close(tarjetaData);
    }
  }
}
