import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    ReactiveFormsModule,
    HttpClientModule,
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css'],
})
export class StudentListComponent implements OnInit {
  searchForm: FormGroup;
  searchTermControl: FormControl = new FormControl('');
  students: any[] = [];
  filteredStudents: any[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  totalAlumnos: number = 0;
  pageSize: number = 30;
  loading: boolean = true;
  userName: string = '';
  userType: string = '';
  colegioId: number = 0;
  
  // Variables para paginación responsiva
  isMobile: boolean = false;
  visiblePages: number[] = [];
  maxVisiblePages: number = 5;

  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno/colegio';
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
      this.loadStudents();
      this.searchTermControl.valueChanges.subscribe((term) => {
        this.filterStudents(term);
      });
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
      this.visiblePages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

      this.visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.userName = userData.nombre;
      this.userType = userData.tipoUsuario;
      this.colegioId = userData.colegio;
      console.log('Datos del usuario cargados:', {
        nombre: this.userName,
        tipo: this.userType,
        colegioId: this.colegioId,
      });
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

  loadStudents(page: number = 1) {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.loading = false;
      return;
    }

    this.loading = true;
    const headers = this.getHeaders();
    
    console.log(`Cargando página: ${page}, pageSize: ${this.pageSize}, colegioId: ${this.colegioId}`);
    
    this.http
      .get<any>(`${this.apiUrl}/${this.colegioId}?page=${page}&limit=${this.pageSize}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Respuesta de la API:', response);
          console.log('Número de estudiantes recibidos:', response.data?.length || 0);
          
          this.ngZone.run(() => {
            // Asignar datos directamente sin invertir
            this.students = response.data || [];
            this.filteredStudents = [...this.students];
            this.currentPage = page;
            
            // Calcular total de páginas correctamente
            this.totalAlumnos = response.totalAlumnos || 0;
            this.totalPages = response.totalPages || Math.ceil(this.totalAlumnos / this.pageSize);
            
            // Asegurar que totalPages sea al menos 1
            if (this.totalPages < 1) {
              this.totalPages = 1;
            }
            
            this.updateVisiblePages();
            
            console.log(`Página actual: ${page}, Total páginas: ${this.totalPages}, Total alumnos: ${this.totalAlumnos}`);
            console.log('Estudiantes mostrados:', this.filteredStudents.length);
            
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
            // Buscar por nombre completo
            const matchesName = student.nombre_completo?.toLowerCase().includes(searchTerm);
            // Buscar por DNI/número de documento
            const matchesDNI = student.numero_documento?.toString().toLowerCase().includes(searchTerm);
            
            return matchesName || matchesDNI;
          });
        }
        console.log(`Estudiantes filtrados: ${this.filteredStudents.length} de ${this.students.length} total`);
        console.log('Término de búsqueda:', term);
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
        // Recargar la primera página para mostrar el nuevo estudiante
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
        id: student.id,
        numero_documento: student.numero_documento,
        colegioId: this.colegioId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStudents(this.currentPage);
      }
    });
  }

  confirmDelete(dni: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: this.isMobile ? '90vw' : '300px',
      data: { message: '¿Estás seguro de eliminar este alumno?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteStudent(dni);
      }
    });
  }

  deleteStudent(dni: string): void {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      return;
    }

    const headers = this.getHeaders();
    this.http
      .delete(`${this.apiUrl}/${this.colegioId}/${dni}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Alumno eliminado exitosamente');
          // Recargar la página actual después de eliminar
          this.loadStudents(this.currentPage);
        },
        error: (error) => {
          console.error('Error al eliminar alumno:', error);
        },
      });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log(`Cambiando a página: ${page}`);
      this.loadStudents(page);
    }
  }

  // Métodos para navegación de páginas
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

  // Métodos para obtener números de página
  getPageNumbers(): number[] {
    return this.visiblePages;
  }

  getAllPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Métodos de utilidad para la paginación
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
    return this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
  }

  logout() {
    this.userService.clearUserData();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}