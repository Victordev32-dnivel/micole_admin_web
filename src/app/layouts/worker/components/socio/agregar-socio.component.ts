import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserData, UserService } from '../../../../services/UserData';

interface Colegio {
  id: number;
  nombre: string;
  celular: string;
}

// Componente de diálogo para agregar/editar socio
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
            <input matInput formControlName="numeroDocumento" placeholder="Ingrese el número de documento (8 dígitos)" type="number">
            <mat-icon matSuffix>badge</mat-icon>
            <mat-hint>8 dígitos</mat-hint>
            <mat-error *ngIf="numeroDocumento?.hasError('required')">
              Número de documento es requerido
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

          <!-- Contraseña (solo para creación) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="!data?.socio">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="contrasena" placeholder="Ingrese la contraseña">
            <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" [attr.aria-label]="'Ocultar contraseña'" [attr.aria-pressed]="hidePassword">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="contrasena?.hasError('required')">
              Contraseña es requerida
            </mat-error>
            <mat-error *ngIf="contrasena?.hasError('minlength')">
              Mínimo 6 caracteres
            </mat-error>
          </mat-form-field>

          <!-- Email (opcional) - REMOVIDO -->

          <!-- Estado Activo - REMOVIDO -->

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

    /* Ajustar el label de Nombres para que baje */
    ::ng-deep .mat-form-field-label {
      top: 1.34375em !important;
    }

    ::ng-deep .mat-form-field-outline .mat-form-field-label {
      top: -0.84375em !important;
    }

    /* Ajustar específicamente el campo de Nombres */
    ::ng-deep mat-form-field:first-of-type .mat-form-field-label {
      top: 1.5em !important;
    }

    ::ng-deep mat-form-field:first-of-type .mat-form-field-outline .mat-form-field-label {
      top: -0.75em !important;
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

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
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

    /* Estilos para el select múltiple */
    ::ng-deep .mat-select-panel .mat-option {
      padding: 8px 16px;
    }

    ::ng-deep .mat-select-panel .mat-option .mat-option-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
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
    
    // Si estamos editando, cargar los datos del socio
    if (this.data && this.data.socio) {
      this.loadSocioData(this.data.socio);
    } else if (this.data && this.data.colegioId) {
      // Si venimos de un colegio específico, preseleccionarlo
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
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      telefono: ['', [Validators.required, Validators.maxLength(15)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      idColegios: [[], [Validators.required]], // Array de IDs de colegios
      activo: [true]
    });
  }

  private loadColegios(): void {
    console.log('🏫 Cargando lista de colegios...');
    this.loadingColegios = true;
    
    const url = 'https://proy-back-dnivel-44j5.onrender.com/api/colegio/lista';
    
    this.http.get<any>(url, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('✅ Colegios cargados:', response);
          
          // Manejar la estructura de respuesta
          if (response && response.data && Array.isArray(response.data)) {
            this.colegios = response.data;
          } else if (Array.isArray(response)) {
            this.colegios = response;
          } else {
            console.warn('⚠️ Estructura de respuesta inesperada para colegios');
            this.colegios = [];
          }
          
          this.loadingColegios = false;
          console.log(`📚 ${this.colegios.length} colegios disponibles`);
        },
        error: (error) => {
          console.error('❌ Error al cargar colegios:', error);
          this.loadingColegios = false;
          
          this.snackBar.open('❌ Error al cargar la lista de colegios', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
        }
      });
  }

  private loadSocioData(socio: any): void {
    console.log('📝 Cargando datos del socio para edición:', socio);
    
    this.socioForm.patchValue({
      nombres: socio.nombres || socio.nombre || '',
      apellidoPaterno: socio.apellidoPaterno || '',
      apellidoMaterno: socio.apellidoMaterno || '',
      numeroDocumento: socio.numeroDocumento || socio.dni || '',
      telefono: socio.telefono || '',
      idColegios: socio.idColegios || socio.colegios?.map((c: any) => c.id) || [],
      activo: socio.activo !== undefined ? socio.activo : true
    });

    // Remover validación de contraseña para edición
    this.socioForm.get('contrasena')?.clearValidators();
    this.socioForm.get('contrasena')?.updateValueAndValidity();
  }

  // Obtener colegios seleccionados para mostrar como chips
  getSelectedColegios(): Colegio[] {
    const selectedIds = this.socioForm.get('idColegios')?.value || [];
    return this.colegios.filter(colegio => selectedIds.includes(colegio.id));
  }

  // Remover un colegio de la selección
  removeColegio(colegioId: number): void {
    const currentSelection = this.socioForm.get('idColegios')?.value || [];
    const newSelection = currentSelection.filter((id: number) => id !== colegioId);
    this.socioForm.patchValue({ idColegios: newSelection });
  }

  // Obtener headers con autenticación
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
      
      // Preparar datos para enviar según la estructura requerida
      const socioData = {
        nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono,
        contrasena: formData.contrasena,
        idColegios: formData.idColegios // Array de IDs de colegios
      };

      console.log('📤 Enviando datos del socio:', socioData);

      const url = 'https://proy-back-dnivel-44j5.onrender.com/api/socios';
      const method = this.data?.socio ? 'put' : 'post';
      const finalUrl = this.data?.socio ? `${url}/${this.data.socio.id}` : url;

      this.http[method](finalUrl, socioData, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            console.log('✅ Socio guardado exitosamente:', response);
            this.loading = false;
            
            const selectedColegiosNames = this.getSelectedColegios().map(c => c.nombre).join(', ');
            const message = this.data?.socio 
              ? `✅ Socio actualizado correctamente en: ${selectedColegiosNames}` 
              : `✅ Socio creado correctamente en: ${selectedColegiosNames}`;
            
            this.snackBar.open(message, 'Cerrar', {
              duration: 4000,
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            console.error('❌ Error al guardar socio:', error);
            
            let errorMessage = `Error al ${this.data?.socio ? 'actualizar' : 'crear'} el socio`;
            
            if (error.status === 400) {
              errorMessage = error.error?.message || 'Datos inválidos';
            } else if (error.status === 409) {
              errorMessage = 'El DNI ya existe para otro socio';
            } else if (error.status === 0) {
              errorMessage = 'Error de conexión. Verifique su internet';
            } else if (error.error) {
              errorMessage = error.error.message || errorMessage;
            }
            
            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
          }
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.socioForm.controls).forEach(key => {
        this.socioForm.get(key)?.markAsTouched();
      });
      
      this.snackBar.open('❌ Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters para acceder fácilmente a los controles del formulario
  get nombres() { return this.socioForm.get('nombres'); }
  get apellidoPaterno() { return this.socioForm.get('apellidoPaterno'); }
  get apellidoMaterno() { return this.socioForm.get('apellidoMaterno'); }
  get numeroDocumento() { return this.socioForm.get('numeroDocumento'); }
  get telefono() { return this.socioForm.get('telefono'); }
  get contrasena() { return this.socioForm.get('contrasena'); }
  get idColegios() { return this.socioForm.get('idColegios'); }
}

// Componente principal de socios (sin cambios significativos)
@Component({
  selector: 'app-socio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    AgregarSocioComponent
  ],
  templateUrl: './socio.component.html',
  styleUrls: ['./socio.component.css'],
})
export class SocioComponent implements OnInit, OnDestroy {
  socios: any[] = [];
  filteredSocios: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTermControl = new FormControl('');
  colegioId: number | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('🚀 SocioComponent inicializado');
    this.loadUserData();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    console.log('📊 Cargando datos de usuario...');
    
    // Obtener datos del usuario al inicializar
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      console.log('🏫 ID del colegio:', this.colegioId);
      this.loadSocios();
    } else {
      console.log('❌ No se pudieron obtener datos del usuario inicialmente');
      this.error = 'No se pudieron obtener los datos del usuario';
      this.loading = false;
    }

    // Suscribirse a cambios en los datos del usuario
    this.userService.userData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((userData: UserData | null) => {
        console.log('🔄 Actualización de datos de usuario:', userData);
        if (userData && userData.colegio !== this.colegioId) {
          this.colegioId = userData.colegio;
          this.loadSocios();
        }
      });
  }

  private setupSearch(): void {
    this.searchTermControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        this.filterSocios(term || '');
      });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    console.log('🔑 Token para headers:', jwtToken ? 'Presente' : 'Ausente');
    
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken || '732612882'}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  loadSocios() {
    console.log('📋 Cargando socios...');
    
    // Validar que tengamos el ID del colegio
    if (!this.colegioId) {
      console.error('❌ ID del colegio no disponible');
      this.error = 'Error: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/colegio/lista/${this.colegioId}`;
    console.log('🌐 URL de solicitud:', url);

    this.http
      .get<any>(url, {
        headers: this.getHeaders(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          console.log('✅ Respuesta exitosa:', resp);
          this.ngZone.run(() => {
            // Manejo más robusto de la respuesta
            let sociosData = [];
            if (Array.isArray(resp)) {
              sociosData = resp;
            } else if (resp && resp.data && Array.isArray(resp.data)) {
              sociosData = resp.data;
            } else if (resp && resp.socios && Array.isArray(resp.socios)) {
              sociosData = resp.socios;
            } else if (resp && typeof resp === 'object') {
              // Si la respuesta es un objeto pero no tiene data, intentar extraer los socios
              const keys = Object.keys(resp);
              if (keys.length === 1 && Array.isArray(resp[keys[0]])) {
                sociosData = resp[keys[0]];
              }
            }

            this.socios = sociosData;
            this.filteredSocios = [...this.socios];
            this.loading = false;
            console.log(`👥 ${this.socios.length} socios cargados`);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ Error al cargar socios:', error);
          this.ngZone.run(() => {
            let errorMessage = 'Error al cargar los socios. Intente de nuevo';
            
            if (error.status === 404) {
              errorMessage = 'No se encontraron socios para este colegio';
            } else if (error.status === 403) {
              errorMessage = 'No tiene permisos para acceder a esta información';
            } else if (error.status === 401) {
              errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
            } else if (error.status === 0) {
              errorMessage = 'Error de conexión. Verifique su internet';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.error = errorMessage;
            this.loading = false;
            
            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            
            this.cdr.detectChanges();
          });
        },
      });
  }

  filterSocios(term: string) {
    this.ngZone.run(() => {
      const search = term.toLowerCase().trim();
      if (!search) {
        this.filteredSocios = [...this.socios];
        return;
      }
      
      this.filteredSocios = this.socios.filter((socio) => {
        const byNombres = socio?.nombres?.toLowerCase()?.includes(search) || 
                         socio?.nombre?.toLowerCase()?.includes(search) || false;
        const byApellidoPaterno = socio?.apellidoPaterno?.toLowerCase()?.includes(search) || false;
        const byApellidoMaterno = socio?.apellidoMaterno?.toLowerCase()?.includes(search) || false;
        const byNumeroDocumento = socio?.numeroDocumento?.toLowerCase?.()?.includes(search) || 
                                 socio?.dni?.toLowerCase?.()?.includes(search) || 
                                 (socio?.numeroDocumento || socio?.dni || '').toString().toLowerCase().includes(search);
        const byTelefono = socio?.telefono?.toLowerCase()?.includes(search) || 
                          (socio?.telefono || '').toString().includes(search);
        
        return byNombres || byApellidoPaterno || byApellidoMaterno || byNumeroDocumento || byTelefono;
      });
      
      console.log(`🔍 Filtrado: ${this.filteredSocios.length} de ${this.socios.length} socios`);
      this.cdr.detectChanges();
    });
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  // Método para abrir cliente de email
  openEmailClient(email: string): void {
    if (email && email !== 'N/A') {
      window.open(`mailto:${email}`, '_blank');
    }
  }

  // Método para tracking en ngFor (mejor performance)
  trackBySocioId(index: number, socio: any): any {
    return socio.id || socio.numeroDocumento || socio.dni || index;
  }

  openAddDialog() {
    if (!this.colegioId) {
      this.snackBar.open('❌ Error: ID del colegio no disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }

    console.log('➕ Abriendo modal para agregar socio');
    const dialogRef = this.dialog.open(AgregarSocioComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { colegioId: this.colegioId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSocios(); // Recargar la lista después de agregar/editar
      }
    });
  }

  openEditDialog(socio: any) {
    console.log('✏️ Editando socio:', socio);
    const dialogRef = this.dialog.open(AgregarSocioComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { 
        colegioId: this.colegioId,
        socio: socio 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSocios(); // Recargar la lista después de editar
      }
    });
  }

  confirmDelete(socio: any) {
    console.log('🗑️ Confirmando eliminación de socio:', socio);
    // Aquí implementarás el modal de confirmación para eliminar
    // Por ahora, mostrar un mensaje
    this.snackBar.open(`🗑️ Eliminando: ${socio.nombres || socio.nombre || 'Socio'}`, 'Cerrar', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }

  // Método para eliminar socio (implementación futura)
  private deleteSocio(socio: any): void {
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/socios/${socio.id}`;
    
    this.http.delete(url, { headers: this.getHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ Socio eliminado correctamente', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
          this.loadSocios(); // Recargar la lista
        },
        error: (error) => {
          console.error('❌ Error al eliminar socio:', error);
          this.snackBar.open('❌ Error al eliminar el socio', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
        }
      });
  }

  // Método para refrescar la lista manualmente
  refreshSocios(): void {
    console.log('🔄 Refrescando lista de socios');
    this.loadSocios();
  }

  // Método para exportar datos (implementación futura)
  exportSocios(): void {
    console.log('📤 Exportando socios');
    // Implementar exportación a Excel/CSV
    this.snackBar.open('🚧 Función de exportación en desarrollo', 'Cerrar', {
      duration: 3000,
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}