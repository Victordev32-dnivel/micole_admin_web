import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../../services/UserData';

interface Colegio {
  id: number;
  nombre: string;
  celular: string;
}

@Component({
  selector: 'app-agregar-socio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>{{ data?.socio ? 'edit' : 'person_add' }}</mat-icon>
        {{ data?.socio ? 'Editar Socio' : 'Agregar Nuevo Socio' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="socioForm" (ngSubmit)="onSubmit()" class="socio-form">
          <!-- Nombres -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombres</mat-label>
            <input matInput formControlName="nombres" placeholder="Ingrese los nombres">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="nombres?.hasError('required')">
              Nombres son requeridos
            </mat-error>
            <mat-error *ngIf="nombres?.hasError('maxlength')">
              Máximo 100 caracteres permitidos
            </mat-error>
          </mat-form-field>

          <!-- Apellido Paterno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Paterno</mat-label>
            <input matInput formControlName="apellidoPaterno" placeholder="Ingrese el apellido paterno">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="apellidoPaterno?.hasError('required')">
              Apellido paterno es requerido
            </mat-error>
            <mat-error *ngIf="apellidoPaterno?.hasError('maxlength')">
              Máximo 100 caracteres permitidos
            </mat-error>
          </mat-form-field>

          <!-- Apellido Materno -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Apellido Materno</mat-label>
            <input matInput formControlName="apellidoMaterno" placeholder="Ingrese el apellido materno">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="apellidoMaterno?.hasError('required')">
              Apellido materno es requerido
            </mat-error>
            <mat-error *ngIf="apellidoMaterno?.hasError('maxlength')">
              Máximo 100 caracteres permitidos
            </mat-error>
          </mat-form-field>

          <!-- Número de Documento -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Número de Documento</mat-label>
            <input matInput 
                   formControlName="numeroDocumento" 
                   placeholder="Ingrese el número de documento (8 dígitos)" 
                   type="text" 
                   maxlength="8"
                   pattern="[0-9]*">
            <mat-icon matSuffix>badge</mat-icon>
            <mat-hint>8 dígitos</mat-hint>
            <mat-error *ngIf="numeroDocumento?.hasError('required')">
              Número de documento es requerido
            </mat-error>
            <mat-error *ngIf="numeroDocumento?.hasError('pattern')">
              El número de documento debe tener exactamente 8 dígitos numéricos
            </mat-error>
            <mat-error *ngIf="numeroDocumento?.hasError('minlength') || numeroDocumento?.hasError('maxlength')">
              El número de documento debe tener 8 dígitos
            </mat-error>
          </mat-form-field>

          <!-- Teléfono -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono" placeholder="Ingrese el teléfono">
            <mat-icon matSuffix>phone</mat-icon>
            <mat-error *ngIf="telefono?.hasError('required')">
              Teléfono es requerido
            </mat-error>
            <mat-error *ngIf="telefono?.hasError('maxlength')">
              Máximo 15 caracteres permitidos
            </mat-error>
          </mat-form-field>

          <!-- Contraseña -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="!data?.socio">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="contrasena" placeholder="Ingrese la contraseña">
            <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="contrasena?.hasError('required')">
              Contraseña es requerida
            </mat-error>
            <mat-error *ngIf="contrasena?.hasError('minlength')">
              Mínimo 6 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Selector Múltiple de Colegios -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Colegios</mat-label>
            <mat-select formControlName="idColegios" multiple placeholder="Seleccione uno o más colegios">
              <mat-option *ngFor="let colegio of colegios" [value]="colegio.id">
                {{ colegio.nombre }}
                <span class="colegio-celular"> - {{ colegio.celular }}</span>
              </mat-option>
            </mat-select>
            <mat-icon matSuffix>school</mat-icon>
            <mat-hint>Puede seleccionar múltiples colegios</mat-hint>
            <mat-error *ngIf="idColegios?.hasError('required')">
              Debe seleccionar al menos un colegio
            </mat-error>
          </mat-form-field>

          <!-- Mostrar colegios seleccionados como chips -->
          <div class="selected-colegios" *ngIf="getSelectedColegios().length > 0">
            <div class="chips-label">Colegios seleccionados:</div>
            <mat-chip-set>
              <mat-chip *ngFor="let colegio of getSelectedColegios()" 
                       [removable]="true" 
                       (removed)="removeColegio(colegio.id)">
                {{ colegio.nombre }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            </mat-chip-set>
          </div>

        </form>

        <!-- Indicador de carga para colegios -->
        <div class="loading-colegios" *ngIf="loadingColegios">
          <mat-spinner diameter="30"></mat-spinner>
          <span>Cargando colegios...</span>
        </div>

      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="loading">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="loading || socioForm.invalid">
          <mat-icon *ngIf="!loading">{{ data?.socio ? 'save' : 'add' }}</mat-icon>
          <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
          {{ data?.socio ? 'Actualizar' : 'Agregar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 16px;
      min-width: 450px;
      max-width: 700px;
    }

    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      max-height: 80vh;
      overflow-y: auto;
    }

    .socio-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .selected-colegios {
      margin: 8px 0;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .chips-label {
      font-size: 14px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    mat-chip {
      font-size: 13px;
    }

    .colegio-celular {
      color: #666;
      font-size: 12px;
    }

    .loading-colegios {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      text-align: center;
      color: #666;
    }

    mat-dialog-actions {
      padding: 16px 0 0;
      margin: 0;
      gap: 8px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    mat-icon {
      vertical-align: middle;
      margin-right: 4px;
    }
  `]
})
export class AgregarSocioComponent implements OnInit {
  socioForm: FormGroup;
  loading: boolean = false;
  loadingColegios: boolean = false;
  hidePassword: boolean = true;
  colegios: Colegio[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AgregarSocioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) {
    this.socioForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadColegios();
    
    if (this.data && this.data.socio) {
      this.loadSocioData(this.data.socio);
    } else if (this.data && this.data.colegioId) {
      this.socioForm.patchValue({
        idColegios: [this.data.colegioId]
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoMaterno: ['', [Validators.required, Validators.maxLength(100)]],
      numeroDocumento: ['', [
        Validators.required, 
        Validators.pattern(/^\d{8}$/),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]],
      telefono: ['', [Validators.required, Validators.maxLength(15)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      idColegios: [[], [Validators.required]],
      activo: [true]
    });
  }

  private loadColegios(): void {
    this.loadingColegios = true;
    const url = 'https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista';
    
    this.http.get<any>(url, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response && response.data && Array.isArray(response.data)) {
            this.colegios = response.data;
          } else if (Array.isArray(response)) {
            this.colegios = response;
          } else {
            this.colegios = [];
          }
          this.loadingColegios = false;
        },
        error: (error) => {
          console.error('Error al cargar colegios:', error);
          this.loadingColegios = false;
          this.snackBar.open('Error al cargar la lista de colegios', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private loadSocioData(socio: any): void {
    this.socioForm.patchValue({
      nombres: socio.nombre || socio.nombres || '',
      apellidoPaterno: socio.apellidos?.split(' ')[0] || socio.apellidoPaterno || '',
      apellidoMaterno: socio.apellidos?.split(' ')[1] || socio.apellidoMaterno || '',
      numeroDocumento: socio.dni || socio.numeroDocumento || '',
      telefono: socio.telefono || '',
      idColegios: socio.idColegios || [],
      activo: socio.activo !== undefined ? socio.activo : true
    });

    this.socioForm.get('contrasena')?.clearValidators();
    this.socioForm.get('contrasena')?.updateValueAndValidity();
  }

  getSelectedColegios(): Colegio[] {
    const selectedIds = this.socioForm.get('idColegios')?.value || [];
    return this.colegios.filter(colegio => selectedIds.includes(colegio.id));
  }

  removeColegio(colegioId: number): void {
    const currentSelection = this.socioForm.get('idColegios')?.value || [];
    const newSelection = currentSelection.filter((id: number) => id !== colegioId);
    this.socioForm.patchValue({ idColegios: newSelection });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken || '732612882'}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

onSubmit(): void {
  if (this.socioForm.valid) {
    this.loading = true;
    const formData = this.socioForm.value;
    
    // Crear el objeto con la estructura que espera el backend
    const socioData = {
      nombres: formData.nombres.trim(),
      apellidoPaterno: formData.apellidoPaterno.trim(),
      apellidoMaterno: formData.apellidoMaterno.trim(),
      numeroDocumento: formData.numeroDocumento.toString(),
      telefono: formData.telefono.trim(),
      contrasena: formData.contrasena || '',
      idColegios: formData.idColegios
    };

    const url = 'https://proy-back-dnivel-44j5.onrender.com/api/socios';
    const method = this.data?.socio ? 'put' : 'post';
    const finalUrl = this.data?.socio ? `${url}/${this.data.socio.id}` : url;

    this.http[method](finalUrl, socioData, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.loading = false;
          const selectedColegiosNames = this.getSelectedColegios().map(c => c.nombre).join(', ');
          const message = this.data?.socio 
            ? `Socio actualizado correctamente en: ${selectedColegiosNames}` 
            : `Socio creado correctamente en: ${selectedColegiosNames}`;
          
          this.snackBar.open(message, 'Cerrar', {
            duration: 4000
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al guardar socio:', error);
          this.snackBar.open('Error al guardar el socio', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get nombres() { return this.socioForm.get('nombres'); }
  get apellidoPaterno() { return this.socioForm.get('apellidoPaterno'); }
  get apellidoMaterno() { return this.socioForm.get('apellidoMaterno'); }
  get numeroDocumento() { return this.socioForm.get('numeroDocumento'); }
  get telefono() { return this.socioForm.get('telefono'); }
  get contrasena() { return this.socioForm.get('contrasena'); }
  get idColegios() { return this.socioForm.get('idColegios'); }
}