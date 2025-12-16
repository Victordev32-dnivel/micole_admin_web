import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-profe-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule
    ],
    templateUrl: './profe-dialog.component.html',
    styleUrls: ['./profe-dialog.component.css']
})
export class ProfeDialogComponent implements OnInit {
    profeForm: FormGroup;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<ProfeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit' | 'view', profe?: any }
    ) {
        this.profeForm = this.fb.group({
            nombres: ['', Validators.required],
            apellidoPaterno: ['', Validators.required],
            apellidoMaterno: ['', Validators.required],
            numeroDocumento: ['', Validators.required],
            telefono: ['', Validators.required],
            genero: ['', Validators.required],
            contrasena: ['', data.mode === 'create' ? Validators.required : []]
        });
    }

    ngOnInit(): void {
        if (this.data.profe) {
            this.profeForm.patchValue(this.data.profe);
        }

        if (this.data.mode === 'view') {
            this.profeForm.disable();
        } else if (this.data.mode === 'edit') {
            // Usually ID document is not editable in edit mode, but API might allow it. 
            // Prompt says update payload doesn't include it, but let's keep it visible.
            // If the API doesn't accept it on update, we just won't send it.
            // But for safety, let's disable it in edit mode if it's a key identifier.
            // User prompt payload for update: contrasena, nombres, apellidos, genero, telefono, idColegio.
            // NO numeroDocumento. So we strictly shouldn't send it.
            this.profeForm.get('numeroDocumento')?.disable();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.profeForm.valid) {
            this.dialogRef.close(this.profeForm.getRawValue());
        }
    }
}
