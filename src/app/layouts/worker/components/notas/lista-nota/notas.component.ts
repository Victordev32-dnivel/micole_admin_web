import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { EditNotasComponent } from '../edit-nota/edit-nota.component';
import { DeleteNotaModalComponent } from '../lista-nota/eliminar.component'; // Importar el componente de edición

// Nueva interface que coincide con el formato requerido del endpoint
interface NotaResponse {
  nombre: string;
  link: string;
  id?: number; // Agregamos ID para poder eliminar y modificar
}

// Interface para uso interno
interface Nota {
  nombre: string;
  link: string;
  id: number; // ID es requerido para eliminar y modificar
  idAlumno?: number;
  idColegio?: number;
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

  // Columnas actualizadas para el nuevo formato
  displayedColumns: string[] = ['nombre', 'acciones'];
  editingNota: Nota | null = null;

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

  // Usando el colegioId dinámico en lugar de hardcodeado
  this.http
    .get<NotaResponse[]>(
      `https://proy-back-dnivel-44j5.onrender.com/api/nota/colegio/${this.colegioId}`,
      { headers: this.getHeaders() }
    )
    .subscribe({
      next: (response) => {
        this.ngZone.run(() => {
        

          // Manejar diferentes tipos de respuesta
          if (Array.isArray(response)) {
            // Si es un array (puede estar vacío o con datos)
            this.notas = response.map((nota, index) => ({
              nombre: nota.nombre,
              link: nota.link,
              id: nota.id || index + 1,
            }));
          } else if (response === null || response === undefined) {
            // Si la respuesta es null o undefined, inicializar como array vacío
         
            this.notas = [];
          } else {
            // Si la respuesta no es un array pero tampoco es null, intentar convertir
            console.warn('La respuesta no es un array:', response);
            this.notas = [];
          }

          this.totalNotas = this.notas.length;
          this.loadingNotas = false;
          // NO establecer error aquí, solo cuando hay un error real de conexión
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar notas:', error);
        this.loadingNotas = false;
        
        // Solo mostrar error en casos de error real de servidor/conexión
        if (error.status === 0) {
          this.error = 'Error de conexión. Verifique su internet';
        } else if (error.status === 404) {
          // Si es 404, puede significar que no hay notas, no necesariamente un error
       
          this.notas = [];
          this.totalNotas = 0;
          this.error = null; // No mostrar error
        } else if (error.status >= 500) {
          this.error = 'Error del servidor. Intente de nuevo';
        } else if (error.status === 403) {
          this.error = 'No tiene permisos para ver las notas';
        } else {
          this.error = 'Error al cargar las notas. Intente de nuevo';
        }
        
        this.cdr.detectChanges();
      },
    });
}

  openAddNotaDialog(): void {
    const dialogRef = this.dialog.open(AddNotaComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true,
      data: { colegioId: this.colegioId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Nota agregada correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadNotas(); // Recargar la lista después de agregar
      }
    });
  }

  onViewPdf(linkUrl: string): void {
    if (
      !linkUrl ||
      linkUrl.trim() === '' ||
      linkUrl === 'qwqw' ||
      linkUrl === 'null' ||
      linkUrl === 'undefined'
    ) {
      this.snackBar.open('❌ El PDF no está disponible o no existe', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }

    // Validar si la URL es válida
    try {
      new URL(linkUrl);
    } catch (error) {
      this.snackBar.open('❌ La URL del PDF no es válida', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }


    // Intentar abrir el PDF y manejar errores
    const newWindow = window.open(linkUrl, '_blank');

    if (!newWindow) {
      this.snackBar.open(
        '❌ No se pudo abrir el PDF. Verifique su bloqueador de ventanas emergentes',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        }
      );
      return;
    }

    // Verificar si el PDF se carga correctamente (después de un tiempo)
    setTimeout(() => {
      try {
        if (newWindow.closed) {
          // La ventana se cerró, posiblemente por error de carga
          this.snackBar.open('⚠️ El PDF podría no estar disponible', 'Cerrar', {
            duration: 3000,
            panelClass: ['warning-snackbar'],
          });
        }
      } catch (error) {
        // Error de acceso por CORS, pero esto es normal
      
      }
    }, 2000);
  }


  // Método actualizado para editar/modificar nota usando el modal
  editNota(nota: Nota): void {
    const dialogRef = this.dialog.open(EditNotasComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        nota: nota, // Pasar la nota completa al modal
        colegioId: this.colegioId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('✅ Nota actualizada correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        });
        this.loadNotas(); // Recargar la lista después de editar
      }
    });
  }

  // Método auxiliar para actualizar nota (ahora se usará desde el modal)
  updateNota(notaId: number, nuevoNombre: string): void {
    const payload = {
      nombre: nuevoNombre,
    };

    this.http
      .put(
        `https://proy-back-dnivel-44j5.onrender.com/api/nota/${notaId}`,
        payload,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
       
          this.loadNotas(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al actualizar nota:', error);
          let errorMessage = 'Error al actualizar la nota';

          if (error.status === 404) {
            errorMessage = 'La nota no fue encontrada';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para modificar esta nota';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          throw new Error(errorMessage);
        },
      });
  }

  // Método para eliminar nota usando el endpoint proporcionado


  private deleteNota(notaId: number): void {
    this.http
      .delete(`https://proy-back-dnivel-44j5.onrender.com/api/nota/${notaId}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
      
          this.snackBar.open('✅ Nota eliminada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          this.loadNotas(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error al eliminar nota:', error);
          let errorMessage = 'Error al eliminar la nota';

          if (error.status === 404) {
            errorMessage = 'La nota no fue encontrada';
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para eliminar esta nota';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
            duration: 4000,
            panelClass: ['error-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
        },
      });
  }
  confirmDelete(nota: Nota): void {
  if (!nota.id) {
    this.snackBar.open('❌ No se puede eliminar: ID de nota no disponible', 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  const dialogRef = this.dialog.open(DeleteNotaModalComponent, {
    width: '500px',
    maxWidth: '95vw',
    disableClose: true,
    data: {
      nota: {
        id: nota.id,
        nombre: nota.nombre,
        link: nota.link
      }
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // El modal ya maneja el SnackBar de éxito
      this.loadNotas(); // Recargar la lista después de eliminar
    }
  });
}

  toggleMenu() {
    
  }

  onBack(): void {
    window.history.back();
  }
}
