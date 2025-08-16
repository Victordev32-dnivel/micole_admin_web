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
import { ConfirmationDialogComponent } from '../confirmation-delete/confirmation-dialog.component';
import { StudentEditComponent } from '../edit-student/edit-student.component';
import { AddStudentComponent } from '../add-student/add-student.component';
import { Router } from '@angular/router';
import { UserService } from '../../../../../services/UserData';

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
  private colegioApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/alumno/colegio';
  private salonApiUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon';
  private salonesListUrl =
    'https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista';
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
      this.checkScreenSize();
      this.loadUserData();
      this.loadSalones();
      this.loadStudents();
      this.searchTermControl.valueChanges.subscribe((term) => {
        this.filterStudents(term);
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
    if (userData) {
      this.userName = userData.nombre;
      this.userType = userData.tipoUsuario;
      this.colegioId = userData.colegio;
    }

    this.userService.userData$.subscribe((userData) => {
      if (userData) {
        this.userName = userData.nombre;
        this.userType = userData.tipoUsuario;
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

  loadSalones(): void {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible para cargar salones');
      return;
    }

    this.loadingSalones = true;
    const headers = this.getHeaders();
    const salonesUrl = `${this.salonesListUrl}/${this.colegioId}`;

    this.http.get<any>(salonesUrl, { headers }).subscribe({
      next: (response) => {
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

        this.loadingSalones = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar salones:', error);
        this.availableSalones = [];
        this.loadingSalones = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSalonFilterChange(): void {
    const salonId = this.salonFilterControl.value;

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

    this.currentPage = 1;
    this.loadStudents(1);
  }

  loadStudents(page: number = 1) {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.loading = false;
      return;
    }

    this.loading = true;
    const headers = this.getHeaders();

    let apiUrl: string;
    if (this.selectedSalonId) {
      apiUrl = `${this.salonApiUrl}/${this.selectedSalonId}`;
    } else {
      apiUrl = `${this.colegioApiUrl}/${this.colegioId}?page=${page}&limit=${this.pageSize}`;
    }

    this.http.get<any>(apiUrl, { headers }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (this.selectedSalonId) {
            let studentsData = [];
            if (Array.isArray(response)) {
              studentsData = response;
            } else if (response.data && Array.isArray(response.data)) {
              studentsData = response.data;
            } else if (response.students && Array.isArray(response.students)) {
              studentsData = response.students;
            } else if (response.alumnos && Array.isArray(response.alumnos)) {
              studentsData = response.alumnos;
            }

            // Invertir el orden del array
            this.students = studentsData.reverse();
            this.filteredStudents = [...this.students];
            this.totalAlumnos = studentsData.length;
            this.totalPages = 1;
            this.currentPage = 1;
          } else {
            const rawStudents = response.data || response.alumnos || [];
            // Invertir el orden del array
            this.students = rawStudents.reverse();
            this.filteredStudents = [...this.students];
            this.currentPage = page;
            this.totalAlumnos = response.totalAlumnos || response.total || 0;
            this.totalPages =
              response.totalPages ||
              response.totalPaginas ||
              Math.ceil(this.totalAlumnos / this.pageSize);
          }

          if (this.totalPages < 1) {
            this.totalPages = 1;
          }

          this.updateVisiblePages();
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar estudiantes:', error);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  filterStudents(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        if (!term || term.trim() === '') {
          this.filteredStudents = [...this.students];
        } else {
          const searchTerm = term.toLowerCase().trim();
          this.filteredStudents = this.students.filter((student) => {
            const matchesName = student.nombre_completo
              ?.toLowerCase()
              .includes(searchTerm);
            const matchesDNI = student.numero_documento
              ?.toString()
              .toLowerCase()
              .includes(searchTerm);
            const matchesApoderado =
              student.nombreApoderado?.toLowerCase().includes(searchTerm) ||
              student.apellidoPaternoApoderado
                ?.toLowerCase()
                .includes(searchTerm) ||
              student.apellidoMaternoApoderado
                ?.toLowerCase()
                .includes(searchTerm);

            return matchesName || matchesDNI || matchesApoderado;
          });
        }

        this.loading = false;
        this.cdr.detectChanges();
      }, 100);
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
        this.loadStudents(1);
        // Forzar el orden inverso
        this.students.reverse();
        this.filteredStudents = [...this.students];
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
        id: student.id,
        numero_documento: student.numero_documento,
        colegioId: this.colegioId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStudents(this.currentPage);
        // Forzar el orden inverso
        this.students.reverse();
        this.filteredStudents = [...this.students];
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
      console.error('ID del alumno no disponible');
      return;
    }

    this.loading = true;
    const headers = this.getHeaders();
    const deleteUrl = `${this.apiUrl}/${id}`;

    this.http
      .delete(deleteUrl, { headers, responseType: 'text' as 'json' })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            if (this.filteredStudents.length === 1 && this.currentPage > 1) {
              this.changePage(this.currentPage - 1);
            } else {
              this.loadStudents(this.currentPage);
              // Forzar el orden inverso
              this.students.reverse();
              this.filteredStudents = [...this.students];
            }
          });
        },
        error: (error) => {
          console.error('Error al eliminar alumno:', error);
          this.ngZone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  changePage(page: number) {
    if (this.selectedSalonId) {
      return;
    }

    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.loadStudents(page);
    }
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

  logout() {
    this.userService.clearUserData();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}