import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
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
  pageSize: number = 10;
  loading: boolean = true;
  userName: string = '';
  userType: string = '';
  colegioId: number = 0;

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

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
      this.loadStudents();
      this.searchTermControl.valueChanges.subscribe((term) => {
        this.filterStudents(term);
      });
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
    this.http
      .get<any>(`${this.apiUrl}/${this.colegioId}?page=${page}`, { headers })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.students = response.data;
            this.filteredStudents = [...this.students];
            this.currentPage = response.page;
            this.totalPages = response.totalPages;
            this.totalAlumnos = response.totalAlumnos;
            console.log('Datos cargados:', this.filteredStudents);
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar estudiantes:', error);
          this.loading = false;
        },
      });
  }

  filterStudents(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        this.filteredStudents = this.students.filter((student) =>
          student.nombre_completo.toLowerCase().includes(term.toLowerCase())
        );
        this.loading = false;
        this.cdr.detectChanges();
      }, 0);
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddStudentComponent, {
      width: '1000px',
      maxWidth: '100vw',
      height: 'auto',
      panelClass: 'custom-dialog',
      data: { colegioId: this.colegioId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadStudents(this.currentPage);
      }
    });
  }

  openEditDialog(student: any): void {
    const dialogRef = this.dialog.open(StudentEditComponent, {
      width: '1000px',
      maxWidth: '100vw',
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
      width: '300px',
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
          this.loadStudents(this.currentPage);
        },
        error: (error) => {
          console.error('Error al eliminar alumno:', error);
        },
      });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudents(page);
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  logout() {
    this.userService.clearUserData();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
