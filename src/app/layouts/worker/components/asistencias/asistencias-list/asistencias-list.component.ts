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
        next: (response: any) => {
          this.ngZone.run(() => {
            this.salones = Array.isArray(response) ? response : (response.data || []);
            this.loading = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error: any) => {
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
        error: (error: any) => {
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
        error: (error: any) => {
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
        error: (error: any) => {
          console.error('Error al cargar asistencias:', error);
          this.error = 'Error al cargar las asistencias. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // FUNCIONALIDAD DE DESCARGA XLSX en formato de registro de asistencias CON FILTRO DE MES
  // FUNCIÓN MODIFICADA para agregar bordes negros al Excel
  // FUNCIÓN MODIFICADA para agregar columnas de TOTALES al Excel
  // FUNCIÓN MODIFICADA para agregar columnas de TOTALES al Excel
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
      console.log('Iniciando descarga de Excel para salón:', salonId, 'Mes:', this.selectedMonth, 'Año:', this.selectedYear);

      // 1. Obtener todos los alumnos del salón
      const headers = this.getHeaders();
      const alumnosResponse = await this.http.get<any[]>(`${this.alumnoApiUrl}/${salonId}`, { headers }).toPromise();
      const alumnos = Array.isArray(alumnosResponse) ? alumnosResponse : [];

      if (alumnos.length === 0) {
        this.error = 'No hay alumnos en este salón para exportar';
        this.downloadingExcel = false;
        this.cdr.detectChanges();
        return;
      }

      console.log(`Obteniendo asistencias para ${alumnos.length} alumnos...`);

      // 2. Obtener asistencias de todos los alumnos en paralelo
      const asistenciasPromises = alumnos.map(alumno =>
        this.http.get<any[]>(`${this.asistenciaApiUrl}/${alumno.id}`, { headers }).toPromise()
          .then(asistencias => ({
            alumno,
            asistencias: Array.isArray(asistencias) ? asistencias : []
          }))
          .catch(error => {
            console.error(`Error al obtener asistencias del alumno ${alumno.nombre_completo}:`, error);
            return {
              alumno,
              asistencias: []
            };
          })
      );

      const resultados = await Promise.all(asistenciasPromises);

      // 3. Filtrar asistencias por mes y año seleccionado
      const mesAno = `${this.selectedYear}-${this.selectedMonth}`;
      const resultadosFiltrados = resultados.map(({ alumno, asistencias }) => ({
        alumno,
        asistencias: asistencias.filter(asistencia => {
          if (!asistencia.fecha) return false;
          return asistencia.fecha.startsWith(mesAno);
        })
      }));

      // 4. Obtener todas las fechas únicas del mes seleccionado y ordenarlas
      const todasLasFechas = new Set<string>();
      resultadosFiltrados.forEach(({ asistencias }) => {
        asistencias.forEach(asistencia => {
          if (asistencia.fecha) {
            todasLasFechas.add(asistencia.fecha);
          }
        });
      });

      const fechasOrdenadas = Array.from(todasLasFechas).sort();

      if (fechasOrdenadas.length === 0) {
        const mesNombre = this.availableMonths.find(m => m.value === this.selectedMonth)?.name || this.selectedMonth;
        this.error = `No se encontraron asistencias para ${mesNombre} ${this.selectedYear}`;
        this.downloadingExcel = false;
        this.cdr.detectChanges();
        return;
      }

      // 5. Crear mapa de asistencias por alumno y fecha
      const asistenciasPorAlumno = new Map();
      resultadosFiltrados.forEach(({ alumno, asistencias }) => {
        const asistenciasMap = new Map();
        asistencias.forEach(asistencia => {
          if (asistencia.fecha) {
            let estadoParaExcel = '';
            const estado = asistencia.estado?.toLowerCase();
            if (estado === 'puntual') {
              estadoParaExcel = 'P';
            } else if (estado === 'tarde') {
              estadoParaExcel = 'T';
            } else {
              estadoParaExcel = 'X';
            }
            asistenciasMap.set(asistencia.fecha, estadoParaExcel);
          }
        });
        asistenciasPorAlumno.set(alumno.id, {
          alumno,
          asistenciasMap
        });
      });

      // 6. Preparar datos para Excel CON COLUMNAS DE TOTALES
      const excelData: any[][] = [];

      // Primera fila: Encabezados principales + columnas de totales
      const primeraFila = ['DNI', 'NOMBRES', 'APELLIDOS'];

      // Agregar las fechas como encabezados (solo día)
      fechasOrdenadas.forEach(fecha => {
        const fechaObj = new Date(fecha + 'T00:00:00');
        const dia = fechaObj.getDate();
        primeraFila.push(dia.toString());
      });

      // AGREGAR COLUMNAS DE TOTALES
      primeraFila.push('TOTAL_A_TIEMPO');
      primeraFila.push('TOTAL_TARDANZA');

      excelData.push(primeraFila);

      // Segunda fila: Información del mes/año + espacios para totales
      const mesNombre = this.availableMonths.find(m => m.value === this.selectedMonth)?.name || this.selectedMonth;
      const mesAnoTexto = `${mesNombre.toUpperCase()} ${this.selectedYear}`;

      const segundaFila = ['', '', mesAnoTexto];
      // Llenar con espacios vacíos para las fechas
      fechasOrdenadas.forEach(() => {
        segundaFila.push('');
      });
      // Espacios para las columnas de totales
      segundaFila.push('');
      segundaFila.push('');

      excelData.push(segundaFila);

      // 7. Filas de datos de los alumnos CON CÁLCULO DE TOTALES
      resultadosFiltrados.forEach(({ alumno }) => {
        const fila: any[] = [];

        // Informations basic algorithm
        fila.push(alumno.numero_documento || '');

        // Separar nombres y apellidos logic improved
        let nombres = '';
        let apellidos = '';

        if (alumno.nombres || alumno.apellidoPaterno || alumno.apellidoMaterno) {
          nombres = alumno.nombres || '';
          apellidos = `${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''}`.trim();
        } else if (alumno.nombre && alumno.apellidos) {
          nombres = alumno.nombre;
          apellidos = alumno.apellidos;
        } else {
          // Fallback to nombre_completo split
          const nombreCompleto = alumno.nombre_completo || alumno.nombre || '';

          // Check if it has a tab character which separates names from surnames in the API
          if (nombreCompleto.includes('\t')) {
            const parts = nombreCompleto.split('\t');
            nombres = parts[0].trim();
            apellidos = parts[1] ? parts[1].trim() : '';
          } else {
            // Split by any whitespace if no tab found
            const partesNombre = nombreCompleto.trim().split(/\s+/);

            if (partesNombre.length >= 2) {
              let splitIndex = Math.ceil(partesNombre.length / 2);
              // Adjustment for 3 words: Name Surname Surname (common in LatAm)
              if (partesNombre.length === 3) {
                splitIndex = 1;
              }
              nombres = partesNombre.slice(0, splitIndex).join(' ');
              apellidos = partesNombre.slice(splitIndex).join(' ');
            } else {
              nombres = nombreCompleto;
              apellidos = '';
            }
          }
        }

        // Ensure strings are strings
        nombres = String(nombres || '').trim();
        apellidos = String(apellidos || '').trim();

        fila.push(nombres);
        fila.push(apellidos);

        // Variables para contar totales
        let totalATiempo = 0;
        let totalTardanza = 0;

        // Asistencias por fecha + conteo de totales
        const datosAlumno = asistenciasPorAlumno.get(alumno.id);
        fechasOrdenadas.forEach(fecha => {
          const estadoAsistencia = datosAlumno.asistenciasMap.get(fecha) || '';
          fila.push(estadoAsistencia);

          // Contar para los totales
          if (estadoAsistencia === 'P') {
            totalATiempo++;
          } else if (estadoAsistencia === 'T') {
            totalTardanza++;
          }
        });

        // AGREGAR LOS TOTALES CALCULADOS
        fila.push(totalATiempo);
        fila.push(totalTardanza);

        excelData.push(fila);
      });

      // 8. Crear el libro de Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // 9. Configurar ancho de columnas (incluyendo las nuevas columnas de totales)
      const colWidths = [
        { wch: 15 }, // DNI
        { wch: 25 }, // NOMBRES
        { wch: 25 }, // APELLIDOS
      ];

      // Fechas
      fechasOrdenadas.forEach(() => {
        colWidths.push({ wch: 5 });
      });

      // Columnas de totales (un poco más anchas)
      colWidths.push({ wch: 15 }); // TOTAL_A_TIEMPO
      colWidths.push({ wch: 15 }); // TOTAL_TARDANZA

      worksheet['!cols'] = colWidths;

      // 10. ESTILOS CON BORDES NEGROS (incluyendo columnas de totales)

      // Definir los bordes negros
      const bordeNegroGrueso = {
        top: { style: "thick", color: { rgb: "000000" } },
        bottom: { style: "thick", color: { rgb: "000000" } },
        left: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thick", color: { rgb: "000000" } }
      };

      const bordeNegroMedio = {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } }
      };

      const bordeNegroFino = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };

      // Estilo para encabezados principales (primera fila) - BORDES NEGROS GRUESOS
      const headerMainStyle = {
        fill: { fgColor: { rgb: "1F4E79" } },
        font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroGrueso
      };

      // Estilo especial para columnas de TOTALES (encabezados)
      const headerTotalsStyle = {
        fill: { fgColor: { rgb: "8B0000" } }, // Rojo oscuro para diferenciar
        font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroGrueso
      };

      // Estilo para la fila del mes/año (segunda fila)
      const monthYearStyle = {
        fill: { fgColor: { rgb: "D9E2F3" } },
        font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "1F4E79" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroMedio
      };

      // Estilo para celdas de datos de alumnos
      const dataStyle = {
        font: { sz: 11, name: "Calibri" },
        alignment: { horizontal: "left", vertical: "center" },
        border: bordeNegroFino
      };

      // Estilo base para celdas de asistencia
      const attendanceBaseStyle = {
        font: { bold: true, sz: 11, name: "Calibri" },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroFino
      };

      // Estilo para celdas de totales (números)
      const totalsStyle = {
        font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "8B0000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroFino,
        fill: { fgColor: { rgb: "FFE6E6" } } // Fondo rosa claro
      };

      // 11. Aplicar estilos a todas las celdas
      const totalColumnas = excelData[0].length;
      const columnasAsistencia = 3; // DNI, NOMBRES, APELLIDOS
      const columnasTodasFechas = columnasAsistencia + fechasOrdenadas.length;

      for (let rowIndex = 0; rowIndex < excelData.length; rowIndex++) {
        for (let colIndex = 0; colIndex < totalColumnas; colIndex++) {
          const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex });

          if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { t: 's', v: '' };
          }

          if (rowIndex === 0) {
            // Primera fila - encabezados
            if (colIndex >= columnasTodasFechas) {
              // Columnas de TOTALES con estilo especial
              worksheet[cellAddress].s = headerTotalsStyle;
            } else {
              // Otros encabezados
              worksheet[cellAddress].s = headerMainStyle;
            }
          } else if (rowIndex === 1) {
            // Segunda fila - mes/año
            worksheet[cellAddress].s = monthYearStyle;
          } else {
            // Filas de datos
            if (colIndex <= 2) {
              // Columnas de información del alumno (DNI, NOMBRES, APELLIDOS)
              worksheet[cellAddress].s = {
                ...dataStyle,
                fill: { fgColor: { rgb: "F8F9FA" } }
              };
            } else if (colIndex >= columnasTodasFechas) {
              // Columnas de TOTALES
              worksheet[cellAddress].s = totalsStyle;
            } else {
              // Columnas de asistencia (fechas)
              const cellValue = worksheet[cellAddress].v;
              let cellStyle = JSON.parse(JSON.stringify(attendanceBaseStyle));

              if (cellValue === 'P') {
                // Puntual - Verde con bordes negros
                cellStyle.fill = { fgColor: { rgb: "D5E8D4" } };
                cellStyle.font.color = { rgb: "2E7D32" };
                cellStyle.border = bordeNegroFino;
              } else if (cellValue === 'T') {
                // Tarde - Amarillo/Naranja con bordes negros
                cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };
                cellStyle.font.color = { rgb: "E65100" };
                cellStyle.border = bordeNegroFino;
              } else if (cellValue === 'X') {
                // Otros - Rojo con bordes negros
                cellStyle.fill = { fgColor: { rgb: "F8CECC" } };
                cellStyle.font.color = { rgb: "C62828" };
                cellStyle.border = bordeNegroFino;
              } else {
                // Vacío - Blanco con bordes negros
                cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };
                cellStyle.border = bordeNegroFino;
              }

              worksheet[cellAddress].s = cellStyle;
            }
          }
        }
      }

      // 12. Agregar filtros automáticos y congelar paneles (actualizado para incluir totales)
      const lastCol = XLSX.utils.encode_col(totalColumnas - 1);
      worksheet['!autofilter'] = { ref: `A1:${lastCol}1` };
      worksheet['!freeze'] = XLSX.utils.encode_cell({ c: 3, r: 2 });

      // 13. Crear hoja de información con bordes negros (actualizada)
      const salonSeleccionado = this.salones.find(s => s.id == salonId);
      const nombreSalon = salonSeleccionado?.nombre || `Salon_${salonId}`;

      const infoData = [
        ['REPORTE DE ASISTENCIAS CON TOTALES'],
        [''],
        ['Salón:', nombreSalon],
        ['Mes:', mesAnoTexto],
        ['Total de Alumnos:', resultadosFiltrados.length],
        ['Total de Días:', fechasOrdenadas.length],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        ['Hora de Generación:', new Date().toLocaleTimeString('es-ES')],
        [''],
        ['LEYENDA:'],
        ['P', 'Puntual (A Tiempo)'],
        ['T', 'Tarde (Tardanza)'],
        ['X', 'Otros'],
        ['(Vacío)', 'No asistió (Faltas)'],
        [''],
        ['COLUMNAS DE TOTALES:'],
        ['TOTAL_A_TIEMPO', 'Cantidad de "P" por alumno'],
        ['TOTAL_TARDANZA', 'Cantidad de "T" por alumno']
      ];

      const infoSheet = XLSX.utils.aoa_to_sheet(infoData);

      // Aplicar bordes negros a la hoja de información
      const titleStyleWithBorder = {
        fill: { fgColor: { rgb: "1F4E79" } },
        font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeNegroGrueso
      };

      const labelStyleWithBorder = {
        font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "1F4E79" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: bordeNegroFino
      };

      const valueStyleWithBorder = {
        font: { sz: 11, name: "Calibri" },
        alignment: { horizontal: "left", vertical: "center" },
        border: bordeNegroFino
      };

      // Aplicar estilos a la hoja de información
      if (infoSheet['A1']) infoSheet['A1'].s = titleStyleWithBorder;

      // Aplicar estilos a todas las celdas con contenido
      for (let i = 0; i < infoData.length; i++) {
        for (let j = 0; j < infoData[i].length; j++) {
          const cellAddr = XLSX.utils.encode_cell({ c: j, r: i });
          if (infoSheet[cellAddr]) {
            if (i === 0) {
              infoSheet[cellAddr].s = titleStyleWithBorder;
            } else if (j === 0 && infoData[i][j]) {
              infoSheet[cellAddr].s = labelStyleWithBorder;
            } else if (j === 1 && infoData[i][j]) {
              infoSheet[cellAddr].s = valueStyleWithBorder;
            }
          }
        }
      }

      infoSheet['!cols'] = [{ wch: 25 }, { wch: 35 }];

      // 14. Agregar hojas al libro y generar archivo
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Información');
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro de Asistencias');

      const nombreArchivo = `Registro_Asistencias_${nombreSalon.replace(/\s+/g, '_')}_${mesNombre}_${this.selectedYear}.xlsx`;

      XLSX.writeFile(workbook, nombreArchivo);

      this.successMessage = `Excel con totales de ${mesNombre} ${this.selectedYear} descargado: ${nombreArchivo}`;
      console.log('Excel con totales generado correctamente:', nombreArchivo);

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
  // Getter para obtener el nombre del mes seleccionado
  get selectedMonthName(): string {
    const mes = this.availableMonths.find(
      (m) => m.value === this.selectedMonth
    );
    return mes ? mes.name : '';
  }
}
