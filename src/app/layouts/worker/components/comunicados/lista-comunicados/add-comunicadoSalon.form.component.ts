import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';
import { environment } from '../../../../../environments/environment';
import { S3 } from 'aws-sdk';
import { Buffer } from 'buffer';

// Polyfill para Buffer
if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

const BUCKET_NAME = 'bckpdfs';

interface Salon {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-modal-anuncio-salon',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>
        <mat-icon>meeting_room</mat-icon>
        Crear Anuncio por Salón
      </h2>
      <button mat-icon-button [mat-dialog-close]="false" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div mat-dialog-content class="modal-content">
      <form [formGroup]="salonForm" class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>
            <mat-icon style="vertical-align: middle; margin-right: 8px;"
              >school</mat-icon
            >
            Seleccionar Salón
          </mat-label>
          <mat-select formControlName="idSalon" required>
            <mat-option *ngFor="let salon of salones" [value]="salon.id">
              {{ salon.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="salonForm.get('idSalon')?.hasError('required')">
            Debe seleccionar un salón
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Anuncio</mat-label>
          <input
            matInput
            formControlName="nombre"
            placeholder="Ingrese el nombre del anuncio"
            required
          />
          <mat-error *ngIf="salonForm.get('nombre')?.hasError('required')">
            El nombre es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Horario</mat-label>
          <input
            matInput
            formControlName="horario"
            placeholder="Ej: 8:00 AM - 5:00 PM"
            required
          />
          <mat-error *ngIf="salonForm.get('horario')?.hasError('required')">
            El horario es obligatorio
          </mat-error>
        </mat-form-field>

        <div class="upload-section">
          <h4>Documento PDF del Anuncio</h4>
          <div class="upload-container">
            <input
              #pdfInput
              type="file"
              (change)="onPdfUpload($event)"
              class="file-input"
              accept="application/pdf"
            />
            <button
              type="button"
              mat-raised-button
              color="primary"
              (click)="triggerPdfInput()"
              [disabled]="loading"
            >
              <mat-icon>picture_as_pdf</mat-icon>
              {{ pdfFile ? 'Cambiar PDF' : 'Seleccionar PDF' }}
            </button>

            <div class="file-preview" *ngIf="pdfFile">
              <div class="preview-item">
                <mat-icon>picture_as_pdf</mat-icon>
                <span class="file-name">{{ pdfFile.name }}</span>
                <button
                  type="button"
                  mat-icon-button
                  class="remove-button"
                  (click)="removePdf()"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <div
              class="progress-container"
              *ngIf="uploadProgress > 0 && uploadProgress < 100"
            >
              <mat-progress-bar
                mode="determinate"
                [value]="uploadProgress"
              ></mat-progress-bar>
              <span class="progress-text">{{ uploadProgress }}%</span>
            </div>
          </div>
        </div>

        <div class="error-message" *ngIf="error">
          <mat-icon>error</mat-icon>
          {{ error }}
        </div>
      </form>
    </div>

    <div mat-dialog-actions class="modal-actions">
      <button mat-button [mat-dialog-close]="false" [disabled]="loading">
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="!salonForm.valid || loading || !pdfFile"
      >
        <mat-icon *ngIf="loading">hourglass_empty</mat-icon>
        <mat-icon *ngIf="!loading">publish</mat-icon>
        {{ loading ? 'Publicando...' : 'Publicar Anuncio' }}
      </button>
    </div>
  `,
  styles: [
    `
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        background: #f5f7fa;
      }

      .modal-header h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #1976d2;
        font-weight: 600;
      }

      .close-button {
        color: #666;
      }

      .modal-content {
        padding: 24px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .form-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .full-width {
        width: 100%;
      }

      .upload-section {
        margin-top: 16px;
      }

      .upload-section h4 {
        margin: 0 0 16px 0;
        color: #333;
        font-weight: 500;
      }

      .upload-container {
        border: 2px dashed #e0e0e0;
        padding: 24px;
        border-radius: 8px;
        text-align: center;
        background: #fafafa;
        transition: border-color 0.3s ease;
      }

      .upload-container:hover {
        border-color: #1976d2;
      }

      .file-input {
        display: none;
      }

      .file-preview {
        margin-top: 16px;
      }

      .preview-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        max-width: 300px;
        margin: 0 auto;
      }

      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }

      .remove-button {
        color: #f44336;
        width: 32px;
        height: 32px;
      }

      .progress-container {
        margin-top: 16px;
        width: 100%;
      }

      .progress-text {
        display: block;
        text-align: center;
        margin-top: 8px;
        font-size: 14px;
        color: #666;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #f44336;
        background: #ffebee;
        padding: 12px;
        border-radius: 6px;
        font-size: 14px;
      }

      .modal-actions {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        background: #f5f7fa;
        gap: 12px;
      }

      .modal-actions button {
        min-width: 120px;
      }
    `,
  ],
})
export class ModalAnuncioSalonComponent implements OnInit {
  salonForm: FormGroup;
  salones: Salon[] = [];
  loading = false;
  error: string | null = null;
  uploadProgress = 0;
  pdfFile: File | null = null;
  colegioId: number = 0;

  @ViewChild('pdfInput') pdfInput!: ElementRef<HTMLInputElement>;

  private s3: S3;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    public dialogRef: MatDialogRef<ModalAnuncioSalonComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.salonForm = this.fb.group({
      idSalon: ['', [Validators.required]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      horario: ['', [Validators.required]],
      pdf: ['', [Validators.required]],
    });

    this.s3 = new S3({
      accessKeyId: environment.awsAccessKeyId,
      secretAccessKey: environment.awsSecretKey,
      region: 'us-east-1',
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
      correctClockSkew: true,
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadSalones();
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
    }
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  private loadSalones(): void {
    if (!this.colegioId) {
      this.error =
        'No se pudo cargar los salones: ID del colegio no disponible';
      return;
    }

    this.http
      .get<{ data: Salon[] }>(
        `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista/${this.colegioId}`,
        {
          headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: (response) => {
          this.salones = response.data || [];
        },
        error: (error) => {
          this.error = 'Error al cargar los salones';
        },
      });
  }

  triggerPdfInput(): void {
    this.pdfInput.nativeElement.click();
  }

  async onPdfUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.pdfFile = file;
      this.loading = true;
      this.error = null;

      try {
        const signedUrl = await this.uploadPdfToS3(file);
        this.salonForm.patchValue({ pdf: signedUrl });
        this.loading = false;
        this.uploadProgress = 0;
      } catch (error: any) {
        this.loading = false;
        this.error = error.message || 'Error al subir el PDF';
        this.uploadProgress = 0;
      }
    }
  }

  private async uploadPdfToS3(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileName = `announcements/pdfs/${timestamp}_${randomId}.pdf`;

        const params = {
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: 'application/pdf',
        };

        const upload = this.s3.upload(params);

        upload.on('httpUploadProgress', (progress) => {
          this.uploadProgress = Math.round(
            (progress.loaded / progress.total) * 100
          );
        });

        upload
          .promise()
          .then(() => {
            const signedUrl = this.s3.getSignedUrl('getObject', {
              Bucket: BUCKET_NAME,
              Key: fileName,
              Expires: 7 * 24 * 60 * 60,
            });
            resolve(signedUrl);
          })
          .catch(reject);
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  removePdf(): void {
    this.pdfFile = null;
    this.salonForm.patchValue({ pdf: '' });
    this.uploadProgress = 0;
  }

  onSubmit(): void {
    if (this.salonForm.valid && this.pdfFile) {
      this.loading = true;
      this.error = null;

      const formData = {
        IdSalon: parseInt(this.salonForm.get('idSalon')?.value.toString(), 10),
        Nombre: this.salonForm.get('nombre')?.value.trim(),
        Horario: this.salonForm.get('horario')?.value.trim(),
        Pdf: this.salonForm.get('pdf')?.value.trim(),
        IdColegio: this.colegioId,
      };

      this.http
        .post(
          'https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon',
          formData,
          {
            headers: this.getHeaders(),
          }
        )
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.dialogRef.close({ success: true, data: response });
          },
          error: (error) => {
            this.loading = false;
            this.error = error.error?.message || 'Error al publicar el anuncio';
          },
        });
    }
  }
}
