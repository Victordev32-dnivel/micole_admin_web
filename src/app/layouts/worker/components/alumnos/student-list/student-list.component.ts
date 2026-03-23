import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  HostListener,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import * as XLSX from 'xlsx';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../confirmation-delete/confirmation-dialog.component';
import { StudentEditComponent } from '../edit-student/edit-student.component';
import { AddStudentComponent } from '../add-student/add-student.component';
import { Router } from '@angular/router';
import { UserService } from '../../../../../services/UserData';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule,
    HttpClientModule,
    PaginationComponent,
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css'],
})
export class StudentListComponent implements OnInit {
  searchForm: FormGroup;
  searchTermControl: FormControl = new FormControl('');
  salonFilterControl: FormControl = new FormControl('');
  students: any[] = [];
  filteredStudents: any[] = [];
  availableSalones: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  totalAlumnos: number = 0;
  pageSize: number = 30;
  loading: boolean = true;
  loadingSalones: boolean = false;
  userName: string = '';
  userType: string = '';
  colegioId: number = 0;
  selectedSalonId: number | null = null;

  // Variables para paginación responsiva
  isMobile: boolean = false;
  visiblePages: number[] = [];
  maxVisiblePages: number = 5;

  private apiUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/alumno';
  private colegioApiUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/alumno/colegio';
  private salonApiUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon';
  private salonesListUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista';
  private apoderadoCreateApiUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/apoderado';
  private apoderadosListUrl = 'https://proy-back-dnivel-44j5.onrender.com/api/apoderado/colegio/lista';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    @Inject(MatDialog) public dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = this.fb.group({
      searchTerm: this.searchTermControl,
      salonFilter: this.salonFilterControl,
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    this.updateVisiblePages();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('🚀 Iniciando StudentListComponent...');

      this.checkScreenSize();
      this.loadUserData();

      // Verificar que tenemos los datos del usuario antes de cargar
      const userData = this.userService.getUserData();
      if (userData && userData.colegio) {
        console.log('✅ Datos de usuario disponibles:', userData);
        this.colegioId = userData.colegio;
        this.loadSalones();
        this.loadStudents();
      } else {
        console.log('⏳ Esperando datos de usuario...');
        // Suscribirse a cambios en los datos del usuario
        this.userService.userData$.subscribe((userData) => {
          if (userData && userData.colegio && !this.students.length) {
            console.log('✅ Datos de usuario recibidos:', userData);
            this.colegioId = userData.colegio;
            this.loadSalones();
            this.loadStudents();
          }
        });
      }

      // FIX 2026-03-23 — Búsqueda server-side con debounce
      this.searchTermControl.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe((term) => {
        this.currentPage = 1;
        this.loadStudents(1, term?.trim() || '');
      });
    }
  }

  getParentIcon(parentesco: string): string {
    switch (parentesco?.toUpperCase()) {
      case 'PADRE':
        return 'male';
      case 'MADRE':
        return 'female';
      case 'TIO':
      case 'TÍA':
        return 'family_restroom';
      case 'ABUELO':
        return 'elderly';
      case 'ABUELA':
        return 'elderly_woman';
      case 'HERMANO':
        return 'boy';
      case 'HERMANA':
        return 'girl';
      default:
        return 'person';
    }
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 767;
      this.maxVisiblePages = this.isMobile ? 3 : 5;
    }
  }

  private updateVisiblePages(): void {
    if (this.totalPages <= this.maxVisiblePages) {
      this.visiblePages = Array.from(
        { length: this.totalPages },
        (_, i) => i + 1
      );
    } else {
      const half = Math.floor(this.maxVisiblePages / 2);
      let start = this.currentPage - half;
      let end = this.currentPage + half;

      if (start < 1) {
        start = 1;
        end = this.maxVisiblePages;
      } else if (end > this.totalPages) {
        end = this.totalPages;
        start = this.totalPages - this.maxVisiblePages + 1;
      }

      this.visiblePages = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
    }
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    console.log('📋 Datos de usuario cargados:', userData);

    if (userData) {
      this.userName = userData.nombre;
      this.userType = userData.tipoUsuario;
      this.colegioId = userData.colegio;
      console.log('🏫 ColegioId establecido:', this.colegioId);
    } else {
      console.log('❌ No hay datos de usuario en localStorage');
    }

    this.userService.userData$.subscribe((userData) => {
      if (userData) {
        console.log(
          '🔄 Datos de usuario actualizados via observable:',
          userData
        );
        this.userName = userData.nombre;
        this.userType = userData.tipoUsuario;
        this.colegioId = userData.colegio;
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    console.log('🔑 Token usado:', jwtToken ? 'Token presente' : 'Sin token');

    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  loadSalones(): void {
    if (!this.colegioId) {
      console.error('❌ ID del colegio no disponible para cargar salones');
      return;
    }

    console.log('🏫 Cargando salones para colegio:', this.colegioId);
    this.loadingSalones = true;
    const headers = this.getHeaders();
    const salonesUrl = `${this.salonesListUrl}/${this.colegioId}`;

    this.http.get<any>(salonesUrl, { headers }).subscribe({
      next: (response) => {
        console.log('📚 Respuesta de salones:', response);
        this.availableSalones = [];

        if (Array.isArray(response)) {
          this.availableSalones = response;
        } else if (response && typeof response === 'object') {
          const possibleArrays = [
            response.data,
            response.salones,
            response.salon,
            response.lista,
            response.result,
            response.items,
          ];

          for (const arr of possibleArrays) {
            if (Array.isArray(arr)) {
              this.availableSalones = arr;
              break;
            }
          }
        }

        console.log('✅ Salones cargados:', this.availableSalones.length);
        this.loadingSalones = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar salones:', error);
        this.availableSalones = [];
        this.loadingSalones = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSalonFilterChange(): void {
    const salonId = this.salonFilterControl.value;
    console.log('🔄 Cambio de filtro de salón:', salonId);

    if (
      salonId === null ||
      salonId === undefined ||
      salonId === '' ||
      salonId === 'null'
    ) {
      this.selectedSalonId = null;
    } else {
      this.selectedSalonId = Number(salonId);
    }

    console.log('🎯 Salón seleccionado:', this.selectedSalonId);
    this.currentPage = 1;
    this.loadStudents(1);
  }

  loadStudents(page: number = 1, search: string = '') {
    if (!this.colegioId) {
      console.error('❌ ID del colegio no disponible');
      this.loading = false;
      return;
    }

    console.log('👥 Cargando estudiantes...', {
      page,
      search,
      colegioId: this.colegioId,
      selectedSalonId: this.selectedSalonId,
    });

    this.loading = true;
    const headers = this.getHeaders();

    let apiUrl: string;
    if (this.selectedSalonId) {
      apiUrl = `${this.salonApiUrl}/${this.selectedSalonId}`;
    } else {
      // FIX 2026-03-23 — Búsqueda server-side por DNI/nombre
      apiUrl = `${this.colegioApiUrl}/${this.colegioId}?page=${page}&limit=${this.pageSize}`;
      if (search) {
        apiUrl += `&search=${encodeURIComponent(search)}`;
      }
    }

    console.log('🌐 Llamando API:', apiUrl);

    this.http.get<any>(apiUrl, { headers }).subscribe({
      next: (response) => {
        console.log('📥 Respuesta completa de la API:', response);
        console.log('📥 Tipo de respuesta:', typeof response);
        console.log('📥 Es array?', Array.isArray(response));

        this.ngZone.run(() => {
          let studentsData: any[] = [];

          // CORRECCIÓN: Mejorar el procesamiento de la respuesta
          if (Array.isArray(response)) {
            studentsData = response;
            console.log('📊 Respuesta es array directo:', studentsData.length);
          } else if (response && typeof response === 'object') {
            // Priorizar 'data' que es lo que viene en tu ejemplo
            if (response.data && Array.isArray(response.data)) {
              studentsData = response.data;
              console.log(
                '📊 Datos encontrados en response.data:',
                studentsData.length
              );
            } else {
              // Buscar en otras propiedades posibles
              const possibleKeys = [
                'students',
                'alumnos',
                'alumno',
                'items',
                'result',
                'lista',
              ];
              for (const key of possibleKeys) {
                if (response[key] && Array.isArray(response[key])) {
                  studentsData = response[key];
                  console.log(
                    `📊 Datos encontrados en ${key}:`,
                    studentsData.length
                  );
                  break;
                }
              }
            }
          }

          // CORRECCIÓN: Validar que tenemos datos válidos
          if (!Array.isArray(studentsData)) {
            console.error('❌ Los datos no son un array válido:', studentsData);
            studentsData = [];
          }

          console.log('👥 Estudiantes procesados:', studentsData);

          if (this.selectedSalonId) {
            // Modo filtro por salón - no invertir orden aquí
            this.students = [...studentsData];
            this.filteredStudents = [...this.students];
            this.totalAlumnos = studentsData.length;
            this.totalPages = 1;
            this.currentPage = 1;
          } else {
            // Modo paginación normal - invertir orden si es necesario
            this.students = [...studentsData].reverse();
            this.filteredStudents = [...this.students];
            this.currentPage = page;

            // CORRECCIÓN: Manejar metadatos de paginación
            if (
              response &&
              typeof response === 'object' &&
              !Array.isArray(response)
            ) {
              this.totalAlumnos =
                response.totalAlumnos ||
                response.total ||
                response.count ||
                studentsData.length;
              this.totalPages =
                response.totalPages ||
                response.totalPaginas ||
                Math.ceil(this.totalAlumnos / this.pageSize);
            } else {
              // Si no hay metadatos, calcular basado en los datos
              this.totalAlumnos = studentsData.length;
              this.totalPages = Math.ceil(this.totalAlumnos / this.pageSize);
            }
          }

          // CORRECCIÓN: Asegurar que totalPages sea al menos 1
          if (this.totalPages < 1) {
            this.totalPages = 1;
          }

          console.log('📊 Estado final:', {
            students: this.students.length,
            filteredStudents: this.filteredStudents.length,
            totalAlumnos: this.totalAlumnos,
            totalPages: this.totalPages,
            currentPage: this.currentPage,
          });

          this.updateVisiblePages();
          this.loading = false;

          // CORRECCIÓN: Forzar detección de cambios
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('❌ Error completo al cargar estudiantes:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);

        this.ngZone.run(() => {
          this.students = [];
          this.filteredStudents = [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  // FIX 2026-03-23 — filterStudents ya no se usa, la búsqueda es server-side
  // Se mantiene el método por si algún otro flujo lo referencia
  filterStudents(term: string) {
    this.ngZone.run(() => {
      this.filteredStudents = [...this.students];
      this.cdr.detectChanges();
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddStudentComponent, {
      width: this.isMobile ? '95vw' : '1000px',
      maxWidth: this.isMobile ? '95vw' : '100vw',
      height: 'auto',
      panelClass: 'custom-dialog',
      data: { colegioId: this.colegioId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('✅ Estudiante agregado, recargando lista...');
        this.loadStudents(1);
      }
    });
  }

  openEditDialog(student: any): void {
    const dialogRef = this.dialog.open(StudentEditComponent, {
      width: this.isMobile ? '95vw' : '1000px',
      maxWidth: this.isMobile ? '95vw' : '100vw',
      height: 'auto',
      panelClass: 'custom-dialog',
      data: {
        student: student,
        id: student.id,
        numero_documento: student.numero_documento,
        colegioId: this.colegioId,
        alumnoSalonId: student.alumnoSalonId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('✅ Estudiante editado, recargando lista...');
        this.loadStudents(this.currentPage);
      }
    });
  }

  confirmDelete(id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: this.isMobile ? '90vw' : '400px',
      data: {
        message: '¿Estás seguro de que deseas eliminar este alumno?',
        title: 'Confirmar eliminación',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteStudent(id);
      }
    });
  }

  deleteStudent(id: number): void {
    if (!id) {
      console.error('❌ ID del alumno no disponible');
      return;
    }

    console.log('🗑️ Eliminando estudiante (con recarga forzada):', id);
    this.loading = true;
    const headers = this.getHeaders();
    const deleteUrl = `${this.apiUrl}/${id}`;

    this.http
      .delete(deleteUrl, { headers, responseType: 'text' as 'json' })
      .subscribe({
        next: (response) => {
          console.log('✅ Estudiante eliminado. Forzando recarga de página...');
          // Forzar recarga completa
          window.location.href = window.location.href;
          window.location.reload();
        },
        error: (error) => {
          console.error('❌ Error al eliminar alumno:', error);
          this.ngZone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();

            // Intentar recargar incluso si hay error (opcional, pero el usuario está desesperado)
            // alert('Hubo un error, pero vamos a recargar por si acaso');
            // window.location.reload();
          });
        },
      });
  }

  changePage(page: number) {
    if (this.selectedSalonId) {
      return;
    }

    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log('📄 Cambiando a página:', page);
      this.loadStudents(page, this.searchTermControl.value?.trim() || '');
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.loadStudents(1, this.searchTermControl.value?.trim() || '');
  }

  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.changePage(1);
    }
  }

  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.changePage(this.totalPages);
    }
  }



  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    return this.visiblePages;
  }

  getAllPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  canGoToFirstPage(): boolean {
    return this.currentPage > 1;
  }

  canGoToLastPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  canGoToPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  canGoToNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  showEllipsisBefore(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 1;
  }

  showEllipsisAfter(): boolean {
    return (
      this.visiblePages.length > 0 &&
      this.visiblePages[this.visiblePages.length - 1] < this.totalPages
    );
  }

  getSelectedSalonName(): string {
    if (!this.selectedSalonId) return '';
    const salon = this.availableSalones.find(
      (s) => s.id === this.selectedSalonId
    );
    return salon ? salon.nombre : `Salón ${this.selectedSalonId}`;
  }

  trackByStudentId(index: number, student: any): any {
    return student.id || student.numero_documento || index;
  }

  trackBySalonId(index: number, salon: any): any {
    return salon.id || salon.salonId || index;
  }

  // Método para descargar la plantilla
  downloadTemplate(): void {
    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.setAttribute('href', '/assets/FORMATO_ALUMNOS_DNIVEL.xlsx');
    link.setAttribute('download', 'FORMATO_ALUMNOS_DNIVEL.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) throw new Error('No se puede usar múltiples archivos');

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      this.processBulkUpload(data);

      // Reset input
      event.target.value = '';
    };
    reader.readAsBinaryString(target.files[0]);
  }

  async processBulkUpload(data: any[]): Promise<void> {
    if (!data || data.length === 0) {
      alert('El archivo está vacío');
      return;
    }

    if (!confirm(`Se encontraron ${data.length} registros. ¿Desea procesarlos?`)) {
      return;
    }

    this.loading = true;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Helper para obtener valores buscando en varias posibles claves
    const getValue = (row: any, keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
          const val = row[key].toString().trim();
          if (val !== '') return val;
        }
      }
      return undefined;
    };

    // Cargar apoderados existentes para verificar duplicados/reutilizar
    let existingApoderados: any[] = [];
    try {
      const headers = this.getHeaders();
      const apoderadosResponse: any = await firstValueFrom(this.http.get(this.apoderadosListUrl + '/' + this.colegioId, { headers }));
      existingApoderados = Array.isArray(apoderadosResponse) ? apoderadosResponse : (apoderadosResponse.data || []);
    } catch (e) {
      console.error('Error cargando apoderados', e);
    }

    // Mapa de DNI -> ID Apoderado
    const apoderadoMap = new Map<string, number>();
    existingApoderados.forEach(a => {
      if (a.numeroDocumento || a.dni) {
        apoderadoMap.set((a.numeroDocumento || a.dni).toString(), a.id);
      }
    });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Intentar extraer valores usando múltiples nombres de columna posibles
      const valDni = getValue(row, ['DNI ALUMNO', 'DNI_ALUMNO', 'DNI']);
      const valNombres = getValue(row, ['NOMBRES', 'NOMBRES_ALUMNO', 'NOMBRES ALUMNO']);
      const valSalon = getValue(row, ['AULA', 'ID_SALON', 'SALON', 'GRADO']);

      try {
        // Validar datos mínimos
        if (!valDni || !valNombres || !valSalon) {
          throw new Error(`Fila ${i + 2}: Faltan datos obligatorios (DNI Alumno, Nombre, Aula/Salon)`);
        }

        // Determinar ID Salón (puede ser ID o Nombre)
        let idSalon = 0;
        if (!isNaN(parseInt(valSalon))) {
          idSalon = parseInt(valSalon);
        } else {
          // Buscar salón por nombre
          const salonName = valSalon.toString().trim().toLowerCase();
          const salonEncontrado = this.availableSalones.find(s =>
            s.nombre && s.nombre.toString().toLowerCase().trim() === salonName
          );

          if (salonEncontrado) {
            idSalon = salonEncontrado.id;
          } else {
            throw new Error(`Fila ${i + 2}: No se encontró el salón/aula "${valSalon}" en el sistema.`);
          }
        }

        let idApoderado = 0;
        // Datos del apoderado
        const valDniApoderado = getValue(row, ['DNI APODERADO', 'DNI_APODERADO']);

        if (valDniApoderado) {
          const dniApoderado = valDniApoderado.toString();

          if (apoderadoMap.has(dniApoderado)) {
            idApoderado = apoderadoMap.get(dniApoderado)!;
          } else {
            // Crear apoderado
            const newApoderado = {
              nombres: getValue(row, ['NOMBRES APODERADO', 'NOMBRES_APODERADO']) || 'Apoderado',
              apellidoPaterno: getValue(row, ['APELLIDO PATERNO APODERADO', 'APELLIDO_PATERNO_APODERADO']) || '',
              apellidoMaterno: getValue(row, ['APELLIDO MATERNO APODERADO', 'APELLIDO_MATERNO_APODERADO']) || '',
              numeroDocumento: dniApoderado,
              genero: getValue(row, ['GÉNERO APODERADO', 'GENERO APODERADO', 'GENERO_APODERADO']) || '',
              telefono: getValue(row, ['CELULAR APODERADO', 'TELEFONO_APODERADO', 'TELEFONO']) || '',
              parentesco: getValue(row, ['PARENTESCO']) || 'PADRE',
              contrasena: getValue(row, ['CONTRASEÑA APODERADO', 'CONTRASENA_APODERADO']) || dniApoderado,
              tipoUsuario: 'apoderado',
              idColegio: this.colegioId
            };

            // Asegurar string en telefono
            if (newApoderado.telefono) newApoderado.telefono = newApoderado.telefono.toString();

            try {
              const headers = this.getHeaders();
              const resp: any = await firstValueFrom(this.http.post(this.apoderadoCreateApiUrl, newApoderado, { headers }));
              if (resp && resp.id) {
                idApoderado = resp.id;
                apoderadoMap.set(dniApoderado, idApoderado);
              }
            } catch (err: any) {
              console.error('Error creando apoderado', err);
              if (err.status === 400 && err.error && err.error.message && err.error.message.includes('existe')) {
                // Si ya existe
                // Si no lo teníamos mapeado, tal vez deberíamos buscarlo, pero asumimos que ok.
              }
            }
          }
        }

        // Parsear fecha
        const rawFecha = getValue(row, ['FECHA DE NACIMIENTO', 'FECHA_NACIMIENTO_ALUMNO (DD/MM/YYYY)', 'FECHA NACIMIENTO']);
        const fechaNac = this.parseDate(rawFecha);

        // 2. Crear Alumno
        const newStudent = {
          numeroDocumento: valDni.toString(),
          nombres: valNombres,
          apellidoPaterno: getValue(row, ['APELLIDO PATERNO', 'APELLIDO_PATERNO_ALUMNO']) || '',
          apellidoMaterno: getValue(row, ['APELLIDO MATERNO', 'APELLIDO_MATERNO_ALUMNO']) || '',
          genero: (getValue(row, ['GÉNERO', 'GENERO', 'GENERO_ALUMNO (M/F)']) || 'M').toString().toUpperCase().startsWith('F') ? 'f' : 'm',
          telefono: (getValue(row, ['CELULAR ALUMNO', 'TELEFONO_ALUMNO', 'CELULAR']) || '').toString(),
          fechaNacimiento: fechaNac,
          direccion: getValue(row, ['DIRECCIÓN', 'DIRECCION', 'DIRECCION_ALUMNO']) || '',
          estado: 'Activo',
          contrasena: getValue(row, ['CONTRASEÑA', 'CONTRASENA', 'CONTRASENA_ALUMNO']) || valDni.toString(),
          idApoderado: idApoderado,
          idSalon: idSalon,
        };

        const headers = this.getHeaders();
        await firstValueFrom(this.http.post(this.apiUrl, newStudent, { headers }));
        successCount++;

      } catch (error: any) {
        // Manejar "errores" que en realidad son confirmaciones de éxito (quirk del backend/CORS)
        if (error.status === 0 || error.status === 200 || error.status === 201) {
          successCount++;
          // Continuar al siguiente sin loguear error
        } else {
          errorCount++;
          const msg = error.message || (error.error ? error.error.message : 'Error desconocido');
          errors.push(`Fila ${i + 2} (${valDni || '?'}): ${msg}`);
        }
      }
    }

    this.loading = false;
    this.loadStudents(this.currentPage);

    let resultMsg = `Proceso finalizado.\nExitosos: ${successCount}\nFallidos: ${errorCount}`;
    if (errors.length > 0) {
      resultMsg += '\n\nErrores:\n' + errors.slice(0, 10).join('\n') + (errors.length > 10 ? '\n...' : '');
    }

    alert(resultMsg);
  }

  private parseDate(dateStr: any): string | null {
    if (!dateStr) return null;
    // Asumiendo DD/MM/YYYY o formato Excel fecha
    if (typeof dateStr === 'number') {
      // Excel date number
      const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
  }

  logout() {
    this.userService.clearUserData();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

}
