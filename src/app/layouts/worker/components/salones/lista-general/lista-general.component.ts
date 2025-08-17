import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../../services/UserData';
import { FuncionAgregarComponent } from '../funcion-agregar/funcion-agregar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

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
    MatIconModule,
    MatOptionModule,
  ],
  templateUrl: './lista-general.component.html',
  styleUrls: ['./lista-general.component.css'],
})
export class ListaGeneralComponent implements OnInit {
  tipoSeleccionado = new FormControl<'niveles' | 'secciones' | 'salones'>(
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
  tipoHorario: '' | 'entrada' | 'salida' = '';
  private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private dialog: MatDialog
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
    this.tipoSeleccionado.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.searchTerm = '';
      this.tipoHorario = '';
      this.loadData();
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;

    let url = '';
    switch (this.tipoSeleccionado.value) {
      case 'niveles':
        url = `${this.apiBase}/nivel/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'secciones':
        url = `${this.apiBase}/seccion/colegio/${this.colegiosId}?page=${this.currentPage}`;
        break;
      case 'salones':
        url = `${this.apiBase}/salon/colegio/${this.colegiosId}?page=${this.currentPage}&pagesize=${this.pageSize}`;
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
          this.data.length;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.setDisplayedColumns(this.tipoSeleccionado.value);
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.error = 'Error al cargar los datos. Intente de nuevo';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setDisplayedColumns(tipo: 'niveles' | 'secciones' | 'salones') {
    switch (tipo) {
      case 'niveles':
      case 'secciones':
        this.displayedColumns = ['id', 'nombre', 'actions'];
        break;
      case 'salones':
        this.displayedColumns = ['id', 'nombre', 'horario', 'tipo', 'actions'];
        break;
    }
  }

  applyFilters() {
    if (this.tipoSeleccionado.value === 'salones') {
      const term = (this.searchTerm || '').toLowerCase().trim();
      this.filteredData = this.data.filter((s) => {
        const matchesSearch =
          !term || (s.nombre || '').toLowerCase().includes(term);
        const matchesTipo = !this.tipoHorario || s.tipo === this.tipoHorario;
        return matchesSearch && matchesTipo;
      });
    } else {
      this.filteredData = [...this.data];
    }
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
        this.currentPage = 1; // Reiniciar a la primera página para ver el nuevo elemento
        this.loadData();
      }
    });
  }
}
