import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoService } from '../../../../../services/curso.service';

@Component({
    selector: 'app-enroll-student-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './enroll-student-dialog.component.html',
    styleUrls: ['./enroll-student-dialog.component.css']
})
export class EnrollStudentDialogComponent implements OnInit {
    form: FormGroup;
    loading = false;
    submitting = false;
    alumnos: any[] = [];
    cursos: any[] = [];

    constructor(
        private fb: FormBuilder,
        private cursoService: CursoService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<EnrollStudentDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { salonId: number }
    ) {
        this.form = this.fb.group({
            alumnoId: ['', Validators.required],
            cursosId: [[], Validators.required]
        });
    }

    ngOnInit(): void {
        if (this.data.salonId) {
            this.loadData();
        }
    }

    loadData() {
        this.loading = true;
        const salonId = this.data.salonId;

        // Load Students
        this.cursoService.getAlumnosPorSalon(salonId).subscribe({
            next: (response: any) => {
                if (Array.isArray(response)) {
                    this.alumnos = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    this.alumnos = response.data;
                } else {
                    this.alumnos = [];
                }
                this.checkLoading();
            },
            error: (err) => {
                console.error('Error loading students', err);
                this.snackBar.open('Error al cargar alumnos', 'Cerrar', { duration: 3000 });
                this.checkLoading();
            }
        });

        // Load Courses
        this.cursoService.getCursosPorSalon(salonId).subscribe({
            next: (response: any) => {
                if (Array.isArray(response)) {
                    this.cursos = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    this.cursos = response.data;
                } else {
                    this.cursos = [];
                }
                this.checkLoading();
            },
            error: (err) => {
                console.error('Error loading courses', err);
                this.snackBar.open('Error al cargar cursos', 'Cerrar', { duration: 3000 });
                this.checkLoading();
            }
        });
    }

    // Simple check to see if we are done loading initial data
    // Using a timeout is not ideal but for parallel requests without forkJoin it's a simple way to toggle 'loading' state if not strictly tracking count
    // Better: separate flags or forkJoin. Let's strictly track in verify?
    // Actually, I'll just set loading=false when both are done or effectively immediately since they are async.
    // I will use a simple counter approach or just let them complete independently.
    // Let's rely on the template to handle empty lists gracefully for now.
    // Actually, I'll refactor to use forkJoin if I want a unified loading spinner, but independent is fine too.
    // I'll leave loading=false at start and just show spinners/lists.
    // But I set loading=true at start. Let's fix that.

    loadingCount = 2;
    checkLoading() {
        this.loadingCount--;
        if (this.loadingCount <= 0) {
            this.loading = false;
        }
    }

    guardar() {
        if (this.form.invalid) return;

        this.submitting = true;
        const formValue = this.form.value;

        // Payload: { "cursosId": [0], "alumnoId": 0 }
        const payload = {
            cursosId: formValue.cursosId,
            alumnoId: formValue.alumnoId
        };

        this.cursoService.asignarCursosAlumno(payload).subscribe({
            next: () => {
                this.snackBar.open('Cursos asignados correctamente', 'Cerrar', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                console.error('Error assigning courses', err);
                this.snackBar.open('Error al asignar cursos', 'Cerrar', { duration: 3000 });
                this.submitting = false;
            }
        });
    }

    cancelar() {
        this.dialogRef.close();
    }
}
