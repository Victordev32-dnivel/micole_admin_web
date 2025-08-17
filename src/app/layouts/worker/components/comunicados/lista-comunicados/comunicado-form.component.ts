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

// Interface para anuncio general
interface AnuncioGeneral {
  id: number;
  nombre: string;
  horario: string;
  imagen: string | null;
  idColegio: number;
}

// Interface para anuncio por salón
interface AnuncioSalon {
  id: number;
  nombre: string;
  horario: string;
  pdf: string;
  idSalon: number;
  idColegio: number;
  salon?: {
    id: number;
    nombre: string;
  };
}

// Interface unificada para mostrar en la tabla
interface ComunicadoDisplay {
  id: number;
  nombre: string;
  horario: string;
  pdf?: string;
  imagen?: string | null;
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
  ],
})
export class ComunicadosListadoComponent implements OnInit {
  comunicados: ComunicadoDisplay[] = [];
  loadingComunicados: boolean = true;
  colegioId: number | null = null;
  error: string | null = null;
  totalComunicados: number = 0;
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 20];
  tipoVista: 'general' | 'salon' = 'general'; // Tipo de vista actual

  // Columnas de la tabla (cambiarán según el tipo)
  displayedColumns: string[] = ['nombre', 'horario', 'acciones'];

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

  // Método para cambiar el tipo de vista
  cambiarTipoVista(tipo: 'general' | 'salon'): void {
    if (this.tipoVista !== tipo) {
      this.tipoVista = tipo;
      this.updateDisplayedColumns();
      this.loadComunicados();
    }
  }

  // Actualizar columnas según el tipo de vista
  private updateDisplayedColumns(): void {
    if (this.tipoVista === 'salon') {
      this.displayedColumns = ['nombre', 'horario', 'salon', 'acciones'];
    } else {
      this.displayedColumns = ['nombre', 'horario', 'acciones'];
    }
  }

  loadComunicados() {
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.loadingComunicados = false;
      return;
    }

    this.loadingComunicados = true;
    this.error = null;

    // Determinar qué endpoint usar según el tipo de vista
    let endpoint: string;
    if (this.tipoVista === 'general') {
      endpoint = `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general/colegio/${this.colegioId}`;
    } else {
      // Para anuncios por salón, usaremos el endpoint por salón
      // Necesitaremos obtener los salones primero y luego sus anuncios
      this.loadAnunciosSalon();
      return;
    }

    // Cargar anuncios generales
    this.http
      .get<AnuncioGeneral[]>(endpoint, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            console.log('Respuesta anuncios generales:', response);
            
            if (Array.isArray(response)) {
              this.comunicados = response.map((anuncio) => ({
                id: anuncio.id,
                nombre: anuncio.nombre,
                horario: anuncio.horario,
                imagen: anuncio.imagen,
                tipo: 'general' as const
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
  }

  // Método específico para cargar anuncios por salón
  private async loadAnunciosSalon(): Promise<void> {
    try {
      // Primero obtener los salones del colegio
      const salonesResponse = await this.http
        .get<any>(
          `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista/${this.colegioId}`,
          { headers: this.getHeaders() }
        )
        .toPromise();

      const salones = salonesResponse?.data || [];
      console.log('Salones obtenidos:', salones);

      if (salones.length === 0) {
        this.ngZone.run(() => {
          this.comunicados = [];
          this.totalComunicados = 0;
          this.loadingComunicados = false;
          this.cdr.detectChanges();
        });
        return;
      }

      // Obtener anuncios de todos los salones
      const promesasAnuncios = salones.map((salon: any) =>
        this.http
          .get<AnuncioSalon[]>(
            `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon/${salon.id}`,
            { headers: this.getHeaders() }
          )
          .toPromise()
          .then((anuncios) => ({
            salon: salon,
            anuncios: anuncios || []
          }))
          .catch((error) => {
            console.warn(`Error al cargar anuncios del salón ${salon.id}:`, error);
            return { salon: salon, anuncios: [] };
          })
      );

      const resultados = await Promise.all(promesasAnuncios);
      console.log('Resultados de anuncios por salón:', resultados);

      // Procesar todos los anuncios
      const todosLosAnuncios: ComunicadoDisplay[] = [];
      
      resultados.forEach(({ salon, anuncios }) => {
        anuncios.forEach((anuncio: AnuncioSalon) => {
          todosLosAnuncios.push({
            id: anuncio.id,
            nombre: anuncio.nombre,
            horario: anuncio.horario,
            pdf: anuncio.pdf,
            salon: {
              id: salon.id,
              nombre: salon.nombre
            },
            tipo: 'salon' as const
          });
        });
      });

      this.ngZone.run(() => {
        this.comunicados = todosLosAnuncios;
        this.totalComunicados = this.comunicados.length;
        this.loadingComunicados = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error al cargar anuncios por salón:', error);
      this.ngZone.run(() => {
        this.loadingComunicados = false;
        this.error = 'Error al cargar los anuncios por salón. Intente de nuevo';
        this.cdr.detectChanges();
      });
    }
  }


  onViewContent(url: string, tipo: 'pdf' | 'imagen'): void {
    if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
      this.snackBar.open(`❌ El ${tipo} no está disponible o no existe`, 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
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
        horizontalPosition: 'center'
      });
      return;
    }
    
    console.log(`Abriendo ${tipo}:`, url);
    
    // Intentar abrir el contenido y manejar errores
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      this.snackBar.open(`❌ No se pudo abrir el ${tipo}. Verifique su bloqueador de ventanas emergentes`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        verticalPosition: 'top',
        horizontalPosition: 'center'
      });
      return;
    }
    
    // Verificar si el contenido se carga correctamente
    setTimeout(() => {
      try {
        if (newWindow.closed) {
          this.snackBar.open(`⚠️ El ${tipo} podría no estar disponible`, 'Cerrar', {
            duration: 3000,
            panelClass: ['warning-snackbar']
          });
        }
      } catch (error) {
        // Error de acceso por CORS, pero esto es normal
        console.log(`${tipo} abierto correctamente`);
      }
    }, 2000);
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

    const tipoTexto = comunicado.tipo === 'general' ? 'anuncio general' : 'anuncio por salón';
    const confirmacion = confirm(`¿Está seguro de eliminar el ${tipoTexto} "${comunicado.nombre}"?\n\nEsta acción no se puede deshacer.`);
    
    if (confirmacion) {
      this.deleteComunicado(comunicado);
    }
  }

  private deleteComunicado(comunicado: ComunicadoDisplay): void {
    const endpoint = comunicado.tipo === 'general' 
      ? `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general/${comunicado.id}`
      : `https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon/${comunicado.id}`;

    this.http
      .delete(endpoint, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          console.log('Comunicado eliminado exitosamente:', response);
          const tipoTexto = comunicado.tipo === 'general' ? 'Anuncio general' : 'Anuncio por salón';
          this.snackBar.open(`✅ ${tipoTexto} eliminado correctamente`, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            verticalPosition: 'top',
            horizontalPosition: 'center'
          });
          this.loadComunicados(); // Recargar la lista
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
            horizontalPosition: 'center'
          });
        },
      });
  }

  toggleMenu() {
    console.log('Toggle menu clicked');
  }

}

