import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../../../services/UserData';
import { TipoAsistenciaService, TipoAsistencia } from '../../../../../services/tipo-asistencia.service';

@Component({
  selector: 'app-funcion-agregar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './funcion-agregar.component.html',
  styleUrls: ['./funcion-agregar.component.css'],
})
export class FuncionAgregarComponent implements OnInit {
  addForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  tipo: string;
  idColegio: number;
  isSubmitting = false;
  grados: { id: number; nombre: string }[] = [];
  secciones: { id: number; nombre: string }[] = [];

  niveles: { id: number; nombre: string }[] = [];
  tiposAsistencia: TipoAsistencia[] = [];
  private apiBase = '/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private tipoAsistenciaService: TipoAsistenciaService,
    public dialogRef: MatDialogRef<FuncionAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo: string; idColegio: number }
  ) {
    this.tipo = data.tipo;
    this.idColegio = data.idColegio;
    this.addForm = this.createForm(this.tipo);
  }

  ngOnInit() {
    if (this.tipo === 'salones') {
      this.loadGrados();
      this.loadSecciones();
      this.loadNiveles();
      this.loadTiposAsistencia();
    }
  }

  private createForm(tipo: string): FormGroup {
    switch (tipo) {
      case 'grados':
        return this.fb.group({
          nombre: ['', [Validators.required, Validators.maxLength(100)]],
          idColegio: [this.idColegio, Validators.required]
        });
      case 'niveles':
      case 'secciones':
        return this.fb.group({
          nombre: ['', Validators.required],
          idColegio: [this.idColegio],
        });
      case 'salones':
        return this.fb.group({
          nombre: [''], // Optional based on User feedback, but keeping as form control
          horaInicio: ['', Validators.required],
          horaFin: ['', Validators.required],
          tipo: [0, [Validators.required, Validators.min(1)]], // Changed to number for ID
          idGrado: [0, [Validators.required, Validators.min(1)]],
          idSeccion: [0, [Validators.required, Validators.min(1)]],
          idNivel: [0, [Validators.required, Validators.min(1)]],
          idColegio: [this.idColegio],
        });
      default:
        return this.fb.group({});
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.userService.getJwtToken()}`,
      'Content-Type': 'application/json',
    });
  }

  private loadGrados() {
    this.http
      .get<any>(
        `${this.apiBase}/grado/colegio/${this.idColegio}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.grados = response.data || [];
        },
        error: (err) => {
          console.error('Error al cargar grados:', err);
          this.grados = [];
        },
      });
  }

  private loadSecciones() {
    this.http
      .get<any>(
        `${this.apiBase}/seccion/colegio/${this.idColegio}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.secciones = response.data || [];
        },
        error: (err) => {
          console.error('Error al cargar secciones:', err);
          this.secciones = [];
        },
      });
  }

  private loadNiveles() {
    this.http
      .get<any>(
        `${this.apiBase}/nivel/colegio/${this.idColegio}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.niveles = response.data || [];
        },
        error: (err) => {
          console.error('Error al cargar niveles:', err);
          this.niveles = [];
        },
      });
  }

  private loadTiposAsistencia() {
    this.tipoAsistenciaService.getAll().subscribe({
      next: (data) => {
        this.tiposAsistencia = data;
      },
      error: (err) => {
        console.error('Error al cargar tipos de asistencia:', err);
        this.tiposAsistencia = [];
      }
    });
  }

  onSubmit() {
    if (this.addForm.valid && !this.isSubmitting) {
      this.loading = true;
      this.error = null;
      this.isSubmitting = true;
      const formData = this.addForm.value;

      let url = '';
      switch (this.tipo) {
        case 'grados':
          url = `${this.apiBase}/grado`;
          break;
        case 'niveles':
          url = `${this.apiBase}/nivel`;
          break;
        case 'secciones':
          url = `${this.apiBase}/seccion`;
          break;
        case 'salones':
          url = `${this.apiBase}/salon`;
          break;
      }

      this.http.post(url, formData, {
        headers: this.getHeaders(),
        responseType: 'text' as 'json'
        // Para manejar respuestas de texto plano
      }).subscribe({
        next: (response) => {
          this.snackBar.open(
            `${this.getTipoDisplayName()} creado correctamente`,
            'Cerrar',
            { duration: 3000 }
          );
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = this.getErrorMessage(error);
          this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
          this.loading = false;
          this.isSubmitting = false;
        }
      });
    }
  }

  private getTipoDisplayName(): string {
    switch (this.tipo) {
      case 'grados': return 'Grado';
      case 'niveles': return 'Nivel';
      case 'secciones': return 'Sección';
      case 'salones': return 'Salón';
      default: return 'Elemento';
    }
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 400) {
      return 'Datos inválidos';
    }
    if (error.status === 401) {
      return 'No autorizado';
    }
    return 'Error al guardar. Intente nuevamente';
  }

  onCancel() {
    this.dialogRef.close({ success: false });
  }
}