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
import { MatTooltipModule } from '@angular/material/tooltip'; // Add this import
import { CommonModule } from '@angular/common';
import { UserData, UserService } from '../../../../../services/UserData';
import { EliminarComunicadoComponent } from './eliminar-comunicado.component';

// IMPORTACIONES DE LOS MODALES
import { ModalAnuncioGeneralComponent } from './add-comunicato.form.component';
import { ModalAnuncioSalonComponent } from './add-comunicadoSalon.form.component';

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
    EliminarComunicadoComponent, // Add this to imports array
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

  // Columnas de la tabla (cambiarán según el tipo)
  displayedColumns: string[] = [
    'titulo',
    'fecha',
    'horario',
    'salon',
    'acciones',
  ];

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
    this.loadComunicados();
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
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

  // MÉTODO PARA AGREGAR COMUNICADO SEGÚN EL TIPO DE VISTA
  agregarComunicado(): void {
    let dialogRef;

    if (this.tipoVista === 'general') {
      // Abrir modal para anuncios generales
      dialogRef = this.dialog.open(ModalAnuncioGeneralComponent, {
        width: '600px',
        maxHeight: '90vh',
        disableClose: true,
        data: {
          colegioId: this.colegioId,
        },
      });
    } else if (this.tipoVista === 'salon') {
      // Abrir modal para anuncios por salón
      dialogRef = this.dialog.open(ModalAnuncioSalonComponent, {
        width: '600px',
        maxHeight: '90vh',
        disableClose: true,
        data: {
          colegioId: this.colegioId,
        },
      });
    }

    // Manejar el resultado del modal
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.success) {
          // Mostrar mensaje de éxito
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

          // Recargar la lista según el tipo
          if (this.tipoVista === 'general') {
            this.loadComunicados();
          } else if (this.salonSeleccionado) {
            this.loadAnunciosSalonSeleccionado();
          }
        }
      });
    }
  }

  // Método para cambiar el tipo de vista
  cambiarTipoVista(tipo: 'general' | 'salon'): void {
    if (this.tipoVista !== tipo) {
      this.tipoVista = tipo;
      this.updateDisplayedColumns();

      if (tipo === 'salon') {
        this.loadSalones(); // Cargar la lista de salones cuando se selecciona vista por salón
      } else {
        this.salonSeleccionado = null; // Limpiar selección de salón
        this.loadComunicados();
      }
    }
  }

  // Actualizar columnas según el tipo de vista
  private updateDisplayedColumns(): void {
    if (this.tipoVista === 'salon') {
      this.displayedColumns = ['nombre', 'horario', 'salon', 'acciones'];
    } else {
      this.displayedColumns = ['nombre', 'horario', 'url', 'acciones'];
    }
  }

  // Cargar lista de salones para selección
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
            console.log('Salones cargados:', response);
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

  // Método llamado cuando el usuario selecciona un salón
  onSalonSeleccionado(salonId: number): void {
    console.log('Salón seleccionado:', salonId);
    this.salonSeleccionado = salonId;
    this.loadAnunciosSalonSeleccionado();
  }

  loadComunicados() {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.loadingComunicados = false;
      return;
    }

    this.loadingComunicados = true;
    this.error = null;

    // Solo cargar anuncios generales si estamos en vista general
    if (this.tipoVista === 'general') {
      const endpoint = `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general/colegio/${this.colegioId}`;

      this.http
        .get<AnuncioGeneral[]>(endpoint, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.ngZone.run(() => {
              console.log('Respuesta anuncios generales:', response);

              if (Array.isArray(response)) {
                this.comunicados = response.map((anuncio: AnuncioGeneral) => ({
                  id: anuncio.id,
                  nombre: anuncio.titulo, // ¡MAPEO CORRECTO! titulo -> nombre
                  horario: anuncio.horario,
                  imagen: anuncio.imagen,
                  url: anuncio.url,
                  tipo: 'general' as const,
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
            console.error('Error al cargar anuncios generales:', error);
            this.loadingComunicados = false;
            this.error = 'Error al cargar los comunicados. Intente de nuevo';
            this.cdr.detectChanges();
          },
        });
    } else {
      // Para vista por salón, solo mostrar mensaje si no hay salón seleccionado
      this.loadingComunicados = false;
      if (!this.salonSeleccionado) {
        this.comunicados = [];
        this.totalComunicados = 0;
      }
    }
  }

  // Método específico para cargar anuncios del salón seleccionado
  // Método específico para cargar anuncios del salón seleccionado - CORREGIDO
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
            console.log('Anuncios del salón seleccionado:', response);

            // Buscar el nombre del salón seleccionado
            const salonInfo = this.salones.find(
              (s) => s.id === this.salonSeleccionado
            );

            if (Array.isArray(response)) {
              this.comunicados = response.map((anuncio: AnuncioSalon) => ({
                id: anuncio.id,
                nombre: anuncio.titulo, // ✅ MAPEO CORRECTO: titulo -> nombre
                horario: anuncio.fecha, // ✅ MAPEO CORRECTO: fecha -> horario
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
            this.error =
              'Error al cargar los anuncios del salón. Intente de nuevo';

            // Si es error 404, mostrar mensaje más amigable
            if (error.status === 404) {
              this.comunicados = [];
              this.totalComunicados = 0;
              this.error = null; // No mostrar como error, simplemente no hay anuncios

              this.snackBar.open(
                'ℹ️ Este salón no tiene anuncios disponibles',
                'Cerrar',
                {
                  duration: 3000,
                  panelClass: ['info-snackbar'],
                }
              );
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

    // Validar si la URL es válida
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

    console.log(`Abriendo ${tipo}:`, url);

    // Intentar abrir el contenido y manejar errores
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

    // Verificar si el contenido se carga correctamente
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
        // Error de acceso por CORS, pero esto es normal
        console.log(`${tipo} abierto correctamente`);
      }
    }, 2000);
  }

  
  // Método específico para abrir URLs de anuncios generales
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

    // Validar si la URL es válida
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

    console.log('Abriendo URL:', url);

    // Abrir el enlace en una nueva pestaña
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

    // Mostrar mensaje de confirmación
    this.snackBar.open('✅ Enlace abierto en nueva pestaña', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
    });
  }

  editComunicado(comunicado: ComunicadoDisplay): void {
    // Aquí puedes abrir un modal de edición específico para cada tipo
    console.log('Editando comunicado:', comunicado);
    this.snackBar.open('Funcionalidad de edición en desarrollo', 'Cerrar', {
      duration: 3000,
    });
  }

  confirmDelete(comunicado: ComunicadoDisplay): void {
  if (!comunicado.id) {
    this.snackBar.open('❌ No se puede eliminar: ID de comunicado no disponible', 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    return;
  }

  // Abrir el modal de eliminación usando la nueva API
  const dialogRef = this.dialog.open(EliminarComunicadoComponent, {
    width: '500px',
    maxHeight: '90vh',
    disableClose: true,
    data: {
      comunicado: {
        id: comunicado.id,
        nombre: comunicado.nombre,
        tipo: comunicado.tipo
      },
      endpoint: `https://proy-back-dnivel-44j5.onrender.com/${comunicado.id}` // ✅ Nueva API
    }
  });

  // Manejar el resultado del modal
  dialogRef.afterClosed().subscribe(result => {
    if (result && result.success) {
      const tipoTexto = comunicado.tipo === 'general' ? 'Anuncio general' : 'Anuncio por salón';
      this.snackBar.open(`✅ ${tipoTexto} eliminado correctamente`, 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      
      // Recargar según el tipo de vista
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
        console.log('Comunicado eliminado exitosamente:', response);
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

        // Recargar según el tipo de vista
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
    console.log('Toggle menu clicked');
  }
}
