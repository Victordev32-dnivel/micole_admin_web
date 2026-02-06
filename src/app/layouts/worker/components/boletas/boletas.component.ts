import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, of } from 'rxjs';
import { concatMap, toArray, delay, tap, catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoletaService } from '../../../../services/boleta.service';
import { ProfeService } from '../../../../services/profe.service';
import { PeriodoService, Periodo } from '../../../../services/periodo.service';
import { UserService } from '../../../../services/UserData';
import { CursoService } from '../../../../services/curso.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
    selector: 'app-boletas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './boletas.component.html',
    styleUrls: ['./boletas.component.css']
})
export class BoletasComponent implements OnInit {
    periodoId: number | null = null;
    salonId: number | null = null;
    cursoIds: number[] = [];
    salones: any[] = [];
    cursos: any[] = [];
    periodos: Periodo[] = [];
    boletas: any[] = [];
    loading = false;
    error: string | null = null;
    displayedColumns: string[] = ['index', 'alumno', 'nota', 'acciones'];

    constructor(
        private boletaService: BoletaService,
        private profeService: ProfeService,
        private periodoService: PeriodoService,
        private cursoService: CursoService,
        private userService: UserService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const userData = this.userService.getUserData();
        if (userData && userData.id) {
            this.loadSalones();
            this.loadPeriodos();
        }
    }

    loadPeriodos(): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para cargar periodos.');
            return;
        }

        this.periodoService.getByColegio(colegioId).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.periodos = data;
                } else {
                    console.error('Data received for Periodos is not an array:', data);
                    this.periodos = [];
                }
            },
            error: (err) => {
                console.error('Error cargando periodos', err);
                this.showError('No se pudieron cargar los periodos.');
            }
        });
    }

    loadSalones(): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio del usuario.');
            return;
        }

        this.cursoService.getSalones(colegioId).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.salones = data;
                } else {
                    console.error('Data received for Salones is not an array:', data);
                    this.salones = [];
                }
            },
            error: (err) => {
                console.error('Error cargando salones', err);
                this.showError('No se pudieron cargar los salones.');
            }
        });
    }

    onSalonChange(): void {
        this.cursoIds = [];
        this.cursos = [];
        if (this.salonId) {
            this.loadCursos(this.salonId);
        }
    }

    loadCursos(salonId: number): void {
        this.cursoService.getCursosPorSalon(salonId).subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.cursos = data;
                } else {
                    console.error('Data received for Cursos is not an array:', data);
                    this.cursos = [];
                }
            },
            error: (err) => {
                console.error('Error cargando cursos', err);
                this.showError('No se pudieron cargar los cursos del salón.');
            }
        });
    }

    fetchBoletas(): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para ver boletas.');
            return;
        }

        if (!this.periodoId) {
            this.showError('Por favor, ingrese un ID de periodo.');
            return;
        }

        if (this.cursoIds.length === 0) {
            this.showError('Por favor, seleccione al menos un curso.');
            return;
        }

        if (this.cursoIds.length > 1) {
            this.showError('Para ver boletas en la tabla, seleccione solo un curso.');
            return;
        }

        const cursoId = this.cursoIds[0];

        this.loading = true;
        this.boletaService.getBoletas(this.periodoId, cursoId, colegioId).subscribe({
            next: (data) => {
                this.boletas = data;
                this.loading = false;

                if (this.boletas.length === 0) {
                    this.snackBar.open('DEBES CREAR LA BOLETA ANTES DE VER BOLETAS', 'Cerrar', { duration: 5000 });
                }
            },
            error: (err) => {
                console.error('Error obteniendo boletas', err);
                this.loading = false;
                this.showError('Error al obtener las boletas.');
            }
        });
    }

    createBoleta(): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para crear boletas.');
            return;
        }

        if (this.cursoIds.length === 0 || !this.periodoId) {
            this.showError('Seleccione al menos un curso e ingrese un periodo.');
            return;
        }

        this.loading = true;

        console.log('🚀 Iniciando creación masiva para cursos:', this.cursoIds);

        // Procesar secuencialmente con un retraso para evitar saturación/CORS
        from(this.cursoIds).pipe(
            concatMap((id, index) => {
                console.log(`⏳ Procesando curso ${index + 1}/${this.cursoIds.length} (ID: ${id})...`);
                const request = this.boletaService.createBoleta(id, this.periodoId!, colegioId).pipe(
                    tap(() => console.log(`✅ Curso ${id} procesado con éxito`)),
                    catchError(err => {
                        console.error(`❌ Error en curso ${id}:`, err);
                        throw err;
                    })
                );
                // Añadimos un retraso de 1.5 segundos entre peticiones (excepto la primera)
                return index === 0 ? request : of(null).pipe(delay(1500), concatMap(() => request));
            }),
            toArray()
        ).subscribe({
            next: (results) => {
                this.loading = false;
                this.snackBar.open(`Se procesaron ${results.length} cursos con éxito.`, 'Cerrar', { duration: 3000 });
                if (this.cursoIds.length === 1) {
                    this.fetchBoletas();
                }
            },
            error: (err) => {
                console.error('Error general en creación masiva:', err);
                this.loading = false;
                this.showError('Error al crear boletas. Es posible que algunas se hayan creado y otras no. Verifique la consola.');
            }
        });
    }

    updateNota(boleta: any): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para actualizar nota.');
            return;
        }

        if (this.cursoIds.length !== 1 || !this.periodoId) {
            this.showError('Debe tener seleccionado exactamente un curso y un periodo.');
            return;
        }

        const cursoId = this.cursoIds[0];

        if (boleta.nota === null || boleta.nota === undefined || boleta.nota === '') {
            this.showError('Ingrese una nota válida.');
            return;
        }

        if (boleta.nota < 0 || boleta.nota > 20) {
            this.showError('La nota debe estar entre 0 y 20.');
            return;
        }

        this.boletaService.updateBoletaNota(cursoId, this.periodoId, boleta.alumnoId, boleta.nota, colegioId).subscribe({
            next: () => {
                this.snackBar.open('Nota actualizada correctamente.', 'Cerrar', { duration: 2000 });
            },
            error: (err) => {
                console.error('Error actualizando nota', err);
                this.showError('Error al actualizar la nota.');
            }
        });
    }

    deleteBoleta(): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para eliminar.');
            return;
        }

        if (this.cursoIds.length === 0 || !this.periodoId) {
            this.showError('Seleccione al menos un curso y un periodo para eliminar.');
            return;
        }

        if (confirm(`¿Está seguro de que desea eliminar las boletas para los ${this.cursoIds.length} cursos seleccionados?`)) {
            this.loading = true;

            console.log('🗑️ Iniciando eliminación masiva para cursos:', this.cursoIds);

            // Procesar secuencialmente con retraso
            from(this.cursoIds).pipe(
                concatMap((id, index) => {
                    const request = this.boletaService.deleteBoletas(id, this.periodoId!, colegioId);
                    return index === 0 ? request : of(null).pipe(delay(1000), concatMap(() => request));
                }),
                toArray()
            ).subscribe({
                next: () => {
                    this.loading = false;
                    this.snackBar.open('Boletas eliminadas correctamente.', 'Cerrar', { duration: 3000 });
                    this.boletas = [];
                },
                error: (err) => {
                    console.error('Error eliminando boletas en masa', err);
                    this.loading = false;
                    this.showError('Error al eliminar una o más boletas.');
                }
            });
        }
    }

    private showError(msg: string): void {
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
    }
}
