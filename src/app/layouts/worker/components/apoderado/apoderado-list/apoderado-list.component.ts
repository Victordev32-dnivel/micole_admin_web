import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar'; // Agregar para mensajes
import { UserData, UserService } from '../../../../../services/UserData'; // Importar el UserService
import { EditApoderadosComponent } from '../apoderado-list/edit-apoderados.component';
import { EliminarApoderadoComponent } from '../apoderado-list/eliminar.component';
import { AddApoderadosComponent } from '../add-apoderado/add-apoderado.component';

@Component({
  selector: 'app-apoderados',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './apoderado-list.component.html',
  styleUrls: ['./apoderado-list.component.css'],
})
export class ApoderadoListComponent implements OnInit {
  apoderados: any[] = [];
  filteredApoderados: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  searchTermControl = new FormControl('');
  colegioId: number | null = null; // Variable para almacenar el ID del colegio

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private userService: UserService, // Inyectar UserService
    private snackBar: MatSnackBar // Inyectar MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.setupSearch();
  }

  private loadUserData(): void {
    // Obtener datos del usuario al inicializar
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      this.loadApoderados(); // Cargar apoderados después de obtener el ID del colegio
    }

    // Suscribirse a cambios en los datos del usuario
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.loadApoderados();
      }
    });
  }

  private setupSearch(): void {
    this.searchTermControl.valueChanges.subscribe((term) => {
      this.filterApoderados(term || '');
    });
  }

  private getHeaders(): HttpHeaders {
    // Usar el JWT token del usuario en lugar del token hardcodeado
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  loadApoderados() {
    // Validar que tengamos el ID del colegio
    if (!this.colegioId) {
      console.error('ID del colegio no disponible');
      this.error = 'Error: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;

    // Usar el colegioId dinámico en lugar del hardcodeado
    const url = `https://proy-back-dnivel-44j5.onrender.com/api/apoderado/colegio/lista/${this.colegioId}`;
    
  

    this.http
      .get<any>(url, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (resp) => {
      
          this.ngZone.run(() => {
            this.apoderados = resp?.data || resp || [];
            this.filteredApoderados = [...this.apoderados];
            this.loading = false;
          
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('[Apoderados] Error al cargar:', error);
          this.ngZone.run(() => {
            let errorMessage = 'Error al cargar los apoderados. Intente de nuevo';
            
            if (error.status === 404) {
              errorMessage = 'No se encontraron apoderados para este colegio';
            } else if (error.status === 403) {
              errorMessage = 'No tiene permisos para acceder a esta información';
            } else if (error.status === 0) {
              errorMessage = 'Error de conexión. Verifique su internet';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            
            this.error = errorMessage;
            this.loading = false;
            
            this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar'],
              verticalPosition: 'top',
              horizontalPosition: 'center'
            });
            
            this.cdr.detectChanges();
          });
        },
      });
  }

  filterApoderados(term: string) {
    this.ngZone.run(() => {
      const search = term.toLowerCase().trim();
      if (!search) {
        this.filteredApoderados = [...this.apoderados];
        return;
      }
      this.filteredApoderados = this.apoderados.filter((a) => {
        const byNombre = a?.nombre?.toLowerCase().includes(search);
        const byApellidos = a?.apellidos?.toLowerCase().includes(search);
        const byDni = a?.dni?.toLowerCase?.()
          ? a.dni.toLowerCase().includes(search)
          : (a?.dni || '').includes(search);
        return !!(byNombre || byApellidos || byDni);
      });
      this.cdr.detectChanges();
    });
  }

  openAddDialog() {
    if (!this.colegioId) {
      this.snackBar.open('❌ Error: ID del colegio no disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(AddApoderadosComponent, {
      width: '25vw',
      maxWidth: '50vw',
      height: '30vw',
      panelClass: 'custom-dialog',
      data: { 
        isEditMode: false, 
        apoderado: null,
        colegioId: this.colegioId // Pasar el ID del colegio al modal
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('✅ Apoderado agregado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadApoderados();
      }
    });
  }

  openEditDialog(apoderado: any) {
    const dialogRef = this.dialog.open(EditApoderadosComponent, {
      width: '40vw', // Aumenté el ancho para el formulario de edición
      maxWidth: '600px',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      data: { 
        id: apoderado.id, 
        apoderados: this.apoderados,
        colegioId: this.colegioId // Pasar el ID del colegio al modal
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('✅ Apoderado actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadApoderados();
      }
    });
  }

  confirmDelete(apoderado: any) {
   
    
    // Determinar el ID del apoderado
    const apoderadoId = typeof apoderado === 'object' ? apoderado.id : apoderado;
    
    // Buscar la información completa del apoderado
    const apoderadoCompleto = this.apoderados.find(a => a.id === apoderadoId) || apoderado;
    
  
    
    const dialogRef = this.dialog.open(EliminarApoderadoComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      disableClose: false, // Permitir cerrar haciendo clic fuera
      data: { 
        id: apoderadoId,
        message: '¿Estás seguro de que deseas eliminar este apoderado?',
        apoderado: apoderadoCompleto, // Pasar la información completa
        colegioId: this.colegioId // Pasar el ID del colegio al modal
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
     
        // El modal ya maneja el mensaje de éxito
        this.loadApoderados();
      } else {
      
      }
    });
  }

  // Método auxiliar para obtener información de un apoderado por ID
  private getApoderadoById(id: number): any {
    return this.apoderados.find(a => a.id === id) || null;
  }

  // Método para refrescar la lista manualmente
  refreshApoderados(): void {
    this.loadApoderados();
  }


}