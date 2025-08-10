import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../../../../services/UserData';

@Component({
  selector: 'app-add-apoderado',
  templateUrl: './add-apoderado.component.html',
  styleUrls: ['./add-apoderado.component.css']
})
export class AddApoderadoComponent implements OnInit {
  apoderadoForm: FormGroup;
  loading = false;
  hidePassword = true;
  isEditMode = false;
  private apiUrl = 'https://proy-back-dnivel.onrender.com/api/apoderado';
  private staticToken = '732612882';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddApoderadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.apoderadoForm = this.fb.group({
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      tipoUsuario: ['APODERADO', [Validators.required]],
      contrasena: ['', [Validators.minLength(6)]], // No requerida en edición
      nombres: ['', [Validators.required]],
      apellidoPaterno: ['', [Validators.required]],
      apellidoMaterno: [''],
      genero: ['M', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      parentesco: ['', [Validators.required]],
      idColegio: [this.userService.getUserData()?.colegio || 0, [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.apoderado) {
      this.isEditMode = true;
      this.loadApoderadoData(this.data.apoderado.id);
      // Quitar requerido de contraseña en edición
      this.apoderadoForm.get('contrasena')?.clearValidators();
      this.apoderadoForm.get('contrasena')?.updateValueAndValidity();
    }
  }

  private loadApoderadoData(id: number): void {
    this.loading = true;
    const headers = this.getHeaders();
    
    this.http.get(`${this.apiUrl}/${id}`, { headers }).subscribe({
      next: (response: any) => {
        this.apoderadoForm.patchValue({
          numeroDocumento: response.numeroDocumento,
          tipoUsuario: response.tipoUsuario,
          nombres: response.nombres,
          apellidoPaterno: response.apellidoPaterno,
          apellidoMaterno: response.apellidoMaterno,
          genero: response.genero,
          telefono: response.telefono,
          parentesco: response.parentesco,
          idColegio: response.idColegio
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar apoderado:', error);
        this.snackBar.open('Error al cargar datos del apoderado', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken() || this.staticToken;
    return new HttpHeaders({
      Authorization: `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    });
  }

  onSubmit(): void {
    if (this.apoderadoForm.valid) {
      this.loading = true;
      const formData = this.apoderadoForm.value;

      if (this.isEditMode) {
        this.updateApoderado(this.data.apoderado.id, formData);
      } else {
        this.createApoderado(formData);
      }
    }
  }

  private createApoderado(formData: any): void {
    const headers = this.getHeaders();
    
    this.http.post(this.apiUrl, formData, { headers }).subscribe({
      next: (response) => {
        this.showSuccess('Apoderado creado exitosamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.handleError(error, 'crear');
      }
    });
  }

  private updateApoderado(id: number, formData: any): void {
    const headers = this.getHeaders();
    
    this.http.put(`${this.apiUrl}/${id}`, formData, { headers }).subscribe({
      next: (response) => {
        this.showSuccess('Apoderado actualizado exitosamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.handleError(error, 'actualizar');
      }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    this.loading = false;
  }

  private handleError(error: any, action: string): void {
    console.error(`Error al ${action} apoderado:`, error);
    this.snackBar.open(
      error.error?.message || `Error al ${action} apoderado`, 
      'Cerrar', 
      { duration: 3000, panelClass: ['error-snackbar'] }
    );
    this.loading = false;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}