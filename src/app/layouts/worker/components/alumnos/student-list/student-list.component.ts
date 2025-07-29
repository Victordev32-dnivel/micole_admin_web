import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ConfirmationDialogComponent } from '../confirmation-delete/confirmation-dialog.component';
import { StudentEditComponent } from '../edit-student/edit-student.component';
import { AddStudentComponent } from '../add-student/add-student.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
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

  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/alumno';

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      searchTerm: this.searchTermControl
    });
  }

  ngOnInit() {
    this.loadStudents();
    this.searchTermControl.valueChanges.subscribe(term => {
      this.filterStudents(term);
    });
  }

  loadStudents(page: number = 1) {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}?page=${page}`).subscribe({
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
      }
    });
  }

  filterStudents(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        this.filteredStudents = this.students.filter(student =>
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
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
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
      data: { id: student.id, numero_documento: student.numero_documento } // Pasa el id
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStudents(this.currentPage);
      }
    });
  }

  confirmDelete(dni: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: '¿Estás seguro de eliminar este alumno?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteStudent(dni);
      }
    });
  }

  deleteStudent(dni: string): void {
    console.log('Eliminar alumno con DNI:', dni);
    this.loadStudents(this.currentPage);
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
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}