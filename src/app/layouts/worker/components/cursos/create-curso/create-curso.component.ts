
import { Component, OnInit, Inject } from '@angular/core';
import { forkJoin } from 'rxjs';
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
                salonId: [data.curso?.salonId]
            });
        }

        if (data.salonId && !this.isEditing) {
            this.cursoForm.patchValue({ salonId: [data.salonId] });
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
        const formValue = this.cursoForm.value;
        // Ensure salonId is an array
        const salonIds: number[] = Array.isArray(formValue.salonId)
            ? formValue.salonId
            : (formValue.salonId ? [formValue.salonId] : []);

        if (this.isEditing && this.cursoId) {
            // For editing, we take the first salon if multiple selected (or UI should restrict)
            // But let's assume standard behavior is preserving the ID.
            const singleSalonId = salonIds.length > 0 ? salonIds[0] : null;
            if (!singleSalonId) {
                this.loading = false;
                return;
            }

            const updateData = {
                ...formValue,
                id: this.cursoId,
                salonId: singleSalonId
            };

            this.cursoService.updateCurso(this.cursoId, updateData).subscribe({
                next: () => {
                    this.loading = false;
                    this.showSuccess('¡Curso actualizado exitosamente!');
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.loading = false;
                    console.error('Error al actualizar curso:', err);
                    this.showError('Hubo un error al actualizar el curso');
                }
            });
        } else {
            // Creation Mode - Handle Multiple
            const requests = salonIds.map(sId => {
                const salon = this.salones.find(s => s.id === sId);
                let titulo = formValue.titulo;

                // Append grade and section if salon info is available
                if (salon) {
                    const salonSuffix = this.getSalonSuffix(salon.nombre);
                    if (salonSuffix) {
                        titulo = `${titulo} ${salonSuffix}`;
                    }
                }

                const cursoData = {
                    titulo: titulo,
                    descripcion: formValue.descripcion,
                    salonId: sId
                };
                return this.cursoService.createCurso(cursoData);
            });

            forkJoin(requests).subscribe({
                next: (res: any[]) => {
                    this.loading = false;
                    this.showSuccess(`¡${res.length} curso(s) creado(s) exitosamente!`);
                    this.cursoForm.reset();
                    this.dialogRef.close(true);
                },
                error: (err: any) => {
                    this.loading = false;
                    console.error('Error al crear cursos:', err);
                    this.showError('Hubo un error al crear los cursos');
                }
            });
        }
    }

    getSalonSuffix(salonName: string): string {
        if (!salonName) return '';

        // Example: "QUINTO - A - SECUNDARIA" -> "QUINTO A"
        const parts = salonName.split(' - ');
        if (parts.length >= 2) {
            const grade = parts[0].trim();
            const section = parts[1].trim();
            // We only return the grade and section
            return `${grade} ${section}`;
        }

        // Example: "QUINTO A" -> "QUINTO A"
        const spaceParts = salonName.trim().split(' ');
        if (spaceParts.length >= 2) {
            const last = spaceParts[spaceParts.length - 1];
            // If the last part is a single letter, it's likely the section
            if (last.length === 1 && /^[A-Z]$/i.test(last)) {
                return salonName.trim();
            }
        }

        return salonName.trim();
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
