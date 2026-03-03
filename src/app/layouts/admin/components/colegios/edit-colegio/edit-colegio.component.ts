import { Component, OnInit, ChangeDetectorRef, Inject, ViewChild, ElementRef } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { S3Service } from '../../../../../services/s3.service';

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
    MatIconModule,
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
  customErrorStateMatcher = new CustomErrorStateMatcher();

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private s3Service: S3Service,
    public dialogRef: MatDialogRef<EditColegioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; colegios: any[] }
  ) {
    this.colegioId = data.id;
    this.colegioForm = this.fb.group({
      nombre: ['', Validators.required],
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
    this.error = null;

    const colegio = this.data.colegios.find((c) => c.id === this.colegioId);
    if (colegio) {
      this.colegioForm.patchValue({
        nombre: colegio.nombre || colegio.colegio,
        direccion: colegio.direccion,
        celular: colegio.celular,
      });
      this.imagePreview = colegio.imagenUrl || null;
    } else {
      this.error = 'No se encontró el colegio con el ID especificado';
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async onSubmit() {
    if (this.colegioForm.valid) {
      this.loading = true;
      this.error = null;

      try {
        let imagenUrl = this.imagePreview; // Keep existing if not changed
        if (this.selectedFile) {
          imagenUrl = await this.s3Service.uploadFile(this.selectedFile);
        }

        const formData = {
          ...this.colegioForm.value,
          imagenUrl: imagenUrl
        };

        this.http
          .put(
            `https://proy-back-dnivel-44j5.onrender.com/api/colegio/${this.colegioId}`,
            formData,
            { headers: this.getHeaders() }
          )
          .subscribe({
            next: (response) => {
              this.successMessage = 'Colegio actualizado exitosamente';
              this.loading = false;
              this.cdr.detectChanges();
              setTimeout(() => this.dialogRef.close(true), 1000);
            },
            error: (error) => {
              console.error('Error al actualizar colegio:', error);
              this.error = `Error al actualizar el colegio: ${error.status} - ${error.statusText}. Detalle: ${error.message}`;
              this.loading = false;
              this.cdr.detectChanges();
            },
          });
      } catch (uploadError: any) {
        console.error('Error al subir imagen:', uploadError);
        this.error = `Error al subir la imagen: ${uploadError.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
