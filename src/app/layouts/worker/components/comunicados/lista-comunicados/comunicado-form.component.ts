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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { UserData, UserService } from '../../../../../services/UserData';
import { EliminarComunicadoComponent } from './eliminar-comunicado.component';

// IMPORTACIONES DE LOS MODALES
import { ModalAnuncioGeneralComponent } from './add-comunicato.form.component';
import { ModalAnuncioSalonComponent } from './add-comunicadoSalon.form.component';
import { EditarComunicadoComponent } from './edit.comunicado.component';

// Interface para anuncio general - DEBE coincidir con la respuesta de la API
interface AnuncioGeneral {
  id: number;
  titulo: string; // ¡IMPORTANTE! En la API es 'titulo', no 'nombre'
  horario: string;
  imagen: string | null;
  url: string;
}

// Interface para anuncio por salón
interface AnuncioSalon {
  id: number;
  titulo: string; // Cambiado de 'nombre' a 'titulo'
  fecha: string; // Cambiado de 'horario' a 'fecha'
  pdf: string;
  idSalon: number;
  idColegio: number;
  salon?: {
    id: number;
    nombre: string;
  };
}

// Interface para salones
interface Salon {
  id: number;
  nombre: string;
}

// Interface unificada para mostrar en la tabla
interface ComunicadoDisplay {
  id: number;
  nombre: string; // Este es para uso interno en la tabla
  horario: string;
  pdf?: string;
  imagen?: string | null;
  url?: string; // Para anuncios generales
  salon?: {
    id: number;
    nombre: string;
  };
  tipo: 'general' | 'salon';
}

@Component({
  selector: 'app-comunicados-listado',
  templateUrl: './comunicado-form.component.html',
  styleUrls: ['./comunicado-form.component.css'],
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
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    EliminarComunicadoComponent,
  ],
})
export class ComunicadosListadoComponent implements OnInit {
  comunicados: ComunicadoDisplay[] = [];
  salones: Salon[] = [];
  loadingComunicados: boolean = true;
  loadingSalones: boolean = false;
  colegioId: number | null = null;
  salonSeleccionado: number | null = null;
  error: string | null = null;
  totalComunicados: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 20];
  tipoVista: 'general' | 'salon' = 'general';

  // Columnas de la tabla - INICIALIZADO CORRECTAMENTE PARA VISTA GENERAL
  displayedColumns: string[] = ['nombre', 'horario', 'url', 'acciones'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    // CONFIGURAR COLUMNAS INICIALES ANTES DE CARGAR DATOS
    this.updateDisplayedColumns();
    this.loadUserData();
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      // CARGAR COMUNICADOS INMEDIATAMENTE DESPUÉS DE OBTENER EL COLEGIO ID
      this.loadComunicados();
    }
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.loadComunicados();
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

  editComunicado(comunicado: ComunicadoDisplay): void {
    if (!comunicado.id) {
      this.snackBar.open(
        '❌ No se puede editar: ID de comunicado no disponible',
        'Cerrar',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    const dialogData = {
      comunicado: {
        id: comunicado.id,
        nombre: comunicado.nombre,
        horario: comunicado.horario,
        tipo: comunicado.tipo,
        imagen: comunicado.imagen,
        url: comunicado.url,
        pdf: comunicado.pdf,
        salon: comunicado.salon,
      },
      colegioId: this.colegioId!,
      salones: comunicado.tipo === 'salon' ? this.salones : undefined,
    };



    const dialogRef = this.dialog.open(EditarComunicadoComponent, {
      width: '650px',
      maxHeight: '90vh',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        const tipoTexto =
          comunicado.tipo === 'general'
            ? 'Anuncio general'
            : 'Anuncio por salón';
        this.snackBar.open(
          `✅ ${tipoTexto} actualizado correctamente`,
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          }
        );

        if (this.tipoVista === 'general') {
          this.loadComunicados();
        } else if (this.salonSeleccionado) {
          this.loadAnunciosSalonSeleccionado();
        }
      }
    });
  }

  agregarComunicado(): void {
    let dialogRef;

    if (this.tipoVista === 'general') {
      dialogRef = this.dialog.open(ModalAnuncioGeneralComponent, {
        width: '600px',
        maxHeight: '90vh',
        disableClose: true,
        data: {
          colegioId: this.colegioId,
        },
      });
    } else if (this.tipoVista === 'salon') {
      dialogRef = this.dialog.open(ModalAnuncioSalonComponent, {
        width: '600px',
        maxHeight: '90vh',
        disableClose: true,
        data: {
          colegioId: this.colegioId,
        },
      });
    }

    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          const tipoTexto =
            this.tipoVista === 'general'
              ? 'Anuncio general'
              : 'Anuncio por salón';
          this.snackBar.open(`✅ ${tipoTexto} creado exitosamente`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });

          if (this.tipoVista === 'general') {
            this.loadComunicados();
          } else if (this.salonSeleccionado) {
            this.loadAnunciosSalonSeleccionado();
          }
        }
      });
    }
  }

  // Método para cambiar el tipo de vista - MEJORADO
  cambiarTipoVista(tipo: 'general' | 'salon'): void {
    if (this.tipoVista !== tipo) {
      this.tipoVista = tipo;
      this.updateDisplayedColumns();
      this.comunicados = []; // LIMPIAR DATOS ANTERIORES
      this.totalComunicados = 0;

      if (tipo === 'salon') {
        this.loadSalones();
        this.salonSeleccionado = null; // Limpiar selección
      } else {
        this.salonSeleccionado = null;
        this.loadComunicados(); // CARGAR ANUNCIOS GENERALES INMEDIATAMENTE
      }
    }
  }

  // Actualizar columnas según el tipo de vista - MEJORADO
  private updateDisplayedColumns(): void {
    if (this.tipoVista === 'salon') {
      this.displayedColumns = ['nombre', 'horario', 'salon', 'acciones'];
    } else {
      this.displayedColumns = ['nombre', 'horario', 'url', 'acciones'];
    }

  }

  private loadSalones(): void {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible para cargar salones');
      return;
    }

    this.loadingSalones = true;

    this.http
      .get<{ data: Salon[] }>(
        `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista/${this.colegioId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {

            this.salones = response.data || [];
            this.loadingSalones = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.loadingSalones = false;
          this.snackBar.open(
            '❌ Error al cargar la lista de salones',
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
          this.cdr.detectChanges();
        },
      });
  }

  onSalonSeleccionado(salonId: number): void {

    this.salonSeleccionado = salonId;
    this.loadAnunciosSalonSeleccionado();
  }

  // MÉTODO loadComunicados MEJORADO - SOLUCIONA EL PROBLEMA PRINCIPAL
  loadComunicados() {


    if (!this.colegioId) {
      console.error('❌ ID del colegio no disponible');
      this.loadingComunicados = false;
      this.error = 'Error: ID del colegio no disponible';
      return;
    }

    this.loadingComunicados = true;
    this.error = null;

    // SOLO CARGAR ANUNCIOS GENERALES CUANDO ESTAMOS EN VISTA GENERAL
    if (this.tipoVista === 'general') {
      const endpoint = `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general/colegio/${this.colegioId}`;



      this.http
        .get<AnuncioGeneral[]>(endpoint, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.ngZone.run(() => {


              if (Array.isArray(response)) {
                this.comunicados = response.map((anuncio: AnuncioGeneral) => {
                  const comunicado = {
                    id: anuncio.id,
                    nombre: anuncio.titulo, // MAPEO: titulo -> nombre
                    horario: anuncio.horario,
                    imagen: anuncio.imagen,
                    url: anuncio.url,
                    tipo: 'general' as const,
                  };

                  return comunicado;
                });


              } else {
                console.warn('⚠️ La respuesta no es un array:', response);
                this.comunicados = [];
              }

              this.totalComunicados = this.comunicados.length;
              this.loadingComunicados = false;



              this.cdr.detectChanges();
            });
          },
          error: (error) => {
            console.error('❌ Error al cargar anuncios generales:', error);
            this.ngZone.run(() => {
              this.loadingComunicados = false;
              this.error = 'Error al cargar los comunicados. Intente de nuevo';

              // MOSTRAR MENSAJE DE ERROR MÁS DETALLADO
              let errorMsg = 'Error desconocido';
              if (error.status === 404) {
                errorMsg = 'No se encontraron anuncios generales';
                this.comunicados = []; // Limpiar en lugar de mostrar error
                this.error = null;
              } else if (error.status === 401) {
                errorMsg = 'Error de autorización';
              } else if (error.status === 0) {
                errorMsg = 'Error de conexión con el servidor';
              }

              if (this.error) {
                this.snackBar.open(`❌ ${errorMsg}`, 'Cerrar', {
                  duration: 5000,
                  panelClass: ['error-snackbar'],
                });
              }

              this.cdr.detectChanges();
            });
          },
        });
    } else {
      // Para vista por salón, limpiar y esperar selección
      this.loadingComunicados = false;
      this.comunicados = [];
      this.totalComunicados = 0;

    }
  }

  private loadAnunciosSalonSeleccionado(): void {
    if (!this.salonSeleccionado) {
      this.comunicados = [];
      this.totalComunicados = 0;
      return;
    }

    this.loadingComunicados = true;
    this.error = null;

    const endpoint = `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon/${this.salonSeleccionado}`;

    this.http
      .get<AnuncioSalon[]>(endpoint, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {


            const salonInfo = this.salones.find(
              (s) => s.id === this.salonSeleccionado
            );

            if (Array.isArray(response)) {
              this.comunicados = response.map((anuncio: AnuncioSalon) => ({
                id: anuncio.id,
                nombre: anuncio.titulo, // MAPEO: titulo -> nombre
                horario: anuncio.fecha, // MAPEO: fecha -> horario
                pdf: anuncio.pdf,
                salon: salonInfo
                  ? {
                    id: salonInfo.id,
                    nombre: salonInfo.nombre,
                  }
                  : undefined,
                tipo: 'salon' as const,
              }));
            } else {
              console.warn('La respuesta no es un array:', response);
              this.comunicados = [];
            }

            this.totalComunicados = this.comunicados.length;
            this.loadingComunicados = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar anuncios del salón:', error);
          this.ngZone.run(() => {
            this.loadingComunicados = false;

            if (error.status === 404) {
              this.comunicados = [];
              this.totalComunicados = 0;
              this.error = null;

              this.snackBar.open(
                'ℹ️ Este salón no tiene anuncios disponibles',
                'Cerrar',
                {
                  duration: 3000,
                  panelClass: ['info-snackbar'],
                }
              );
            } else {
              this.error = 'Error al cargar los anuncios del salón. Intente de nuevo';
            }

            this.cdr.detectChanges();
          });
        },
      });
  }

  onViewContent(url: string, tipo: 'pdf' | 'imagen'): void {
    if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
      this.snackBar.open(
        `❌ El ${tipo} no está disponible o no existe`,
        'Cerrar',
        {
          duration: 4000,
          panelClass: ['error-snackbar'],
          verticalPosition: 'top',
          horizontalPosition: 'center',
        }
      );
      return;
    }

    try {
      new URL(url);
    } catch (error) {
      this.snackBar.open(`❌ La URL del ${tipo} no es válida`, 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }



    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      this.snackBar.open(
        `❌ No se pudo abrir el ${tipo}. Verifique su bloqueador de ventanas emergentes`,
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

    setTimeout(() => {
      try {
        if (newWindow.closed) {
          this.snackBar.open(
            `⚠️ El ${tipo} podría no estar disponible`,
            'Cerrar',
            {
              duration: 3000,
              panelClass: ['warning-snackbar'],
            }
          );
        }
      } catch (error) {

      }
    }, 2000);
  }

  openUrl(url: string): void {
    if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
      this.snackBar.open('❌ El enlace no está disponible', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }

    try {
      new URL(url);
    } catch (error) {
      this.snackBar.open('❌ La URL no es válida', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
      return;
    }



    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      this.snackBar.open(
        '❌ No se pudo abrir el enlace. Verifique su bloqueador de ventanas emergentes',
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

    this.snackBar.open('✅ Enlace abierto en nueva pestaña', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  confirmDelete(comunicado: ComunicadoDisplay): void {
    if (!comunicado.id) {
      this.snackBar.open(
        '❌ No se puede eliminar: ID de comunicado no disponible',
        'Cerrar',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    const dialogRef = this.dialog.open(EliminarComunicadoComponent, {
      width: '500px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        comunicado: {
          id: comunicado.id,
          nombre: comunicado.nombre,
          tipo: comunicado.tipo,
        },
        endpoint: `https://proy-back-dnivel-44j5.onrender.com/${comunicado.id}`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        const tipoTexto =
          comunicado.tipo === 'general'
            ? 'Anuncio general'
            : 'Anuncio por salón';
        this.snackBar.open(
          `✅ ${tipoTexto} eliminado correctamente`,
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          }
        );

        if (this.tipoVista === 'general') {
          this.loadComunicados();
        } else if (this.salonSeleccionado) {
          this.loadAnunciosSalonSeleccionado();
        }
      }
    });
  }

  private deleteComunicado(comunicado: ComunicadoDisplay): void {
    const endpoint =
      comunicado.tipo === 'general'
        ? `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general/${comunicado.id}`
        : `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon/${comunicado.id}`;

    this.http.delete(endpoint, { headers: this.getHeaders() }).subscribe({
      next: (response) => {

        const tipoTexto =
          comunicado.tipo === 'general'
            ? 'Anuncio general'
            : 'Anuncio por salón';
        this.snackBar.open(
          `✅ ${tipoTexto} eliminado correctamente`,
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center',
          }
        );

        if (this.tipoVista === 'general') {
          this.loadComunicados();
        } else if (this.salonSeleccionado) {
          this.loadAnunciosSalonSeleccionado();
        }
      },
      error: (error) => {
        console.error('Error al eliminar comunicado:', error);
        let errorMessage = 'Error al eliminar el comunicado';

        if (error.status === 404) {
          errorMessage = 'El comunicado no fue encontrado';
        } else if (error.status === 403) {
          errorMessage = 'No tiene permisos para eliminar este comunicado';
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

  toggleMenu() {

  }
}