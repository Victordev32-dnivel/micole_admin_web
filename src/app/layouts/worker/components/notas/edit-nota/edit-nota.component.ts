import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../../services/UserData';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-nota',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-nota.component.html',
  styleUrls: ['./edit-nota.component.css']
})
export class EditNotasComponent implements OnInit {
  editForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditNotasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editForm = this.fb.group({
      nombre: [data.nota.nombre, [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {}

  private getHeaders(): HttpHeaders {
    const jwtToken = this.userService.getJwtToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.snackBar.open('Por favor ingrese un nombre válido', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.loading = true;
    
    // Payload que solo contiene el nombre a actualizar
    const payload = {
      nombre: this.editForm.value.nombre
    };

    console.log('Enviando payload:', payload);

    this.http.put(
      `https://proy-back-dnivel-44j5.onrender.com/api/nota/${this.data.nota.id}`,
      payload,
      { 
        headers: this.getHeaders(),
        observe: 'response'
      }
    ).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.snackBar.open('Nombre de nota actualizado correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error completo:', error);
        let errorMessage = 'Error al actualizar el nombre de la nota';
        
        if (error.status === 400) {
          errorMessage = error.error?.message || 'El nombre proporcionado no es válido';
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}