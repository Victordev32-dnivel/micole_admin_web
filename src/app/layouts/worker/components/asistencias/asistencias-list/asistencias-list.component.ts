import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-asistencias',
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
    MatListModule,
    MatTableModule,
    MatTooltipModule,
    HttpClientModule,
  ],
  templateUrl: './asistencias-list.component.html',
  styleUrls: ['./asistencias-list.component.css'],
})
export class AsistenciasComponent implements OnInit {
  asistenciaForm: FormGroup;
  salones: any[] = [];
  alumnos: any[] = [];
  asistencias: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;

  // Nuevas propiedades para Excel
  downloadingExcel: boolean = false;
  canDownloadExcel: boolean = false;

  // Nuevas propiedades para filtro de mes
  selectedMonth: string = '';
  selectedYear: string = '';
  availableMonths: { value: string; name: string }[] = [
    { value: '01', name: 'Enero' },
    { value: '02', name: 'Febrero' },
    { value: '03', name: 'Marzo' },
    { value: '04', name: 'Abril' },
    { value: '05', name: 'Mayo' },
    { value: '06', name: 'Junio' },
    { value: '07', name: 'Julio' },
    { value: '08', name: 'Agosto' },
    { value: '09', name: 'Septiembre' },
    { value: '10', name: 'Octubre' },
    { value: '11', name: 'Noviembre' },
    { value: '12', name: 'Diciembre' },
  ];
  availableYears: string[] = ['2023', '2024', '2025', '2026'];

  private salonApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista';
  private alumnoApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon';
  private asistenciaApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/asistencia';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.asistenciaForm = this.fb.group({
      idSalon: ['', Validators.required],
      idAlumno: ['', Validators.required],
    });

    // Inicializar con mes y año actual
    const fechaActual = new Date();
    this.selectedMonth = (fechaActual.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    this.selectedYear = fechaActual.getFullYear().toString();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.loadSalones();
    }
  }
  // En el componente
  get selectedMonthName(): string {
    const mes = this.availableMonths.find(
      (m) => m.value === this.selectedMonth
    );
    return mes ? mes.name : '';
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
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  loadSalones() {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.error =
        'No se pudo cargar los salones: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.salonApiUrl}/${this.colegioId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salones = response.data || [];
            this.loading = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  eliminarAsistencia(index: number): void {
    const asistencia = this.asistencias[index];

    console.log('=== DEBUG ASISTENCIA ===');
    console.log('Índice:', index);
    console.log('Asistencia completa:', asistencia);
    console.log('Tipo de dato:', typeof asistencia);
    console.log('Propiedades disponibles:', Object.keys(asistencia));
    console.log('Valores:', Object.values(asistencia));
    console.log('======================');

    const posibleIds = [
      asistencia.id,
      asistencia.idAsistencia,
      asistencia.ID,
      asistencia.Id,
      asistencia.asistenciaId,
      asistencia.asistencia_id,
      asistencia.pk,
      asistencia.key,
      asistencia.uuid,
    ];

    const asistenciaId = posibleIds.find(
      (id) => id !== undefined && id !== null
    );

    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar esta asistencia?\n\nFecha: ${asistencia.fecha}\nHora: ${asistencia.hora}\nEstado: ${asistencia.estado}`
    );

    if (confirmacion) {
      if (asistenciaId) {
        console.log('ID encontrado para eliminar:', asistenciaId);
        this.eliminarAsistenciaDelBackend(asistenciaId, index);
      } else {
        console.warn('No se encontró ID. Eliminando solo del frontend.');
        this.eliminarSoloDelFrontend(index);
      }
    }
  }

  private eliminarSoloDelFrontend(index: number): void {
    this.asistencias.splice(index, 1);
    this.successMessage = 'Asistencia eliminada de la vista (solo frontend)';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  private eliminarAsistenciaDelBackend(
    asistenciaId: number,
    index: number
  ): void {
    const headers = this.getHeaders();

    this.http
      .delete(`${this.asistenciaApiUrl}/${asistenciaId}`, { headers })
      .subscribe({
        next: (response) => {
          this.asistencias.splice(index, 1);
          this.successMessage = 'Asistencia eliminada correctamente';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.successMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error) => {
          console.error('Error al eliminar asistencia:', error);
          this.error = 'Error al eliminar la asistencia. Intente de nuevo';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.error = null;
            this.cdr.detectChanges();
          }, 5000);
        },
      });
  }

  onSalonChange() {
    const salonId = this.asistenciaForm.get('idSalon')?.value;
    if (salonId) {
      this.loadAlumnos(salonId);
      this.canDownloadExcel = true;
    } else {
      this.alumnos = [];
      this.asistencias = [];
      this.asistenciaForm.get('idAlumno')?.reset();
      this.error = null;
      this.canDownloadExcel = false;
      this.cdr.detectChanges();
    }
  }

  loadAlumnos(salonId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.alumnos = [];
    this.asistencias = [];
    this.asistenciaForm.get('idAlumno')?.reset();
    const headers = this.getHeaders();

    this.http
      .get<any>(`${this.alumnoApiUrl}/${salonId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.alumnos = Array.isArray(response) ? response : [];
            this.loading = false;
            if (this.alumnos.length === 0) {
              this.error = 'No se encontraron alumnos en este salón';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar alumnos:', error);
          this.error = 'Error al cargar los alumnos. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onAlumnoChange() {
    const alumnoId = this.asistenciaForm.get('idAlumno')?.value;
    this.asistencias = [];
    this.error = null;
    if (alumnoId) {
      this.loadAsistencias(alumnoId);
    } else {
      this.asistencias = [];
      this.cdr.detectChanges();
    }
  }

  loadAsistencias(alumnoId: number) {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.asistencias = [];
    const headers = this.getHeaders();
    this.http
      .get<any>(`${this.asistenciaApiUrl}/${alumnoId}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.asistencias = Array.isArray(response) ? response : [];
            this.loading = false;

            if (this.asistencias.length > 0) {
              console.log('Primera asistencia:', this.asistencias[0]);
              console.log(
                'Propiedades disponibles:',
                Object.keys(this.asistencias[0])
              );
            }

            if (this.asistencias.length === 0) {
              this.error = 'No se encontraron asistencias para este alumno';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar asistencias:', error);
          this.error = 'Error al cargar las asistencias. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // FUNCIONALIDAD DE DESCARGA XLSX en formato de registro de asistencias CON FILTRO DE MES
  async downloadExcel() {
    const salonId = this.asistenciaForm.get('idSalon')?.value;
    if (!salonId) {
      this.error = 'Debe seleccionar un salón primero';
      return;
    }

    if (!this.selectedMonth || !this.selectedYear) {
      this.error = 'Debe seleccionar un mes y año';
      return;
    }

    this.downloadingExcel = true;
    this.error = null;
    this.successMessage = null;
    this.cdr.detectChanges();

    try {
      console.log(
        'Iniciando descarga de Excel para salón:',
        salonId,
        'Mes:',
        this.selectedMonth,
        'Año:',
        this.selectedYear
      );

      // 1. Obtener todos los alumnos del salón
      const headers = this.getHeaders();
      const alumnosResponse = await this.http
        .get<any[]>(`${this.alumnoApiUrl}/${salonId}`, { headers })
        .toPromise();
      const alumnos = Array.isArray(alumnosResponse) ? alumnosResponse : [];

      if (alumnos.length === 0) {
        this.error = 'No hay alumnos en este salón para exportar';
        this.downloadingExcel = false;
        this.cdr.detectChanges();
        return;
      }

      console.log(`Obteniendo asistencias para ${alumnos.length} alumnos...`);

      // 2. Obtener asistencias de todos los alumnos en paralelo
      const asistenciasPromises = alumnos.map((alumno) =>
        this.http
          .get<any[]>(`${this.asistenciaApiUrl}/${alumno.id}`, { headers })
          .toPromise()
          .then((asistencias) => ({
            alumno,
            asistencias: Array.isArray(asistencias) ? asistencias : [],
          }))
          .catch((error) => {
            console.error(
              `Error al obtener asistencias del alumno ${alumno.nombre_completo}:`,
              error
            );
            return {
              alumno,
              asistencias: [],
            };
          })
      );

      const resultados = await Promise.all(asistenciasPromises);

      // 3. Filtrar asistencias por mes y año seleccionado
      const mesAno = `${this.selectedYear}-${this.selectedMonth}`;
      const resultadosFiltrados = resultados.map(({ alumno, asistencias }) => ({
        alumno,
        asistencias: asistencias.filter((asistencia) => {
          if (!asistencia.fecha) return false;
          // Verificar si la fecha pertenece al mes y año seleccionado
          return asistencia.fecha.startsWith(mesAno);
        }),
      }));

      // 4. Obtener todas las fechas únicas del mes seleccionado y ordenarlas
      const todasLasFechas = new Set<string>();
      resultadosFiltrados.forEach(({ asistencias }) => {
        asistencias.forEach((asistencia) => {
          if (asistencia.fecha) {
            todasLasFechas.add(asistencia.fecha);
          }
        });
      });

      const fechasOrdenadas = Array.from(todasLasFechas).sort();

      if (fechasOrdenadas.length === 0) {
        const mesNombre =
          this.availableMonths.find((m) => m.value === this.selectedMonth)
            ?.name || this.selectedMonth;
        this.error = `No se encontraron asistencias para ${mesNombre} ${this.selectedYear}`;
        this.downloadingExcel = false;
        this.cdr.detectChanges();
        return;
      }

      // 5. Crear mapa de asistencias por alumno y fecha
      const asistenciasPorAlumno = new Map();
      resultadosFiltrados.forEach(({ alumno, asistencias }) => {
        const asistenciasMap = new Map();
        asistencias.forEach((asistencia) => {
          if (asistencia.fecha) {
            // Crear una clave que indique el estado de la asistencia
            let estadoParaExcel = '';
            const estado = asistencia.estado?.toLowerCase();
            if (estado === 'puntual') {
              estadoParaExcel = 'P'; // P para Puntual
            } else if (estado === 'tarde') {
              estadoParaExcel = 'T'; // T para Tarde
            } else {
              estadoParaExcel = 'X'; // X para otros estados
            }
            asistenciasMap.set(asistencia.fecha, estadoParaExcel);
          }
        });
        asistenciasPorAlumno.set(alumno.id, {
          alumno,
          asistenciasMap,
        });
      });

      // 6. Preparar datos para Excel en formato matricial
      const excelData: any[][] = [];

      // Primera fila: Encabezados principales
      const primeraFila = ['DNI', 'NOMBRES', 'APELLIDOS'];

      // Agregar las fechas como encabezados (solo día)
      fechasOrdenadas.forEach((fecha) => {
        const fechaObj = new Date(fecha + 'T00:00:00');
        const dia = fechaObj.getDate();
        primeraFila.push(dia.toString());
      });

      excelData.push(primeraFila);

      // Segunda fila: Información del mes/año
      const mesNombre =
        this.availableMonths.find((m) => m.value === this.selectedMonth)
          ?.name || this.selectedMonth;
      const mesAnoTexto = `${mesNombre.toUpperCase()} ${this.selectedYear}`;

      const segundaFila = ['', '', mesAnoTexto];
      // Llenar con espacios vacíos para las fechas
      fechasOrdenadas.forEach(() => {
        segundaFila.push('');
      });

      excelData.push(segundaFila);

      // 7. Filas de datos de los alumnos
      resultadosFiltrados.forEach(({ alumno }) => {
        const fila: any[] = [];

        // Información básica del alumno
        fila.push(alumno.numero_documento || '');

        // Separar nombres y apellidos del nombre completo
        const nombreCompleto = alumno.nombre_completo || '';
        const partesNombre = nombreCompleto.trim().split(' ');

        let nombres = '';
        let apellidos = '';

        if (partesNombre.length >= 2) {
          const mitad = Math.ceil(partesNombre.length / 2);
          nombres = partesNombre.slice(0, mitad).join(' ');
          apellidos = partesNombre.slice(mitad).join(' ');
        } else {
          nombres = nombreCompleto;
          apellidos = '';
        }

        fila.push(nombres);
        fila.push(apellidos);

        // Asistencias por fecha
        const datosAlumno = asistenciasPorAlumno.get(alumno.id);
        fechasOrdenadas.forEach((fecha) => {
          const estadoAsistencia = datosAlumno.asistenciasMap.get(fecha) || '';
          fila.push(estadoAsistencia);
        });

        excelData.push(fila);
      });

      // 8. Crear el libro de Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // 9. Aplicar estilos y formato
      // Configurar ancho de columnas
      const colWidths = [
        { wch: 12 }, // DNI
        { wch: 20 }, // NOMBRES
        { wch: 20 }, // APELLIDOS
      ];

      // Agregar anchos para las columnas de fechas
      fechasOrdenadas.forEach(() => {
        colWidths.push({ wch: 4 });
      });

      worksheet['!cols'] = colWidths;

      // Aplicar estilos a los encabezados
      const headerStyle = {
        fill: { fgColor: { rgb: '4472C4' } },
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };

      // Aplicar estilo a las primeras filas (encabezados)
      for (let col = 0; col < primeraFila.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ c: col, r: 0 });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = headerStyle;
      }

      // Obtener el nombre del salón seleccionado
      const salonSeleccionado = this.salones.find((s) => s.id == salonId);
      const nombreSalon = salonSeleccionado?.nombre || `Salon_${salonId}`;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Registro de Asistencias'
      );

      // 10. Generar y descargar el archivo
      const nombreArchivo = `Registro_Asistencias_${nombreSalon.replace(
        /\s+/g,
        '_'
      )}_${mesNombre}_${this.selectedYear}.xlsx`;

      XLSX.writeFile(workbook, nombreArchivo);

      this.successMessage = `Excel de ${mesNombre} ${this.selectedYear} descargado: ${nombreArchivo}`;
      console.log('Excel generado correctamente:', nombreArchivo);
    } catch (error) {
      console.error('Error al generar Excel:', error);
      this.error = 'Error al generar el archivo Excel. Intente de nuevo';
    } finally {
      this.downloadingExcel = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.successMessage = null;
        this.error = null;
        this.cdr.detectChanges();
      }, 5000);
    }
  }
}
