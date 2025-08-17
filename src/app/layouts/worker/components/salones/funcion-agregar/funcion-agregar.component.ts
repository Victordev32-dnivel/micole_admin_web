import { Component, Inject } from '@angular/core';
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
import { CommonModule } from '@angular/common';

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
  ],
  templateUrl: './funcion-agregar.component.html',
  styleUrls: ['./funcion-agregar.component.css'],
})
export class FuncionAgregarComponent {
  addForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  tipo: string;
  idColegio: number;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    public dialogRef: MatDialogRef<FuncionAgregarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo: string; idColegio: number }
  ) {
    this.tipo = data.tipo;
    this.idColegio = data.idColegio;
    this.addForm = this.createForm(this.tipo);
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

  onSubmit() {
    if (this.addForm.valid) {
      this.loading = true;
      this.error = null;
      const formData = this.addForm.value;
      console.log('Datos enviados:', formData);
      let url = '';
      switch (this.tipo) {
        case 'niveles':
          url = 'https://proy-back-dnivel-44j5.onrender.com/api/nivel';
          break;
        case 'secciones':
          url = 'https://proy-back-dnivel-44j5.onrender.com/api/seccion';
          break;
        case 'salones':
          url = 'https://proy-back-dnivel-44j5.onrender.com/api/salon';
          break;
      }
      console.log('URL:', url);
      this.http.post(url, formData, { headers: this.getHeaders() }).subscribe({
        next: (response) => {
          console.log('Respuesta:', response);
          this.successMessage = 'Agregado exitosamente';
          this.loading = false;
          setTimeout(() => this.dialogRef.close({ success: true }), 1000);
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = 'Error al agregar. Intente de nuevo';
          this.loading = false;
        },
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
