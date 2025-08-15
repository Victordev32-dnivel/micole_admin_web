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
import { MatToolbarModule } from '@angular/material/toolbar';
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
import { environment  } from '../../../../../environments/environments';

// Polyfill para Buffer
if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

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
    MatToolbarModule,
  ],
  templateUrl: './comunicado-form.component.html',
  styleUrls: ['./comunicado-form.component.css'],
})
export class ComunicadoFormComponent implements OnInit {
  comunicadoForm: FormGroup;
  generalForm: FormGroup;
  salones: { id: number; nombre: string }[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  colegioId: number = 0;
  uploadProgress: number = 0;
  pdfFile: File | null = null;
  imageFile: File | null = null;
  isBrowser: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

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
    this.generalForm = this.fb.group({
      nombre: ['', Validators.required],
      horario: ['', Validators.required],
      imagen: [''],
      idColegio: [0],
    });

    // Configuración de S3 usando environment
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
    if (this.isBrowser) {
      this.loadUserData();
      this.loadSalones();
    }
  }

  private loadUserData(): void {
    const userData = this.userService.getUserData();
    if (userData) {
      this.colegioId = userData.colegio;
      this.generalForm.patchValue({ idColegio: this.colegioId });
    }
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.generalForm.patchValue({ idColegio: this.colegioId });
        this.loadSalones();
        this.cdr.detectChanges();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';

    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
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

    const headers = this.getHeaders();
    this.http
      .get<any>(
        `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/${this.colegioId}`,
        { headers }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salones = response.data.map((item: any) => ({
              id: item.id,
              nombre: item.nombre,
            }));
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

      const params = {
        Bucket: 'bckpdfs', // o puedes agregarlo al environment también
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
        Bucket: 'bckpdfs',
        Key: fileName,
        Expires: 7 * 24 * 60 * 60,
      });

      return signedUrl;
    } catch (error: unknown) {
      console.error('❌ Error detallado en uploadPdfToS3:', error);

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

  async uploadImageToS3(file: File): Promise<string> {
    try {
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
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `announcements/images/${timestamp}_${randomId}.${fileExtension}`;

      let contentType = 'image/jpeg';
      if (fileExtension === 'png') contentType = 'image/png';
      else if (fileExtension === 'gif') contentType = 'image/gif';
      else if (fileExtension === 'webp') contentType = 'image/webp';

      const params = {
        Bucket: 'bckpdfs',
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      };

      console.log('⚙️ Parámetros de subida configurados (archivo privado)');

      const upload = this.s3.upload(params, {
        partSize: 5 * 1024 * 1024,
        queueSize: 1,
      });

      upload.on('httpUploadProgress', (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        this.ngZone.run(() => {
          this.uploadProgress = percent;
          console.log(`📈 Progreso: ${percent}%`);
          this.cdr.detectChanges();
        });
      });

      await upload.promise();
      console.log('✅ Imagen subida exitosamente (privada)');

      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: 'bckpdfs',
        Key: fileName,
        Expires: 7 * 24 * 60 * 60,
      });

      return signedUrl;
    } catch (error: unknown) {
      console.error('❌ Error detallado en uploadImageToS3:', error);

      const isAWSError = (
        err: unknown
      ): err is { code?: string; statusCode?: number; message?: string } => {
        return typeof err === 'object' && err !== null;
      };

      const isError = (err: unknown): err is Error => {
        return err instanceof Error;
      };

      let errorMessage = 'Error desconocido al subir imagen';

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
            console.error('Error al subir PDF:', error.message);
            this.cdr.detectChanges();
          });
        });
    }
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.loading = true;
      this.imageFile = file;

      this.uploadImageToS3(file)
        .then((signedUrl) => {
          this.ngZone.run(() => {
            this.generalForm.patchValue({ imagen: signedUrl });
            this.loading = false;
            this.uploadProgress = 0;
            console.log('Imagen subida correctamente:', signedUrl);
            this.cdr.detectChanges();
          });
        })
        .catch((error) => {
          this.ngZone.run(() => {
            this.loading = false;
            this.error = error.message;
            console.error('Error al subir imagen:', error.message);
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

  triggerImageInput(): void {
    this.imageInput.nativeElement.click();
  }

  onSubmitSalon(): void {
    if (this.comunicadoForm.valid) {
      const data = {
        IdSalon: parseInt(
          this.comunicadoForm.get('idSalon')?.value.toString(),
          10
        ),
        Nombre: this.comunicadoForm.get('nombre')?.value.trim(),
        Horario: this.comunicadoForm.get('horario')?.value.trim(),
        Pdf: this.comunicadoForm.get('pdf')?.value.trim(),
        IdColegio: this.colegioId,
      };
      console.log('Datos a enviar (Salon):', JSON.stringify(data, null, 2));

      const headers = this.getHeaders();
      this.loading = true;
      this.http
        .post('https://proy-back-dnivel-44j5.onrender.com/api/anuncio/salon', data, {
          headers,
        })
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor (Salon):', response);
            this.successMessage = 'Anuncio por salón publicado correctamente';
            this.error = null;
            this.comunicadoForm.reset();
            this.pdfFile = null;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error en el POST (Salon):', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error,
              url: error.url,
              headers: error.headers,
            });
            this.error =
              'Fallo al publicar el anuncio por salón: ' +
              (error.error?.message || error.message || 'Error desconocido');
            this.successMessage = null;
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      this.error = 'Por favor, complete correctamente todos los campos (Salon)';
      this.successMessage = null;
      this.cdr.detectChanges();
    }
  }

  onSubmitGeneral(): void {
    if (this.generalForm.valid) {
      const data = {
        nombre: this.generalForm.get('nombre')?.value.trim(),
        horario: this.generalForm.get('horario')?.value.trim(),
        imagen: this.generalForm.get('imagen')?.value.trim() || null,
        idColegio: this.colegioId,
      };
      console.log('Datos a enviar (General):', JSON.stringify(data, null, 2));

      const headers = this.getHeaders();
      this.loading = true;
      this.http
        .post(
          'https://proy-back-dnivel-44j5.onrender.com/api/anuncio/general',
          data,
          { headers }
        )
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor (General):', response);
            this.successMessage = 'Anuncio general publicado correctamente';
            this.error = null;
            this.generalForm.reset();
            this.imageFile = null;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error en el POST (General):', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error,
              url: error.url,
              headers: error.headers,
            });
            this.error =
              'Fallo al publicar el anuncio general: ' +
              (error.error?.message || error.message || 'Error desconocido');
            this.successMessage = null;
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      this.error =
        'Por favor, complete correctamente todos los campos (General)';
      this.successMessage = null;
      this.cdr.detectChanges();
    }
  }
}