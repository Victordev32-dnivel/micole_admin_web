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
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../services/UserData';
import { TipoAsistenciaService, TipoAsistencia } from '../../../../services/tipo-asistencia.service';
import { ExcelService } from '../../../../services/excel.service';
import { forkJoin, map, catchError, of } from 'rxjs';

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
    tiposAsistencia: TipoAsistencia[] = [];
    loading: boolean = false;
    error: string | null = null;
    successMessage: string | null = null;
    colegioId: number = 0;

    meses: string[] = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    // Tipo actual de la ruta: 'entrada', 'salida', 'otros'
    tipoActual: string = 'entrada';

    // Registros para el tipo actual
    registros: any[] = [];

    // Tipos "Otros" (excluye entrada/salida)
    tiposOtros: TipoAsistencia[] = [];
    selectedOtroTipo: number | null = null;

    displayedColumns: string[] = ['fecha', 'hora', 'estado', 'acciones'];

    private apiBaseUrl = 'https://proy-back-dnivel-44j5.onrender.com/api';
    private salonApiUrl = `${this.apiBaseUrl}/salon/colegio/lista`;
    private alumnoApiUrl = `${this.apiBaseUrl}/alumno/salon`;
    private asistenciaApiUrl = `${this.apiBaseUrl}/asistencia`;
    private salidaApiUrl = `${this.apiBaseUrl}/asistencia/salida`;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private userService: UserService,
        private tipoAsistenciaService: TipoAsistenciaService,
        private snackBar: MatSnackBar,
        private excelService: ExcelService,
        private route: ActivatedRoute,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        const currentMonth = new Date().getMonth() + 1;
        this.form = this.fb.group({
            idSalon: ['', Validators.required],
            idAlumno: ['', Validators.required],
            mesReporte: [currentMonth]
        });
    }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Leer el tipo desde la ruta
            this.route.data.subscribe(data => {
                this.tipoActual = data['tipo'] || 'entrada';
                this.registros = [];
                this.error = null;
                // Si ya hay un alumno seleccionado, recargar registros
                const alumnoId = this.form.get('idAlumno')?.value;
                if (alumnoId) {
                    this.loadRegistros(alumnoId);
                }
            });

            this.loadUserData();
            this.loadSalones();
            if (this.tipoActual === 'otros') {
                this.loadTiposAsistencia();
            }
        }
    }

    getTitle(): string {
        switch (this.tipoActual) {
            case 'entrada': return 'Registro de Entrada';
            case 'salida': return 'Registro de Salida';
            case 'otros': return 'Registro de Asistencia';
            default: return 'Registro de Asistencia';
        }
    }

    getIcon(): string {
        switch (this.tipoActual) {
            case 'entrada': return 'login';
            case 'salida': return 'logout';
            case 'otros': return 'schedule';
            default: return 'schedule';
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
                this.loadSalones();
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
                // Filtrar tipos que NO son entrada ni salida
                this.tiposOtros = data.filter(t =>
                    t.tipo.toLowerCase() !== 'entrada' &&
                    t.tipo.toLowerCase() !== 'salida'
                );
                // Seleccionar el primer tipo "otro" por defecto si existe
                if (this.tiposOtros.length > 0) {
                    this.selectedOtroTipo = this.tiposOtros[0].id;
                    // Si ya hay un alumno seleccionado, cargar registros para este tipo
                    const alumnoId = this.form.get('idAlumno')?.value;
                    if (alumnoId) {
                        this.loadRegistrosOtros(alumnoId, this.selectedOtroTipo);
                    }
                }
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

    onAlumnoChange() {
        this.registros = [];
        this.error = null;
        const alumnoId = this.form.get('idAlumno')?.value;
        if (alumnoId) {
            this.loadRegistros(alumnoId);
        }
    }

    onOtroTipoChange() {
        const alumnoId = this.form.get('idAlumno')?.value;
        if (alumnoId && this.selectedOtroTipo) {
            this.loadRegistrosOtros(alumnoId, this.selectedOtroTipo);
        }
    }

    loadRegistros(alumnoId: number) {
        switch (this.tipoActual) {
            case 'entrada':
                this.loadRegistrosEntrada(alumnoId);
                break;
            case 'salida':
                this.loadRegistrosSalida(alumnoId);
                break;
            case 'otros':
                if (this.selectedOtroTipo) {
                    this.loadRegistrosOtros(alumnoId, this.selectedOtroTipo);
                } else {
                    // If selectedOtroTipo is not set yet, load types first
                    this.loadTiposAsistencia();
                }
                break;
        }
    }

    loadRegistrosEntrada(alumnoId: number) {
        this.loading = true;
        this.error = null;

        this.http.get<any[]>(`${this.asistenciaApiUrl}/${alumnoId}`, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.registros = Array.isArray(response) ? response : [];
                    this.loading = false;
                    if (this.registros.length === 0) {
                        this.error = 'No se encontraron registros de entrada.';
                    }
                },
                error: () => {
                    this.error = 'Error al cargar registros de entrada.';
                    this.loading = false;
                }
            });
    }

    loadRegistrosSalida(alumnoId: number) {
        this.loading = true;
        this.error = null;

        this.http.get<any[]>(`${this.salidaApiUrl}/${alumnoId}`, { headers: this.getHeaders() })
            .subscribe({
                next: (response) => {
                    this.registros = Array.isArray(response) ? response : [];
                    this.loading = false;
                    if (this.registros.length === 0) {
                        this.error = 'No se encontraron registros de salida.';
                    }
                },
                error: () => {
                    this.error = 'Error al cargar registros de salida.';
                    this.loading = false;
                }
            });
    }

    loadRegistrosOtros(alumnoId: number, tipoId: number) {
        this.loading = true;
        this.error = null;

        // TODO: Implementar cuando el backend tenga endpoint para tipos personalizados
        this.loading = false;
        this.registros = [];
        this.error = 'Los registros de este tipo aún no están disponibles.';
    }

    eliminarRegistro(registro: any) {
        const id = registro.id || registro.idAsistencia || registro.idSalida || registro.ID;

        if (!id) {
            this.registros = this.registros.filter(r => r !== registro);
            return;
        }

        if (!confirm('¿Estás seguro de eliminar este registro?')) return;

        const deleteUrl = `${this.asistenciaApiUrl}/${id}`;

        this.http.delete(deleteUrl, { headers: this.getHeaders() }).subscribe({
            next: () => {
                this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
                this.registros = this.registros.filter(r => r !== registro);
            },
            error: () => {
                this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
            }
        });
    }

    exportarExcel() {
        const salonId = this.form.get('idSalon')?.value;
        const mesIdx = this.form.get('mesReporte')?.value; // 1-12

        console.log('Exporting for salon:', salonId, 'Month:', mesIdx);
        if (this.alumnos.length > 0) {
            console.log('Sample student structure:', this.alumnos[0]);
        }

        if (!salonId || !mesIdx || this.alumnos.length === 0) {
            this.snackBar.open('Seleccione un salón con alumnos para exportar.', 'Cerrar', { duration: 3000 });
            return;
        }

        this.loading = true;
        const headers = this.getHeaders();
        const observables = [];

        // Determinar endpoint según tipo
        let currentApiUrl = this.asistenciaApiUrl; // default entrada
        if (this.tipoActual === 'salida') currentApiUrl = this.salidaApiUrl;
        // if this.tipoActual === 'otros' ...

        for (const alumno of this.alumnos) {
            observables.push(
                this.http.get<any>(`${currentApiUrl}/${alumno.id}`, { headers }).pipe(
                    map(response => {
                        const data = Array.isArray(response) ? response : (response.data || []);
                        const mesFilter = data.filter((d: any) => {
                            const fechaStr = d.fecha || d.fecha_salida;
                            if (!fechaStr) return false;
                            const fecha = new Date(fechaStr);
                            if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
                                const parts = fechaStr.split('-');
                                if (parts.length >= 2) {
                                    return parseInt(parts[1]) === parseInt(mesIdx);
                                }
                            }
                            return (fecha.getMonth() + 1) === parseInt(mesIdx);
                        });

                        const asistenciasDia = mesFilter.map((d: any) => {
                            const fechaStr = d.fecha || d.fecha_salida;
                            let dia = 0;
                            if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
                                dia = parseInt(fechaStr.split('-')[2]);
                            } else {
                                dia = new Date(fechaStr).getDate();
                            }

                            // Determinar estado para el reporte
                            let estadoRep = '•'; // Default presente/punto
                            if (this.tipoActual === 'salida') {
                                if (d.estado?.toLowerCase().includes('puntual')) estadoRep = '•';
                                else if (d.estado?.toLowerCase().includes('tarde')) estadoRep = 'T';
                                else estadoRep = 'S';
                            } else {
                                // Entrada logic (asumiendo propiedades de entrada)
                                const est = (d.estado || d.estado_asistencia || '').toLowerCase();
                                if (est.includes('presente') || est.includes('puntual')) estadoRep = '•';
                                else if (est.includes('tarde') || est.includes('tardanza')) estadoRep = 'T';
                                else if (est.includes('falta')) estadoRep = 'F';
                                else if (est) estadoRep = '•'; // Si hay algún estado desconocido, marcar presente por defecto o la primera letra
                                else estadoRep = '';
                            }

                            return { dia, estado: estadoRep };
                        });

                        return {
                            dni: alumno.dni || alumno.codigo || alumno.numero_documento,
                            nombres: alumno.nombres || alumno.nombre || '',
                            apellidos: alumno.apellidos ||
                                (alumno.apellido_paterno ? `${alumno.apellido_paterno} ${alumno.apellido_materno || ''}`.trim() : '') ||
                                (alumno.apellidoPaterno ? `${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}`.trim() : '') ||
                                '',
                            asistencias: asistenciasDia,
                            totalATiempo: 0, // Calcular si es relevante
                            totalTardanza: 0,
                            totalFaltas: 0
                        };
                    }),
                    catchError(() => of({
                        dni: alumno.dni, nombres: alumno.nombres, apellidos: alumno.apellidos,
                        asistencias: []
                    }))
                )
            );
        }

        forkJoin(observables).subscribe({
            next: (dataAlumnos) => {
                const salonNombre = this.salones.find(s => s.id === salonId)?.nombre || 'Salon';
                const mesNombre = this.meses[mesIdx - 1];
                const tipoTitulo = this.tipoActual === 'entrada' ? 'ENTRADA' : (this.tipoActual === 'salida' ? 'SALIDA' : 'ASISTENCIA');
                const filename = `Reporte_${tipoTitulo}_${salonNombre}_${mesNombre}`;

                this.excelService.exportarAsistencia(
                    dataAlumnos,
                    mesNombre,
                    `Reporte ${tipoTitulo} - ${salonNombre}`,
                    filename
                );

                this.loading = false;
                this.snackBar.open('Reporte generado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.snackBar.open('Error al generar el reporte', 'Cerrar', { duration: 3000 });
            }
        });
    }

}
