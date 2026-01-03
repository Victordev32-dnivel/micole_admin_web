import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CursoService } from '../../../../../services/curso.service';
import { ProfeService } from '../../../../../services/profe.service';

@Component({
    selector: 'app-assign-courses-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatListModule,
        MatCheckboxModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        FormsModule
    ],
    templateUrl: './assign-courses-dialog.component.html',
    styleUrls: ['./assign-courses-dialog.component.css']
})
export class AssignCoursesDialogComponent implements OnInit {
    // Cursos ya asignados al profesor
    cursosAsignados: any[] = [];
    // Todos los cursos disponibles para asignar
    cursosDisponibles: any[] = [];
    // Cursos seleccionados para agregar
    selectedCourses: any[] = [];

    loading = true;
    loadingDisponibles = false;
    saving = false;

    // Vista actual: 'lista' para ver cursos asignados, 'agregar' para agregar nuevos
    vistaActual: 'lista' | 'agregar' = 'lista';

    displayedColumns: string[] = ['titulo', 'acciones'];

    constructor(
        public dialogRef: MatDialogRef<AssignCoursesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { profe: any, colegioId: number },
        private cursoService: CursoService,
        private profeService: ProfeService
    ) { }

    ngOnInit(): void {
        this.loadCursosAsignados();
    }

    loadCursosAsignados(): void {
        this.loading = true;
        // Primero cargamos los cursos disponibles para obtener IDs reales
        this.cursoService.getSalones(this.data.colegioId).subscribe({
            next: (salones) => {
                let todosLosCursos: any[] = [];
                let salonesLoaded = 0;
                const totalSalones = salones.length;

                if (totalSalones === 0) {
                    this.loadCursosAsignadosSinCruce();
                    return;
                }

                salones.forEach((salon) => {
                    this.cursoService.getCursosPorSalon(salon.id).subscribe({
                        next: (listaCursos) => {
                            todosLosCursos = [...todosLosCursos, ...listaCursos];
                            salonesLoaded++;
                            if (salonesLoaded === totalSalones) {
                                this.cruzarCursosAsignados(todosLosCursos);
                            }
                        },
                        error: () => {
                            salonesLoaded++;
                            if (salonesLoaded === totalSalones) {
                                this.cruzarCursosAsignados(todosLosCursos);
                            }
                        }
                    });
                });
            },
            error: () => {
                this.loadCursosAsignadosSinCruce();
            }
        });
    }

    loadCursosAsignadosSinCruce(): void {
        this.profeService.getMisCursos(this.data.profe.id).subscribe({
            next: (data) => {
                this.cursosAsignados = data.map(item => ({
                    id: item.cursoId,
                    titulo: item.nombreCurso,
                    profeId: item.profeId
                }));
                this.loading = false;
            },
            error: () => {
                this.cursosAsignados = [];
                this.loading = false;
            }
        });
    }

    cruzarCursosAsignados(todosLosCursos: any[]): void {
        this.profeService.getMisCursos(this.data.profe.id).subscribe({
            next: (data) => {
                // Cruzar por nombre para obtener el ID real del curso
                this.cursosAsignados = data.map(item => {
                    const cursoReal = todosLosCursos.find(c =>
                        c.titulo.toLowerCase() === item.nombreCurso.toLowerCase()
                    );
                    return {
                        id: cursoReal ? cursoReal.id : item.cursoId,
                        titulo: item.nombreCurso,
                        profeId: item.profeId
                    };
                });
                this.loading = false;
            },
            error: () => {
                this.cursosAsignados = [];
                this.loading = false;
            }
        });
    }

    mostrarAgregar(): void {
        this.vistaActual = 'agregar';
        this.loadCursosDisponibles();
    }

    volverALista(): void {
        this.vistaActual = 'lista';
        this.selectedCourses = [];
    }

    loadCursosDisponibles(): void {
        this.loadingDisponibles = true;
        this.cursoService.getSalones(this.data.colegioId).subscribe({
            next: (salones) => {
                let coursesLoaded = 0;
                const totalSalones = salones.length;
                this.cursosDisponibles = [];

                if (totalSalones === 0) {
                    this.loadingDisponibles = false;
                    return;
                }

                salones.forEach((salon) => {
                    this.cursoService.getCursosPorSalon(salon.id).subscribe({
                        next: (listaCursos) => {
                            // Mostrar TODOS los cursos, marcando los ya asignados por título
                            const enrichedCursos = listaCursos.map((curso) => ({
                                ...curso,
                                displayName: `${salon.nombre || 'Salon ' + salon.id} - ${curso.titulo}`,
                                yaAsignado: this.cursosAsignados.some(asignado =>
                                    asignado.titulo.toLowerCase() === curso.titulo.toLowerCase()
                                )
                            }));
                            this.cursosDisponibles = [...this.cursosDisponibles, ...enrichedCursos];
                            coursesLoaded++;
                            if (coursesLoaded === totalSalones) {
                                this.loadingDisponibles = false;
                                // Pre-seleccionar los cursos ya asignados
                                this.selectedCourses = this.cursosDisponibles.filter(c => c.yaAsignado);
                            }
                        },
                        error: () => {
                            coursesLoaded++;
                            if (coursesLoaded === totalSalones) {
                                this.loadingDisponibles = false;
                            }
                        }
                    });
                });
            },
            error: () => {
                this.loadingDisponibles = false;
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

    eliminarCurso(curso: any): void {
        if (!confirm(`¿Está seguro de eliminar el curso "${curso.titulo}" del profesor?`)) {
            return;
        }

        // Llamar a la API DELETE para eliminar el curso
        this.profeService.removeCursosFromProfe(this.data.profe.id, [curso.id]).subscribe({
            next: () => {
                // Remover de la lista visual
                this.cursosAsignados = this.cursosAsignados.filter(c => c.titulo !== curso.titulo);
            },
            error: (err) => {
                console.error('Error eliminando curso', err);
                alert('Error al eliminar el curso del profesor');
            }
        });
    }
}

