import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { S3 } from 'aws-sdk';
import { Buffer } from 'buffer';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { UserData, UserService } from '../../../../services/UserData';

if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

const BUCKET_NAME = 'bckpdfs';

@Component({
  selector: 'app-notas',
  templateUrl: './notas.component.html',
  styleUrls: ['./notas.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSelectModule,
  ],
})
export class NotasComponent implements OnInit {
  noteForm: FormGroup;
  salones: { id: number; nombre: string }[] = [];
  alumnos: { id: number; nombre: string }[] = [];
  loadingSalones: boolean = true;
  loadingAlumnos: boolean = false;
  colegioId: number | null = null;
  pdfFile: File | null = null;
  pdfName: string = '';
  uploadProgress: number = 0;
  uploading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private s3: S3;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService
  ) {
    this.noteForm = this.fb.group({
      idSalon: ['', Validators.required],
      idAlumno: ['', Validators.required],
      nombre: ['', Validators.required],
    });
    this.s3 = new S3({
      accessKeyId: 'AKIASYIUVPYK5L3ET47F',
      secretAccessKey: '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',
      region: 'us-east-1',
      signatureVersion: 'v4',
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
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.colegioId = userData.colegio;
        this.loadSalones();
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
      console.error('ID del colegio no disponible');
      this.error =
        'No se pudo cargar los salones: ID del colegio no disponible';
      this.loadingSalones = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingSalones = true;
    this.error = null;
    this.successMessage = null;
    this.http
      .get<any>(
        `https://proy-back-dnivel.onrender.com/api/salon/colegio/lista/${this.colegioId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.salones = response.data || [];
            console.log('Salones cargados:', this.salones);
            this.loadingSalones = false;
            if (this.salones.length === 0) {
              this.error = 'No se encontraron salones para este colegio';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loadingSalones = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSalonChange() {
    const salonId = this.noteForm.get('idSalon')?.value;
    if (salonId) {
      this.loadAlumnos(salonId);
      this.noteForm.get('idAlumno')?.reset();
    } else {
      this.alumnos = [];
      this.noteForm.get('idAlumno')?.reset();
      this.error = null;
      this.cdr.detectChanges();
    }
  }

  loadAlumnos(salonId: number) {
    this.loadingAlumnos = true;
    this.error = null;
    this.successMessage = null;
    this.alumnos = [];
    this.http
      .get<any>(
        `https://proy-back-dnivel.onrender.com/api/alumno/salon/${salonId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.alumnos = response.map((item: any) => ({
              id: item.idAlumno,
              nombre: item.alumno || 'Alumno sin nombre',
            }));
            console.log('Alumnos cargados:', this.alumnos);
            this.loadingAlumnos = false;
            if (this.alumnos.length === 0) {
              this.error = 'No se encontraron alumnos en este salón';
            }
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error al cargar alumnos:', error);
          this.error = 'Error al cargar los alumnos. Intente de nuevo';
          this.loadingAlumnos = false;
          this.cdr.detectChanges();
        },
      });
  }

  async uploadPdfToS3(file: File): Promise<string> {
    try {
      console.log('🚀 Iniciando subida de PDF de notas:', file.name);
      this.uploadProgress = 0;

      if (!file) throw new Error('El archivo no existe');

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
      const fileName = `notes/${timestamp}_${randomId}.pdf`;

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
          this.cdr.detectChanges();
        });
      });

      await upload.promise();
      console.log('✅ Archivo de notas subido exitosamente');

      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Expires: 7 * 24 * 60 * 60,
      });

      console.log('🔗 URL presignada generada para notas:', signedUrl);

      return signedUrl;
    } catch (error: unknown) {
      console.error('❌ Error al subir PDF de notas:', error);
      let errorMessage = 'Error desconocido al subir PDF';
      if (error instanceof Error) errorMessage = error.message;
      throw new Error(errorMessage);
    }
  }

  onPdfUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.pdfFile = file;
      this.pdfName = file.name;
      this.cdr.detectChanges();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  async onSave(): Promise<void> {
    if (!this.noteForm.valid || !this.pdfFile) {
      this.error = 'Por favor completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    this.uploading = true;
    this.error = null;

    try {
      console.log('🔄 Iniciando proceso de guardado de notas...');
      const pdfUrl = await this.uploadPdfToS3(this.pdfFile);
      console.log('✅ PDF subido, URL obtenida:', pdfUrl);

      const payload = {
        IdAlumno: this.noteForm.get('idAlumno')?.value,
        Pdf: pdfUrl,
        IdColegio: this.colegioId,
        Nombre: this.noteForm.get('nombre')?.value.trim(),
      };

      console.log(
        '📝 Payload para API de notas:',
        JSON.stringify(payload, null, 2)
      );

      const response = await this.http
        .post('https://proy-back-dnivel.onrender.com/api/nota', payload, {
          headers: this.getHeaders(),
        })
        .toPromise();
      console.log('✅ Nota guardada exitosamente');

      this.successMessage = 'Nota subida correctamente';
      this.noteForm.reset();
      this.pdfFile = null;
      this.pdfName = '';
      this.uploadProgress = 0;
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      this.error = error.error?.message || error.message || 'Error de conexión';
    } finally {
      this.uploading = false;
      this.cdr.detectChanges();
    }
  }

  onBack(): void {
    window.history.back();
  }
}
