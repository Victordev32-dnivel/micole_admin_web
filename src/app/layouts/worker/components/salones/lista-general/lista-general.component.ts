import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../../services/UserData';
import { FuncionAgregarComponent } from '../funcion-agregar/funcion-agregar.component';
import { EliminarComponent } from './eliminar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, timeout, retry } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-lista-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './lista-general.component.html',
  styleUrls: ['./lista-general.component.css'],
})
export class ListaGeneralComponent implements OnInit {
  tipoSeleccionado = new FormControl<'niveles' | 'secciones' | 'grados' | 'salones'>(
    'niveles',
    { nonNullable: true }
  );
  colegiosId: number = 0;
  data: any[] = [];
  filteredData: any[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns: string[] = [];
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalResults = 0;
  pages: number[] = [];
  searchTerm = '';

  private apiBase = '/api';
  private maxRetries = 3;
  private requestTimeout = 30000; // 30 segundos

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.userService.userData$.subscribe(userData => {
      if (userData) {
        this.colegiosId = userData.colegio;
        this.loadData();
      }
    });

    // Fallback if subscription doesn't fire immediately (though BehaviorSubject should)
    const userData = this.userService.getUserData();
    if (userData && !this.colegiosId) {
      this.colegiosId = userData.colegio;
      this.loadData();
    }

    this.tipoSeleccionado.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.searchTerm = '';
      this.loadData();
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.userService.getJwtToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;

    const tipo = this.tipoSeleccionado.value;
    let url = '';

    switch (tipo) {
      case 'niveles':
        url = `${this.apiBase}/nivel/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'secciones':
        url = `${this.apiBase}/seccion/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'grados':
        url = `${this.apiBase}/grado/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'salones':
        url = `${this.apiBase}/salon/colegio/${this.colegiosId}?page=${this.currentPage}&pagesize=${this.pageSize}`;
        break;
    }

    console.log(`🔍 Cargando ${tipo}:`, url);

    this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        timeout(this.requestTimeout), // Timeout de 30 segundos
        retry(2), // Reintentar 2 veces
        catchError((error: HttpErrorResponse) => {
          console.error(`❌ Error al cargar ${tipo}:`, error);

          let errorMessage = 'Error al cargar los datos';

          if (error.status === 0) {
            errorMessage = 'Sin conexión al servidor. Verifique su conexión a internet.';
          } else if (error.status === 404) {
            errorMessage = `No se encontraron ${tipo} para este colegio.`;
          } else if (error.status === 403) {
            errorMessage = 'No tiene permisos para acceder a estos datos.';
          } else if (error.status === 401) {
            errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Intente más tarde.';
          }

          this.error = errorMessage;
          this.loading = false;
          this.data = [];
          this.filteredData = [];
          this.cdr.detectChanges();

          return of(null); // Retorna observable vacío
        })
      )
      .subscribe({
        next: (response) => {
          if (!response) return; // Si hubo error y se retornó null

          try {
            console.log(`✅ Respuesta de ${tipo}:`, response);

            this.data = response.data || [];

            // Corregir formato de horario para salones (Inicio - Fin)
            if (tipo === 'salones') {
              this.data.forEach(item => {
                let start = item.horaInicio;
                let end = item.horaFin;

                // Si no hay campos individuales, intentar extraer del string horario
                if ((!start || !end) && item.horario) {
                  const parts = item.horario.split(' - ');
                  if (parts.length === 2) {
                    start = parts[0].trim();
                    end = parts[1].trim();
                  }
                }

                if (start && end) {
                  if (start > end) {
                    item.horario = `${end} - ${start}`;
                  } else {
                    item.horario = `${start} - ${end}`;
                  }
                }
              });
            }

            this.filteredData = [...this.data];
            this.totalPages = response.totalPages || 1;
            this.totalResults = response.totalNiveles ||
              response.totalSecciones ||
              response.totalGrados ||
              response.totalSalones ||
              this.data.length;

            this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            this.setDisplayedColumns(tipo);
            this.applySearch();

            console.log(`📊 Datos cargados: ${this.data.length} elementos`);

          } catch (parseError) {
            console.error('❌ Error al procesar la respuesta:', parseError);
            this.error = 'Error al procesar la respuesta del servidor';
          }

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  setDisplayedColumns(tipo: 'niveles' | 'secciones' | 'grados' | 'salones') {
    switch (tipo) {
      case 'niveles':
      case 'secciones':
      case 'grados':
        this.displayedColumns = ['id', 'nombre', 'actions'];
        break;
      case 'salones':
        this.displayedColumns = ['id', 'nombre', 'horario', 'tipo', 'actions'];
        break;
    }
  }

  applySearch() {
    const term = (this.searchTerm || '').toLowerCase().trim();

    if (!term) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter((item) => {
        const matchesName = (item.nombre || '').toLowerCase().includes(term);

        if (this.tipoSeleccionado.value === 'salones') {
          const matchesHorario = (item.horario || '').toLowerCase().includes(term);
          const matchesTipo = (item.tipo || '').toLowerCase().includes(term);
          return matchesName || matchesHorario || matchesTipo;
        }

        return matchesName;
      });
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.applySearch();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData();
  }

  // Método para reintentar manualmente
  retryLoad() {
    console.log('🔄 Reintentando cargar datos...');
    this.loadData();
  }

  abrirModalAgregar() {
    const tipo = this.tipoSeleccionado.value;
    const width = tipo === 'salones' ? '820px' : '520px';

    const dialogRef = this.dialog.open(FuncionAgregarComponent, {
      width,
      maxWidth: '95vw',
      panelClass: 'custom-dialog',
      data: { tipo, idColegio: this.colegiosId },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        this.currentPage = 1;
        this.loadData();
      }
    });
  }

  abrirModalEditar(id: number) {
    const tipo = this.tipoSeleccionado.value;

    switch (tipo) {
      case 'niveles':
        this.editarNivel(id);
        break;
      case 'secciones':
        this.editarSeccion(id);
        break;
      case 'grados':
        this.editarGrado(id);
        break;
      case 'salones':
        this.editarSalon(id);
        break;
    }
  }

  private editarNivel(id: number) {
    import('./edit-nivel.component').then(({ EditNivelComponent }) => {
      const dialogRef = this.dialog.open(EditNivelComponent, {
        width: '520px',
        maxWidth: '95vw',
        panelClass: 'custom-dialog',
        data: { id, idColegio: this.colegiosId },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          this.snackBar.open('Nivel actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadData();
        } else if (result?.error) {
          this.snackBar.open(result.error, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }).catch((error) => {
      console.error('❌ Error al cargar EditNivelComponent:', error);
      this.snackBar.open('Error al cargar el componente de edición', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  private editarSeccion(id: number) {
    console.log('✏️ Editando sección:', { id, colegioId: this.colegiosId });

    // Verificar que tenemos los datos necesarios
    if (!id || !this.colegiosId) {
      this.snackBar.open('Error: Datos insuficientes para editar la sección', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    import('./edit-secciones.component').then(({ EditSeccionesComponent }) => {
      const dialogRef = this.dialog.open(EditSeccionesComponent, {
        width: '520px',
        maxWidth: '95vw',
        panelClass: 'custom-dialog',
        data: {
          id: Number(id), // Asegurar que sea número
          idColegio: Number(this.colegiosId) // Asegurar que sea número
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          this.snackBar.open('Sección actualizada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadData();
        } else if (result?.error) {
          this.snackBar.open(result.error, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }).catch((error) => {
      console.error('❌ Error al cargar EditSeccionesComponent:', error);
      this.snackBar.open('Error al cargar el componente de edición', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  private editarGrado(id: number) {
    import('./edit-grados.component').then(({ EditGradosComponent }) => {
      const dialogRef = this.dialog.open(EditGradosComponent, {
        width: '520px',
        maxWidth: '95vw',
        panelClass: 'custom-dialog',
        data: { id, idColegio: this.colegiosId },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          this.snackBar.open('Grado actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadData();
        } else if (result?.error) {
          this.snackBar.open(result.error, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }).catch((error) => {
      console.error('❌ Error al cargar EditGradosComponent:', error);
      this.snackBar.open('Error al cargar el componente de edición', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  private editarSalon(id: number) {
    import('./edit-salon.component').then(({ EditSalonComponent }) => {
      const dialogRef = this.dialog.open(EditSalonComponent, {
        width: '820px',
        maxWidth: '95vw',
        panelClass: 'custom-dialog',
        data: { id, idColegio: this.colegiosId },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          this.snackBar.open('Salón actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadData();
        } else if (result?.error) {
          this.snackBar.open(result.error, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }).catch((error) => {
      console.error('❌ Error al cargar EditSalonComponent:', error);
      this.snackBar.open('Error al cargar el componente de edición', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    });
  }

  abrirModalEliminar(id: number, nombre: string) {
    if (!id || !nombre) {
      console.error('❌ Error: ID o nombre faltantes', { id, nombre });
      this.snackBar.open('Error: Datos incompletos para eliminar', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Caso especial para salones
    if (this.tipoSeleccionado.value === 'salones') {
      import('./eliminarSalones.component').then(({ EliminarSalonesComponent }) => {
        const dialogRef = this.dialog.open(EliminarSalonesComponent, {
          width: '450px',
          maxWidth: '95vw',
          panelClass: 'custom-dialog',
          data: {
            id,
            nombre,
            idColegio: this.colegiosId
          },
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.success) {
            this.snackBar.open('Salón eliminado correctamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadData();
          } else if (result?.error) {
            this.snackBar.open(result.error, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      });
      return;
    }

    // Para los demás tipos (niveles, secciones, grados)
    const dialogRef = this.dialog.open(EliminarComponent, {
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog',
      data: {
        tipo: this.tipoSeleccionado.value,
        id,
        nombre
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.snackBar.open(
          result.message || 'Elemento eliminado correctamente',
          'Cerrar',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.loadData();
      } else if (result?.error) {
        this.snackBar.open(result.error, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}