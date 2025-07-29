import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker'; // Añadido
import { MatNativeDateModule } from '@angular/material/core'; // Añadido

@Component({
  selector: 'app-comunicado-form',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule, // Añadido
    MatNativeDateModule // Añadido
  ],
  templateUrl: './comunicado-form.component.html',
  styleUrls: ['./comunicado-form.component.css']
})
export class ComunicadoFormComponent {
  comunicadoForm: FormGroup;
  aulas = ['Aula 101', 'Aula 102', 'Aula 103', 'Aula 104'];

  constructor(private fb: FormBuilder) {
    this.comunicadoForm = this.fb.group({
      name: [''],
      eventDate: [''],
      eventTime: [''],
      eventImage: [''],
      type: ['specific'], // Por defecto "Comunicado Específico"
      aula: [''] // Habilitado por defecto
    });

    this.comunicadoForm.get('type')?.valueChanges.subscribe(type => {
      this.comunicadoForm.get('aula')?.[type === 'general' ? 'disable' : 'enable']();
    });
  }

  onSubmit(): void {
    if (this.comunicadoForm.valid) {
      console.log('Formulario enviado:', this.comunicadoForm.value);
    }
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.comunicadoForm.patchValue({ eventImage: input.files[0].name });
    }
  }

  onPdfUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('PDF subido:', input.files[0].name);
    }
  }
}