import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
} from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { UserData, UserService } from '../../../../../services/UserData';
import { AddNotaComponent } from '../add-nota/add-notas.component';

interface Nota {
  id: number;
  nombre: string;
  pdf: string;
  idAlumno: number;
  idColegio: number;
  alumnoNombre?: string;
  salonNombre?: string;
  fechaCreacion?: string;
}

@Component({
  selector: 'app-notas',
  templateUrl: './notas.component.html',
  styleUrls: ['./notas.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
  ],
})
export class NotasComponent implements OnInit {
  notas: Nota[] = [];
  loadingNotas: boolean = true;
  colegioId: number | null = null;
  error: string | null = null;
  totalNotas: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 20];

  // Columnas para la tabla de notas
  displayedColumns: string[] = ['nombre', 'alumno', 'salon', 'fecha', 'acciones'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
     private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadNotas();
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
    }
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.loadNotas();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  loadNotas() {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.loadingNotas = false;
      return;
    }

    this.loadingNotas = true;
    this.error = null;

    this.http
      .get<any>(
        `https://proy-back-dnivel-44j5.onrender.com/api/nota/colegio/1`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.notas = Array.isArray(response) ? response : [];
            this.totalNotas = this.notas.length;
            this.loadingNotas = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar notas:', error);
          this.loadingNotas = false;
          this.error = 'Error al cargar las notas. Intente de nuevo';
          this.cdr.detectChanges();
        },
      });
  }

  openAddNotaDialog(): void {
    const dialogRef = this.dialog.open(AddNotaComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true,
      data: { colegioId: this.colegioId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        this.snackBar.open('Nota agregada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadNotas();
      } else if (result === 'error') {
        this.snackBar.open('Error al agregar la nota', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  onViewPdf(pdfUrl: string): void {
    if (!pdfUrl) {
      this.snackBar.open('El PDF no está disponible', 'Cerrar', {
        duration: 3000,
      });
      return;
    }
    window.open(pdfUrl, '_blank');
  }

  confirmDelete(nota: Nota): void {
    const confirmacion = confirm(`¿Está seguro de eliminar la nota "${nota.nombre}"?`);
    if (confirmacion) {
      this.deleteNota(nota.id);
    }
  }

  private deleteNota(notaId: number): void {
    this.http
      .delete(
        `https://proy-back-dnivel-44j5.onrender.com/api/nota/${notaId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Nota eliminada correctamente', 'Cerrar', {
            duration: 3000,
          });
          this.loadNotas();
        },
        error: (error) => {
          console.error('Error al eliminar nota:', error);
          this.snackBar.open('Error al eliminar la nota', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }
  toggleMenu() {
    // Implementa esta función si necesitas controlar el menú lateral
    console.log('Toggle menu clicked');
  }

  onBack(): void {
    window.history.back();
  }
}