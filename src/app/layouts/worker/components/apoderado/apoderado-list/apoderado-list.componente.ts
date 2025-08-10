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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import { Router } from '@angular/router';
import { UserService } from '../../../../../services/UserData';
import { GuardianModalComponent, GuardianModalData } from '../add-apoderado/guardian-modal.component';

// Interfaces
interface Guardian {
  id: number;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombre: string; // Campo calculado para mostrar nombre completo
  telefono: string;
  parentesco: string;
  genero: string;
  tipoUsuario?: string;
  contrasena?: string;
  idColegio?: number;
}

interface GuardianApiResponse {
  data: Guardian[];
  totalPages: number;
  totalApoderados: number;
}

interface GuardianCreateRequest {
  numeroDocumento: string;
  tipoUsuario: string;
  contrasena: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  genero: string;
  telefono: string;
  parentesco: string;
  idColegio: number;
}

@Component({
  selector: 'app-guardian-list',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  templateUrl: 'guardian-list.component.html',
  styleUrls: ['guardian-list.component.css'],
})
export class GuardianListComponent implements OnInit {
  searchForm: FormGroup;
  searchTermControl: FormControl = new FormControl('');
  guardians: Guardian[] = [];
  filteredGuardians: Guardian[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  totalApoderados: number = 0;
  pageSize: number = 30;
  loading: boolean = true;
  userName: string = '';
  userType: string = '';
  colegioId: number = 0;

  // Variables para paginación responsiva
  isMobile: boolean = false;
  visiblePages: number[] = [];
  maxVisiblePages: number = 5;

  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/apoderado';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar,
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
      this.loadGuardians();
      this.searchTermControl.valueChanges.subscribe((term) => {
        this.filterGuardians(term);
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

loadGuardians(page: number = 1) {
  if (!this.colegioId) {
    console.error('ID del colegio no disponible');
    this.loading = false;
    return;
  }

  this.loading = true;
  const headers = this.getHeaders();

  console.log(
    `Cargando página: ${page}, pageSize: ${this.pageSize}, colegioId: ${this.colegioId}`
  );

  // Usar la API de lista de apoderados por colegio
  this.http
    .get<any>(
      `${this.apiUrl}/colegio/lista/${this.colegioId}?page=${page}&limit=${this.pageSize}`,
      { headers }
    )
    .subscribe({
      next: (response) => {
        console.log('Respuesta de la API de apoderados:', response);
        console.log(
          'Número de apoderados recibidos:',
          response.data?.length || 0
        );

        this.ngZone.run(() => {
          // Procesar los datos para asegurar que tengan nombre completo
          let guardians = (response.data || []).map((guardian: any) => ({
            ...guardian,
            // Asegurar que existe el campo nombre completo
            nombre: guardian.nombre || this.buildFullName(guardian),
          }));

          // Invertir el orden del array para mostrar los últimos primero
          guardians = guardians.reverse();

          this.guardians = guardians;
          this.filteredGuardians = [...this.guardians];
          this.currentPage = page;

          // Calcular total de páginas
          this.totalApoderados = response.totalApoderados || guardians.length;
          this.totalPages =
            response.totalPages ||
            Math.ceil(this.totalApoderados / this.pageSize);

          // Asegurar que totalPages sea al menos 1
          if (this.totalPages < 1) {
            this.totalPages = 1;
          }

          this.updateVisiblePages();

          console.log(
            `Página actual: ${page}, Total páginas: ${this.totalPages}, Total apoderados: ${this.totalApoderados}`
          );
          console.log('Apoderados mostrados:', this.filteredGuardians.length);

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar apoderados:', error);
        this.ngZone.run(() => {
          this.loading = false;
          this.showSnackBar('Error al cargar apoderados', 'error');
          this.cdr.detectChanges();
        });
      },
    });
}

  private buildFullName(guardian: any): string {
    const nombres = guardian.nombres || '';
    const apellidoPaterno = guardian.apellidoPaterno || '';
    const apellidoMaterno = guardian.apellidoMaterno || '';

    return [nombres, apellidoPaterno, apellidoMaterno]
      .filter((part) => part && part.trim())
      .join(' ');
  }

  filterGuardians(term: string) {
    this.ngZone.run(() => {
      this.loading = true;
      setTimeout(() => {
        if (!term || term.trim() === '') {
          this.filteredGuardians = [...this.guardians];
        } else {
          const searchTerm = term.toLowerCase().trim();
          this.filteredGuardians = this.guardians.filter((guardian) => {
            // Buscar por nombre completo
            const matchesName = guardian.nombre
              ?.toLowerCase()
              .includes(searchTerm);
            // Buscar por DNI/número de documento
            const matchesDNI = guardian.numeroDocumento
              ?.toString()
              .toLowerCase()
              .includes(searchTerm);

            return matchesName || matchesDNI;
          });
        }
        console.log(
          `Apoderados filtrados: ${this.filteredGuardians.length} de ${this.guardians.length} total`
        );
        console.log('Término de búsqueda:', term);
        this.loading = false;
        this.cdr.detectChanges();
      }, 100);
    });
  }

  // Métodos del Modal
  openAddGuardianModal(): void {
    const dialogRef = this.dialog.open(GuardianModalComponent, {
      width: this.isMobile ? '95vw' : '800px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'guardian-modal-panel',
      disableClose: false,
      data: {
        guardian: null,
        isEditMode: false,
        colegioId: this.colegioId
      } as GuardianModalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        this.saveGuardian(result.data, false);
      }
    });
  }

  openEditGuardianModal(guardian: Guardian): void {
  const dialogRef = this.dialog.open(GuardianModalComponent, {
    width: this.isMobile ? '95vw' : '800px',
    maxWidth: '95vw',
    maxHeight: '95vh',
    panelClass: 'guardian-modal-panel',
    disableClose: false,
    data: {
      guardian: {
        ...guardian, // Pasar todos los datos del apoderado
        tipoUsuario: guardian.tipoUsuario || 'APODERADO', // Valor por defecto si no existe
        contrasena: '', // No mostrar la contraseña actual por seguridad
        idColegio: this.colegioId
      },
      isEditMode: true,
      colegioId: this.colegioId
    } as GuardianModalData
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result && result.action === 'save') {
      this.saveGuardian(result.data, true, guardian.id); // Pasar el ID del apoderado
    }
  });
}
  private saveGuardian(guardianData: GuardianCreateRequest, isEditMode: boolean, guardianId?: number): void {
    this.loading = true;
    const headers = this.getHeaders();

    if (isEditMode && guardianId) {
      // Actualizar apoderado existente
      this.http.put(`${this.apiUrl}/${guardianId}`, guardianData, { headers })
        .subscribe({
          next: (response) => {
            console.log('Apoderado actualizado exitosamente:', response);
            this.showSnackBar('Apoderado actualizado exitosamente', 'success');
            this.loadGuardians(this.currentPage);
          },
          error: (error) => {
            console.error('Error al actualizar apoderado:', error);
            this.showSnackBar(
              error.error?.message || 'Error al actualizar apoderado', 
              'error'
            );
            this.loading = false;
          }
        });
    } else {
      // Crear nuevo apoderado
      this.http.post(this.apiUrl, guardianData, { headers })
        .subscribe({
          next: (response) => {
            console.log('Apoderado creado exitosamente:', response);
            this.showSnackBar('Apoderado agregado exitosamente', 'success');
            this.loadGuardians(this.currentPage);
          },
          error: (error) => {
            console.error('Error al crear apoderado:', error);
            this.showSnackBar(
              error.error?.message || 'Error al agregar apoderado', 
              'error'
            );
            this.loading = false;
          }
        });
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log(`Cambiando a página: ${page}`);
      this.loadGuardians(page);
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
    return (
      this.visiblePages.length > 0 &&
      this.visiblePages[this.visiblePages.length - 1] < this.totalPages
    );
  }

  logout() {
    this.userService.clearUserData();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}