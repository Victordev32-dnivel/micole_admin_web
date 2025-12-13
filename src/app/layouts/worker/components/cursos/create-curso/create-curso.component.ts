
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoService } from '../../../../../services/curso.service';

@Component({
    selector: 'app-create-curso',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatSnackBarModule,
        MatIconModule,
        MatDialogModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './create-curso.component.html',
    styleUrls: ['./create-curso.component.css']
})
export class CreateCursoComponent implements OnInit {
    cursoForm: FormGroup;
    salones: any[] = [];
    loading = false;
    isEditing: boolean = false;
    cursoId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private cursoService: CursoService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<CreateCursoComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.cursoForm = this.fb.group({
            titulo: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: ['', [Validators.required, Validators.minLength(10)]],
            salonId: [null, [Validators.required]]
        });

        // Initialize from data passed to dialog
        if (data.isEditing) {
            this.isEditing = true;
            this.cursoId = data.curso?.id;
            this.cursoForm.patchValue({
                titulo: data.curso?.titulo,
                descripcion: data.curso?.descripcion,
                salonId: data.curso?.salonId
            });
        }

        if (data.salonId && !this.isEditing) {
            this.cursoForm.patchValue({ salonId: data.salonId });
        }

        // Use passed salons to avoid re-fetching if available
        if (data.salones && data.salones.length > 0) {
            this.salones = data.salones;
        }
    }

    ngOnInit(): void {
        // If salons were not passed, we could fetch them here, 
        // but for better UX, the parent should pass them.
        // We'll trust the parent data for now or fallback if needed.
        if (this.salones.length === 0) {
            console.warn('No salons provided to modal');
            // Optionally fetch if needed, but we expect list component to provide them
        }
    }

    onSubmit() {
        if (this.cursoForm.invalid) {
            return;
        }

        this.loading = true;
        const cursoData = this.cursoForm.value;

        if (this.isEditing && this.cursoId) {
            const updateData = { ...cursoData, id: this.cursoId };
            this.cursoService.updateCurso(this.cursoId, updateData).subscribe({
                next: () => {
                    this.loading = false;
                    this.showSuccess('¡Curso actualizado exitosamente!');
                    this.dialogRef.close(true); // Return true to indicate refresh needed
                },
                error: (err) => {
                    this.loading = false;
                    console.error('Error al actualizar curso:', err);
                    this.showError('Hubo un error al actualizar el curso');
                }
            });
        } else {
            this.cursoService.createCurso(cursoData).subscribe({
                next: (res: any) => {
                    this.loading = false;
                    this.showSuccess('¡Curso creado exitosamente!');
                    this.cursoForm.reset();
                    this.dialogRef.close(true);
                },
                error: (err: any) => {
                    this.loading = false;
                    console.error('Error al crear curso:', err);
                    this.showError('Hubo un error al crear el curso');
                }
            });
        }
    }

    onClose(): void {
        this.dialogRef.close(false);
    }

    showSuccess(message: string) {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    showError(message: string) {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }
}
