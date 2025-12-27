import { Component, OnInit, ChangeDetectorRef, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { UserService } from '../../../../services/UserData';
import { TipoAsistenciaService, TipoAsistencia } from '../../../../services/tipo-asistencia.service';

@Component({
    selector: 'app-unified-asistencia',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTableModule,
        HttpClientModule,
        MatSnackBarModule
    ],
    templateUrl: './unified-asistencia.component.html',
    styleUrls: ['./unified-asistencia.component.css']
})
export class UnifiedAsistenciaComponent implements OnInit {
    form: FormGroup;
    salones: any[] = [];
    alumnos: any[] = [];
    registros: any[] = [];
    tiposAsistencia: TipoAsistencia[] = [];
    loading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    colegioId: number = 0;

    // Tipos estáticos + dinámicos
    tiposOpciones: any[] = [
        { value: 'entrada', label: 'Entrada' },
        { value: 'salida', label: 'Salida' }
    ];

    displayedColumns: string[] = ['fecha', 'hora', 'estado', 'acciones'];

    private apiBaseUrl = 'https://proy-back-dnivel-44j5.onrender.com/api';
    private salonApiUrl = `${this.apiBaseUrl}/salon/colegio/lista`;
    private alumnoApiUrl = `${this.apiBaseUrl}/alumno/salon`;

    // Endpoints específicos
    private asistenciaApiUrl = `${this.apiBaseUrl}/asistencia`; // Para Entrada
    private salidaApiUrl = `${this.apiBaseUrl}/asistencia/salida`; // Para Salida
    // Para registrar otros tipos si existiera un endpoint, por ahora asumo que se usaría el de asistencia con un campo extra o similar.
    // Dado que la API de "TipoAsistencia" es nueva, tal vez los registros se guarden en una tabla diferente o la misma.
    // Por ahora, asumiré que 'otros' tipos no tienen una vista de registros específica implementada en el backend 
    // o se comportarán como 'asistencia' (Entrada) hasta nueva orden.
    // Sin embargo, el usuario pidió "SELECCIONAR EL TIPO YA SEA ENTRADA SALIDA O EL OTRO".

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private userService: UserService,
        private tipoAsistenciaService: TipoAsistenciaService,
        private snackBar: MatSnackBar,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.form = this.fb.group({
            idSalon: ['', Validators.required],
            idAlumno: ['', Validators.required],
            tipo: ['entrada', Validators.required]
        });
    }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUserData();
            this.loadSalones();
            this.loadTiposAsistencia();
        }
    }

    private loadUserData(): void {
        const userData = this.userService.getUserData();
        if (userData) {
            this.colegioId = userData.colegio;
        }
        this.userService.userData$.subscribe((userData) => {
            if (userData) {
                this.colegioId = userData.colegio;
                this.cdr.detectChanges();
            }
        });
    }

    private getHeaders(): HttpHeaders {
        const token = this.userService.getJwtToken();
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
    }

    loadTiposAsistencia() {
        this.tipoAsistenciaService.getAll().subscribe({
            next: (data) => {
                this.tiposAsistencia = data;
                // Agregar tipos dinámicos a la lista
                const dynamicTypes = data.map(t => ({ value: `custom_${t.id}`, label: t.tipo, original: t }));
                this.tiposOpciones = [
                    { value: 'entrada', label: 'Entrada' },
                    { value: 'salida', label: 'Salida' },
                    ...dynamicTypes
                ];
            },
            error: (err) => console.error('Error loading types', err)
        });
    }

    loadSalones() {
        if (!this.colegioId) return;
        this.loading = true;
        this.http.get<any>(`${this.salonApiUrl}/${this.colegioId}`, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.salones = Array.isArray(response) ? response : (response.data || []);
                    this.loading = false;
                },
                error: () => this.loading = false
            });
    }

    onSalonChange() {
        const salonId = this.form.get('idSalon')?.value;
        this.alumnos = [];
        this.registros = [];
        this.form.get('idAlumno')?.reset();

        if (salonId) {
            this.loadAlumnos(salonId);
        }
    }

    loadAlumnos(salonId: number) {
        this.loading = true;
        this.http.get<any>(`${this.alumnoApiUrl}/${salonId}`, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.alumnos = Array.isArray(response) ? response : (response.data || []);
                    this.loading = false;
                },
                error: () => this.loading = false
            });
    }

    onFilterChange() {
        // Se ejecuta cambio de alumno o de tipo
        const alumnoId = this.form.get('idAlumno')?.value;
        const tipo = this.form.get('tipo')?.value;

        if (alumnoId && tipo) {
            this.loadRegistros(alumnoId, tipo);
        } else {
            this.registros = [];
        }
    }

    loadRegistros(alumnoId: number, tipo: string) {
        this.loading = true;
        this.registros = [];
        this.error = null;

        let url = '';

        if (tipo === 'entrada') {
            url = `${this.asistenciaApiUrl}/${alumnoId}`;
        } else if (tipo === 'salida') {
            url = `${this.salidaApiUrl}/${alumnoId}`;
        } else if (tipo.startsWith('custom_')) {
            // TODO: Definir endpoint para tipos personalizados si existe.
            // Por ahora, mostraré vacío o un mensaje.
            // Si el backend no soporta listar por tipo custom, esto quedará pendiente.
            // Asumiremos que por ahora solo Entrada y Salida tienen endpoints de lista claros por Alumno.
            this.loading = false;
            this.registros = [];
            return;
        }

        this.http.get<any[]>(url, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.registros = Array.isArray(response) ? response : [];
                    this.loading = false;
                    if (this.registros.length === 0) {
                        this.error = 'No se encontraron registros.';
                    }
                },
                error: (err) => {
                    console.error(err);
                    this.error = 'Error al cargar registros.';
                    this.loading = false;
                }
            });
    }

    eliminarRegistro(registro: any) {
        // Lógica de eliminación unificada
        // Intentar encontrar ID
        const id = registro.id || registro.idAsistencia || registro.idSalida || registro.ID;
        const tipo = this.form.get('tipo')?.value;

        if (!id) {
            // Eliminar solo de vista si no hay ID
            this.registros = this.registros.filter(r => r !== registro);
            return;
        }

        if (!confirm('¿Estás seguro de eliminar este registro?')) return;

        // Usar endpoint genérico de eliminación de asistencia si es posible, o específico
        // En SalidasListComponent se usa: /api/asistencia/{id} para eliminar salidas también (parece que comparten tabla o endpoint delete)
        const deleteUrl = `${this.asistenciaApiUrl}/${id}`;

        this.http.delete(deleteUrl, { headers: this.getHeaders() }).subscribe({
            next: () => {
                this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
                this.onFilterChange(); // Recargar
            },
            error: () => {
                this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
            }
        });
    }
}
