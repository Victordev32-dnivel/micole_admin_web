import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';
import { MatSnackBar } from '@angular/material/snack-bar';
import { S3 } from 'aws-sdk';
import { Buffer } from 'buffer';
import { environment } from '../../../../../environment/environment';

if (typeof Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

const BUCKET_NAME = 'bckpdfs';

@Component({
  selector: 'app-add-nota',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-notas.component.html',
  styleUrls: ['./add-notas.component.css'],
})
export class AddNotaComponent implements OnInit {
  noteForm: FormGroup;
  salones: { id: number; nombre: string }[] = [];
  alumnos: { id: number; nombre: string }[] = [];
  loadingSalones: boolean = true;
  loadingAlumnos: boolean = false;
  pdfFile: File | null = null;
  pdfName: string = '';
  uploadProgress: number = 0;
  uploading: boolean = false;
  error: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private s3: S3;

  constructor(
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<AddNotaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.noteForm = this.fb.group({
      idSalon: ['', Validators.required],
      idAlumno: ['', Validators.required],
      nombre: ['', Validators.required],
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

  ngOnInit(): void {
    this.loadSalones();
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || '732612882';
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  removePdf(): void {
    this.pdfFile = null;
    this.pdfName = '';
    this.uploadProgress = 0;
    this.cdr.detectChanges();
  }

  loadSalones(): void {
    const colegioId = this.data?.colegioId;
    if (!colegioId) {
      this.error = 'No se pudo cargar los salones: ID del colegio no disponible';
      this.loadingSalones = false;
      return;
    }

    this.loadingSalones = true;
    this.error = null;

    this.http
      .get<any>(
        `https://proy-back-dnivel-44j5.onrender.com/api/salon/colegio/lista/${colegioId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
          this.salones = response.data || [];
          this.loadingSalones = false;
          if (this.salones.length === 0) {
            this.error = 'No se encontraron salones para este colegio';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar salones:', error);
          this.error = 'Error al cargar los salones. Intente de nuevo';
          this.loadingSalones = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSalonChange(): void {
    const salonId = this.noteForm.get('idSalon')?.value;
    if (salonId) {
   
      this.loadAlumnos(salonId);
      this.noteForm.get('idAlumno')?.reset();
    } else {
      this.alumnos = [];
      this.noteForm.get('idAlumno')?.reset();
      this.error = null;
    }
  }

  // Método para hacer una petición de prueba y ver la estructura de datos
  async debugApiResponse(salonId: number): Promise<void> {
  
    try {
      const response = await this.http.get(`https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon/${salonId}`, {
        headers: this.getHeaders()
      }).toPromise();

      

      if (Array.isArray(response) && response.length > 0) {
      ;
      }
    } catch (error) {
      console.error('🐛 DEBUG: Error en petición de prueba:', error);
    }
  }

  loadAlumnos(salonId: number): void {
   

    // Hacer petición de debug primero
    this.debugApiResponse(salonId);

    this.loadingAlumnos = true;
    this.error = null;
    this.alumnos = [];

    this.http
      .get<any>(
        `https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon/${salonId}`,
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: (response) => {
       
          // Verificar diferentes estructuras de respuesta posibles
          let alumnosData = [];

          if (Array.isArray(response)) {
            alumnosData = response;
           
          } else if (response.data && Array.isArray(response.data)) {
            alumnosData = response.data;
       
          } else if (response.alumnos && Array.isArray(response.alumnos)) {
            alumnosData = response.alumnos;
          
          } else if (response.result && Array.isArray(response.result)) {
            alumnosData = response.result;
         
          } else {
            console.warn('⚠️ Estructura de respuesta no reconocida:', response);
            // Si no es array, intentar con el objeto completo
            if (typeof response === 'object' && response !== null) {
              alumnosData = [response];
            }
          }

    

          // Mapear los alumnos usando la estructura correcta de tu API
          this.alumnos = alumnosData.map((item: any, index: number) => {
        

            // Tu API usa 'id' para el identificador del alumno
            const id = item.id;

            // Tu API usa 'nombre_completo' para el nombre del alumno
            const nombre = item.nombre_completo || `Alumno ID: ${id}`;

          

            return {
              id: id,
              nombre: nombre
            };
          });

       

          this.loadingAlumnos = false;
          if (this.alumnos.length === 0) {
            this.error = 'No se encontraron alumnos en este salón';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error al cargar alumnos:', error);
          console.error('📍 URL utilizada:', `https://proy-back-dnivel-44j5.onrender.com/api/alumno/salon/${salonId}`);
          console.error('🔧 Headers enviados:', this.getHeaders());

          this.error = 'Error al cargar los alumnos. Intente de nuevo';
          this.loadingAlumnos = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPdfUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar que sea un PDF
      if (file.type !== 'application/pdf') {
        this.error = 'Por favor selecciona solo archivos PDF';
        this.cdr.detectChanges();
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.error = 'El archivo PDF no debe exceder los 10MB';
        this.cdr.detectChanges();
        return;
      }

      this.pdfFile = file;
      this.pdfName = file.name;
      this.error = null; // Limpiar errores previos
      this.cdr.detectChanges();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  async uploadPdfToS3(file: File): Promise<string> {
    try {
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

      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'application/pdf',
      };

      const upload = this.s3.upload(params);

      upload.on('httpUploadProgress', (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        this.ngZone.run(() => {
          this.uploadProgress = percent;
          this.cdr.detectChanges();
        });
      });

      await upload.promise();

      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Expires: 7 * 24 * 60 * 60,
      });

      return signedUrl;
    } catch (error: unknown) {
      console.error('❌ Error al subir PDF de notas:', error);
      let errorMessage = 'Error desconocido al subir PDF';
      if (error instanceof Error) errorMessage = error.message;
      throw new Error(errorMessage);
    }
  }

  async onSave(): Promise<void> {
    if (!this.noteForm.valid || !this.pdfFile) {
      this.error = 'Por favor completa todos los campos y selecciona un PDF';
      this.cdr.detectChanges();
      return;
    }

    this.uploading = true;
    this.error = null;

    try {
      const pdfUrl = await this.uploadPdfToS3(this.pdfFile);

      const payload = {
        IdAlumno: this.noteForm.get('idAlumno')?.value,
        Pdf: pdfUrl,
        IdColegio: this.data?.colegioId,
        Nombre: this.noteForm.get('nombre')?.value.trim(),
      };

     

      await this.http
        .post('https://proy-back-dnivel-44j5.onrender.com/api/nota', payload, {
          headers: this.getHeaders(),
        })
        .toPromise();

      this.snackBar.open('Nota agregada exitosamente!', 'Cerrar', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(payload);
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      this.error = error.error?.message || error.message || 'Error de conexión';
    } finally {
      this.uploading = false;
      this.cdr.detectChanges();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
