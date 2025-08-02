import {
  Component,
  ChangeDetectorRef,
  NgZone,
  Inject,
  PLATFORM_ID,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-tarjetas-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
  ],
  templateUrl: './tarjetas-modal.component.html',
  styleUrls: ['./tarjetas-modal.component.css'],
})
export class TarjetasModalComponent {
  @Input() alumnoId: number | null = null;
  @Input() currentRfid: number | null = null;
  @Input() colegioId: number = 0;
  @Output() modalClosed = new EventEmitter<boolean>();
  rfidInput: string = '';
  rfidError: boolean = false;
  modalTitle: string = '';
  loading: boolean = false;
  private apiUrlTarjeta = 'https://proy-back-dnivel.onrender.com/api/tarjeta';
  private staticToken = '732612882';

  constructor(
    public dialogRef: MatDialogRef<TarjetasModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.alumnoId = this.data.alumnoId;
      this.currentRfid = this.data.currentRfid;
      this.colegioId = this.data.colegioId;
      this.rfidInput = this.currentRfid?.toString() || '';
      this.modalTitle = this.currentRfid
        ? 'Actualizar Tarjeta RFID'
        : 'Asignar Tarjeta RFID';
    }
  }

  isRfidInvalid(): boolean {
    return !this.rfidInput || !/^[0-9]{7}$/.test(this.rfidInput);
  }

  confirmRfid() {
    if (this.isRfidInvalid()) {
      this.rfidError = true;
      this.cdr.detectChanges();
      return;
    }

    this.rfidError = false;
    this.loading = true;
    const headers = this.getHeaders();
    const body = {
      rfid: parseInt(this.rfidInput),
      idAlumno: this.alumnoId!,
      idColegio: this.colegioId,
    };

    this.http.post<any>(this.apiUrlTarjeta, body, { headers }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.loading = false;
          this.modalClosed.emit(true); // Indica que se cerró con éxito
          this.dialogRef.close(true);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al asignar tarjeta:', error);
        this.loading = false;
        this.rfidError = true;
        this.cdr.detectChanges();
      },
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  onCancel() {
    this.dialogRef.close(false); // Cierre sin éxito
  }
}
