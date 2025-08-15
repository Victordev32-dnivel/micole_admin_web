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
  selector: 'app-edit-colegio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-colegio.component.html',
  styleUrls: ['./edit-colegio.component.css'],
})
export class EditColegioComponent implements OnInit {
  colegioForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number;
  customErrorStateMatcher = new CustomErrorStateMatcher(); // ← Aquí la propiedad

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<EditColegioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number }
  ) {
    this.colegioId = data.id;
    this.colegioForm = this.fb.group({
      colegio: ['', Validators.required],
      direccion: ['', Validators.required],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    });
  }

  ngOnInit() {
    this.loadColegio();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
  }

  loadColegio() {
    this.loading = true;
    this.http
      .get<any>(
        `https://proy-back-dnivel.onrender.com/api/colegio/${this.colegioId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          const colegio = response.data;
          this.colegioForm.patchValue({
            colegio: colegio.colegio,
            direccion: colegio.direccion,
            celular: colegio.celular,
          });
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar colegio:', error);
          this.error = 'Error al cargar el colegio. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSubmit() {
    if (this.colegioForm.valid) {
      this.loading = true;
      this.error = null;
      this.http
        .put(
          `https://proy-back-dnivel.onrender.com/api/colegio/${this.colegioId}`,
          this.colegioForm.value,
          { headers: this.getHeaders() }
        )
        .subscribe({
          next: () => {
            this.successMessage = 'Colegio actualizado exitosamente';
            this.loading = false;
            this.cdr.detectChanges();
            setTimeout(() => this.dialogRef.close(true), 1000);
          },
          error: (error) => {
            console.error('Error al actualizar colegio:', error);
            this.error = 'Error al actualizar el colegio. Intente de nuevo';
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
