import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';

export class CustomErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-edit-trabajador',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-trabajadores.component.html',
  styleUrls: ['./edit-trabajadores.component.css'],
})
export class EditTrabajadoresComponent implements OnInit {
  trabajadorForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  trabajadorId: number;
  customErrorStateMatcher = new CustomErrorStateMatcher();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<EditTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; trabajador: any }
  ) {
    this.trabajadorId = data.id;
    this.trabajadorForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      idColegio: [data.trabajador?.idColegio || 1, Validators.required], // Valor del trabajador o por defecto
    });
    if (data.trabajador) {
      this.trabajadorForm.patchValue({
        nombre: data.trabajador.nombre,
        apellidoPaterno: data.trabajador.apellidoPaterno,
        apellidoMaterno: data.trabajador.apellidoMaterno,
        dni: data.trabajador.dni,
        telefono: data.trabajador.telefono,
      });
    }
  }

  ngOnInit() {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  onSubmit() {
    if (this.trabajadorForm.valid) {
      this.loading = true;
      this.error = null;
      const formData = this.trabajadorForm.value;

      this.http
        .put(
          `https://proy-back-dnivel-44j5.onrender.com/api/Trabajador/${this.trabajadorId}`,
          formData,
          {
            headers: this.getHeaders(),
          }
        )
        .subscribe({
          next: (response: any) => {
            this.successMessage = 'Trabajador actualizado exitosamente';
            this.loading = false;
            this.cdr.detectChanges();
            setTimeout(
              () => this.dialogRef.close({ action: 'save', data: response }),
              1000
            );
          },
          error: (error) => {
            console.error('Error al actualizar trabajador:', error);
            this.error = 'Error al actualizar el trabajador. Intente de nuevo';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
