import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

export class InstantErrorStateMatcher implements ErrorStateMatcher {
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
  selector: 'app-add-trabajadores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
  ],
  templateUrl: './add-trabajadores.component.html',
  styleUrls: ['./add-trabajadores.component.css'],
})
export class AddTrabajadoresComponent implements OnInit {
  trabajadorForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // ✅ Se define el matcher
  customErrorStateMatcher = new InstantErrorStateMatcher();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<AddTrabajadoresComponent>
  ) {
    this.trabajadorForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidoPaterno: ['', Validators.required],
      apellidoMaterno: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      idColegio: [1, Validators.required], // valor por defecto
    });
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
        .post(
          'https://proy-back-dnivel-44j5.onrender.com/api/Trabajador',
          formData,
          {
            headers: this.getHeaders(),
          }
        )
        .subscribe({
          next: (response: any) => {
            this.successMessage = 'Trabajador agregado exitosamente';
            this.loading = false;
            this.cdr.detectChanges();
            setTimeout(
              () => this.dialogRef.close({ action: 'save', data: response }),
              1000
            );
          },
          error: (error) => {
            console.error('Error al agregar trabajador:', error);
            this.error = 'Error al agregar el trabajador. Intente de nuevo';
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
