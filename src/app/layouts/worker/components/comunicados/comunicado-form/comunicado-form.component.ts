import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar'; // Añadido
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { S3 } from 'aws-sdk';
import { Buffer } from 'buffer';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { UserData, UserService } from '../../../../../services/UserData';

// Polyfill para Buffer
if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

const BUCKET_NAME = 'bckpdfs';

@Component({
  selector: 'app-comunicado-form',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    MatProgressBarModule,
    MatCardModule,
    MatToolbarModule, // Añadido
  ],
  templateUrl: './comunicado-form.component.html',
  styleUrls: ['./comunicado-form.component.css'],
})
export class ComunicadoFormComponent implements OnInit {
  comunicadoForm: FormGroup;
  salones: { id: number; nombre: string }[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  uploadProgress: number = 0;
  pdfFile: File | null = null;
  isBrowser: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private s3: S3;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.comunicadoForm = this.fb.group({
      idSalon: ['', Validators.required],
      nombre: ['', Validators.required],
      horario: ['', Validators.required],
      pdf: ['', Validators.required],
    });

    this.s3 = new S3({
      accessKeyId: 'AKIASYIUVPYK5L3ET47F',
      secretAccessKey: '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',
      region: 'us-east-1',
      signatureVersion: 'v4',
    });
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadUserData();
      this.loadSalones();
    }
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      console.log('Usuario cargado - colegioId:', this.colegioId);
    }
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        console.log('Usuario actualizado - nuevo colegioId:', this.colegioId);
        this.loadSalones();
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    console.log('Token usado en headers:', jwtToken);
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
    });
  }

  loadSalones() {
    if (!this.colegioId) {
      console.error('No se pudo cargar salones: ID del colegio no disponible');
      this.error =
        'No se pudo cargar los salones: ID del colegio no disponible';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    console.log('Iniciando carga de salones para colegioId:', this.colegioId);
    const headers = this.getHeaders();
    this.http
      .get<any>(
        `https://proy-back-dnivel.onrender.com/api/salon/colegio/${this.colegioId}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            console.log('Respuesta de la API al cargar salones:', response);
            this.salones = response.data.map((item: any) => ({
              id: item.id,
              nombre: item.nombre,
            }));
            console.log('Salones cargados:', this.salones);
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  async uploadPdfToS3(file: File): Promise<string> {
    try {
      console.log('🚀 Iniciando subida de PDF:', file.name);
      this.uploadProgress = 0;

      if (!file) {
        throw new Error('El archivo no existe');
      }

      const reader = new FileReader();
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
      });

      const base64Data = base64Content.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `announcements/${timestamp}_${randomId}.pdf`;

      console.log('📝 Nombre del archivo:', fileName);

      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'application/pdf',
      };

      console.log('⚙️ Parámetros de subida configurados (archivo privado)');

      const upload = this.s3.upload(params);

      upload.on('httpUploadProgress', (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        this.ngZone.run(() => {
          this.uploadProgress = percent;
          console.log(`📈 Progreso: ${percent}%`);
          this.cdr.detectChanges();
        });
      });

      await upload.promise();
      console.log('✅ Archivo subido exitosamente (privado)');

      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Expires: 7 * 24 * 60 * 60,
      });

      console.log('🔗 URL presignada generada:', signedUrl);

      return signedUrl;
    } catch (error: unknown) {
      console.error('❌ Error detallado en uploadPdfToS3:', error);
      console.log('🔍 Detalles de error:', JSON.stringify(error, null, 2));

      const isAWSError = (
        err: unknown
      ): err is { code?: string; statusCode?: number; message?: string } => {
        return typeof err === 'object' && err !== null;
      };

      const isError = (err: unknown): err is Error => {
        return err instanceof Error;
      };

      let errorMessage = 'Error desconocido al subir PDF';

      if (isAWSError(error)) {
        if (error.code === 'NetworkingError') {
          errorMessage =
            'Error de conexión. Verifica tu internet o configura CORS en S3.';
        } else if (error.code === 'InvalidAccessKeyId') {
          errorMessage = 'Credenciales de AWS inválidas. Verifica las claves.';
        } else if (error.code === 'AccessDenied') {
          errorMessage =
            'Sin permisos para subir al bucket. Revisa la política IAM.';
        } else if (error.code === 'NoSuchBucket') {
          errorMessage = 'El bucket no existe. Confirma el nombre.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (isError(error)) {
        errorMessage = error.message;
      }

      this.ngZone.run(() => {
        this.error = errorMessage;
        this.loading = false;
        this.uploadProgress = 0;
        this.cdr.detectChanges();
      });
      throw new Error(errorMessage);
    }
  }

  onPdfUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('PDF seleccionado:', file.name);

      this.loading = true;
      this.pdfFile = file;

      this.uploadPdfToS3(file)
        .then((signedUrl) => {
          this.ngZone.run(() => {
            this.comunicadoForm.patchValue({ pdf: signedUrl });
            this.loading = false;
            this.uploadProgress = 0;
            this.cdr.detectChanges();
          });
        })
        .catch((error) => {
          this.ngZone.run(() => {
            this.loading = false;
            this.error = error.message;
            this.cdr.detectChanges();
          });
        });
    }
  }

  onBack(): void {
    window.history.back();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onSubmit(): void {
    if (this.comunicadoForm.valid) {
      const data = {
        idSalon: this.comunicadoForm.get('idSalon')?.value,
        nombre: this.comunicadoForm.get('nombre')?.value,
        horario: this.comunicadoForm.get('horario')?.value,
        pdf: this.comunicadoForm.get('pdf')?.value,
        id_colegio: this.colegioId,
      };
      console.log('Datos enviados en el formulario:', data);

      const headers = this.getHeaders();
      this.http
        .post('https://proy-back-dnivel.onrender.com/api/anuncio/salon', data, {
          headers,
        })
        .subscribe({
          next: (response) => {
            console.log('Respuesta de la API al publicar anuncio:', response);
            this.successMessage = 'Anuncio publicado correctamente';
            this.error = null;
            this.comunicadoForm.reset();
            this.cdr.detectChanges();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al publicar anuncio:', error);
            this.error =
              'Fallo al publicar el anuncio: ' +
              (error.error?.message || error.message);
            this.successMessage = null;
            this.cdr.detectChanges();
          },
        });
    } else {
      this.error = 'Por favor, complete correctamente todos los campos';
      this.successMessage = null;
      this.cdr.detectChanges();
    }
  }
}
