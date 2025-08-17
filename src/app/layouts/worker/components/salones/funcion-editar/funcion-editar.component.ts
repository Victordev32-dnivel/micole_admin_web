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

@Component({
  selector: 'app-funcion-editar',
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
  templateUrl: './funcion-editar.component.html',
  styleUrls: ['./funcion-editar.component.css'],
})
export class FuncionEditarComponent implements OnInit {
  editForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  tipo: string;
  id: number;
  idColegio: number;
  isSubmitting = false;
  grados: { id: number; nombre: string }[] = [];
  secciones: { id: number; nombre: string }[] = [];
  niveles: { id: number; nombre: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<FuncionEditarComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { tipo: string; id: number; idColegio: number }
  ) {
    this.tipo = data.tipo;
    this.id = data.id;
    this.idColegio = data.idColegio;
    this.editForm = this.createForm(this.tipo);
  }

  ngOnInit() {
    if (this.tipo === 'salones') {
      this.loadGrados();
      this.loadSecciones();
      this.loadNiveles();
    }
    this.loadData();
  }

  private createForm(tipo: string): FormGroup {
    switch (tipo) {
      case 'niveles':
      case 'secciones':
        return this.fb.group({
          nombre: ['', Validators.required],
          idColegio: [this.idColegio],
        });
      case 'salones':
        return this.fb.group({
          horaInicio: ['', Validators.required],
          horaFin: ['', Validators.required],
          tipo: ['', Validators.required],
          idGrado: [0, Validators.required],
          idSeccion: [0, Validators.required],
          idNivel: [0, Validators.required],
          idColegio: [this.idColegio],
        });
      default:
        return this.fb.group({});
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  private loadGrados() {
    this.http
      .get<any>(
        `https://proy-back-dnivel-44j5.onrender.com/api/grado/colegio/${this.idColegio}`,
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
        `https://proy-back-dnivel-44j5.onrender.com/api/seccion/colegio/${this.idColegio}`,
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
        `https://proy-back-dnivel-44j5.onrender.com/api/nivel/colegio/${this.idColegio}`,
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

  private loadData() {
    this.loading = true;
    let url = '';
    switch (this.tipo) {
      case 'niveles':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/nivel/${this.id}`;
        break;
      case 'secciones':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/seccion/${this.id}`;
        break;
      case 'salones':
        url = `https://proy-back-dnivel-44j5.onrender.com/api/salon/${this.id}`;
        break;
    }
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        this.editForm.patchValue({
          ...response,
          idColegio: this.idColegio,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.error = 'Error al cargar los datos';
        this.loading = false;
      },
    });
  }

  onSubmit() {
    if (this.editForm.valid && !this.isSubmitting) {
      this.loading = true;
      this.error = null;
      this.isSubmitting = true;
      const formData = this.editForm.value;
      console.log(
        'Datos enviados al submit:',
        JSON.stringify(formData, null, 2)
      );
      let url = '';
      switch (this.tipo) {
        case 'niveles':
          url = `https://proy-back-dnivel-44j5.onrender.com/api/nivel/${this.id}`;
          break;
        case 'secciones':
          url = `https://proy-back-dnivel-44j5.onrender.com/api/seccion/${this.id}`;
          break;
        case 'salones':
          url = `https://proy-back-dnivel-44j5.onrender.com/api/salon/${this.id}`;
          break;
      }
      console.log('URL de la petición:', url);
      this.http.put(url, formData, { headers: this.getHeaders() }).subscribe({
        next: (response) => {
          console.log('Respuesta de la API:', response);
          this.successMessage = 'Editado exitosamente';
          this.loading = false;
          this.isSubmitting = false;
          setTimeout(() => this.dialogRef.close({ success: true }), 1000);
        },
        error: (error) => {
          console.error('Error de la API:', error);
          this.error = 'Error al editar. Intente de nuevo';
          this.loading = false;
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel() {
    this.editForm.reset();
    this.dialogRef.close({ success: false });
  }
}
