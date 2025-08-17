import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-lista-general',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './lista-general.component.html',
  styleUrls: ['./lista-general.component.css'],
})
export class ListaGeneralComponent implements OnInit {
  tipoSeleccionado = new FormControl('niveles');
  colegiosId: number = 0;
  data: any[] = [];
  filteredData: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  displayedColumns: string[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  pageSize: number = 10;
  totalResults: number = 0;
  pages: number[] = [];

  // 🔹 Filtros adicionales para "salones"
  searchTerm: string = '';
  tipoHorario: string = 'entrada'; // entrada | salida

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) {}

  ngOnInit() {
    const userData = this.userService.getUserData();
    this.colegiosId = userData?.colegio || 0;

    if (!this.colegiosId) {
      this.error = 'No se encontró el ID del colegio';
      this.cdr.detectChanges();
      return;
    }

    this.loadData();

    // Cuando cambia el tipo de vista (niveles, secciones, salones)
    this.tipoSeleccionado.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.searchTerm = '';
      this.tipoHorario = 'entrada';
      this.loadData();
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.userService.getJwtToken()}`,
      'Content-Type': 'application/json',
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;
    let url = '';

    switch (this.tipoSeleccionado.value) {
      case 'niveles':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/nivel/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'secciones':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/seccion/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'salones':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/${this.colegiosId}?page=${this.currentPage}&pagesize=${this.pageSize}`;
        break;
      default:
        break;
    }

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.data = response.data || [];
        this.filteredData = [...this.data];
        this.totalPages = response.totalPages || 1;
        this.totalResults =
          response.totalNiveles ||
          response.totalSecciones ||
          response.totalSalones ||
          0;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.setDisplayedColumns(this.tipoSeleccionado.value);
        this.applyFilters(); // 🔹 aplicar filtros en carga
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos:', error);
        this.error = 'Error al cargar los datos. Intente de nuevo';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setDisplayedColumns(tipo: string | null) {
    switch (tipo) {
      case 'niveles':
        this.displayedColumns = ['id', 'nombre', 'actions'];
        break;
      case 'secciones':
        this.displayedColumns = ['id', 'nombre', 'actions'];
        break;
      case 'salones':
        this.displayedColumns = ['id', 'nombre', 'horario', 'tipo', 'actions'];
        break;
      default:
        this.displayedColumns = [];
    }
  }

  // 🔹 Filtrar resultados (solo aplica para "salones")
  applyFilters() {
    if (this.tipoSeleccionado.value === 'salones') {
      this.filteredData = this.data.filter((salon) => {
        const matchesSearch =
          !this.searchTerm ||
          salon.nombre.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesTipo =
          !this.tipoHorario || salon.tipo === this.tipoHorario;
        return matchesSearch && matchesTipo;
      });
    } else {
      this.filteredData = [...this.data];
    }
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData();
  }
}
