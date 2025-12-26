import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../../../../services/curso.service';

@Component({
    selector: 'app-assign-courses-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatListModule,
        MatCheckboxModule,
        FormsModule
    ],
    templateUrl: './assign-courses-dialog.component.html',
    styleUrls: ['./assign-courses-dialog.component.css']
})
export class AssignCoursesDialogComponent implements OnInit {
    cursos: any[] = [];
    selectedCourses: any[] = [];
    loading = true;
    saving = false;

    constructor(
        public dialogRef: MatDialogRef<AssignCoursesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { profe: any, colegioId: number },
        private cursoService: CursoService
    ) { }

    ngOnInit(): void {
        this.loadCursos();
    }

    loadCursos(): void {
        this.loading = true;
        this.cursoService.getSalones(this.data.colegioId).subscribe({
            next: (salones) => {
                let coursesLoaded = 0;
                const totalSalones = salones.length;
                this.cursos = [];

                if (totalSalones === 0) {
                    this.loading = false;
                    return;
                }

                salones.forEach((salon) => {
                    this.cursoService.getCursosPorSalon(salon.id).subscribe({
                        next: (listaCursos) => {
                            const enrichedCursos = listaCursos.map((curso) => ({
                                ...curso,
                                displayName: `${salon.nombre || 'Salon ' + salon.id} - ${curso.titulo}`
                            }));
                            this.cursos = [...this.cursos, ...enrichedCursos];
                            coursesLoaded++;
                            if (coursesLoaded === totalSalones) {
                                this.loading = false;
                            }
                        },
                        error: () => {
                            coursesLoaded++;
                            if (coursesLoaded === totalSalones) {
                                this.loading = false;
                            }
                        }
                    });
                });
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    isCourseSelected(curso: any): boolean {
        return this.selectedCourses.some(c => c.id === curso.id);
    }

    toggleSelection(curso: any): void {
        if (this.isCourseSelected(curso)) {
            this.selectedCourses = this.selectedCourses.filter(c => c.id !== curso.id);
        } else {
            this.selectedCourses.push(curso);
        }
    }

    onSave(): void {
        this.saving = true;
        const listaCursoId = this.selectedCourses.map(c => Number(c.id));
        this.dialogRef.close(listaCursoId);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
