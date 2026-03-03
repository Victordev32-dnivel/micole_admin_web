import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormGroupDirective,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { S3Service } from '../../../../../services/s3.service';

class CustomErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | null
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
  selector: 'app-add-colegio',
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
  templateUrl: './add-colegio.component.html',
  styleUrls: ['./add-colegio.component.css'],
})
export class AddColegioComponent implements OnInit {
  colegioForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  customErrorStateMatcher = new CustomErrorStateMatcher();

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private s3Service: S3Service,
    public dialogRef: MatDialogRef<AddColegioComponent>
  ) {
    this.colegioForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    });
  }

  ngOnInit() { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer 732612882`,
      'Content-Type': 'application/json',
    });
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
        let imagenUrl = '';
        if (this.selectedFile) {
          imagenUrl = await this.s3Service.uploadFile(this.selectedFile);
        }

        const formData = {
          ...this.colegioForm.value,
          imagenUrl: imagenUrl
        };

        this.http
          .post(
            'https://proy-back-dnivel-44j5.onrender.com/api/colegio',
            formData,
            {
              headers: this.getHeaders(),
            }
          )
          .subscribe({
            next: (response) => {
              this.successMessage = 'Colegio agregado exitosamente';
              this.loading = false;
              this.cdr.detectChanges();
              setTimeout(() => this.dialogRef.close(true), 1000);
            },
            error: (error) => {
              console.error('Error al agregar colegio:', error);
              this.error = `Error al agregar el colegio: ${error.status} - ${error.statusText}. Detalle: ${error.message}`;
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
