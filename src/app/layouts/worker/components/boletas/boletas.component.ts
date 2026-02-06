import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    cursoId: number | null = null;
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
        this.cursoId = null;
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

        if (!this.cursoId) {
            this.showError('Por favor, seleccione un curso.');
            return;
        }

        this.loading = true;
        this.boletaService.getBoletas(this.periodoId, this.cursoId, colegioId).subscribe({
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

        if (!this.cursoId || !this.periodoId) {
            this.showError('Seleccione un curso e ingrese un periodo.');
            return;
        }

        this.loading = true;
        this.boletaService.createBoleta(this.cursoId, this.periodoId, colegioId).subscribe({
            next: () => {
                this.loading = false;
                this.snackBar.open('Boleta creada con éxito.', 'Cerrar', { duration: 3000 });
                this.fetchBoletas();
            },
            error: (err) => {
                console.error('Error creando boleta', err);
                this.loading = false;
                this.showError('Error al crear la boleta.');
            }
        });
    }

    updateNota(boleta: any): void {
        const colegioId = this.authService.getColegioId();
        if (!colegioId) {
            this.showError('No se pudo identificar el colegio para actualizar nota.');
            return;
        }

        if (!this.cursoId || !this.periodoId) {
            this.showError('Curso o periodo no seleccionado.');
            return;
        }

        if (boleta.nota === null || boleta.nota === undefined || boleta.nota === '') {
            this.showError('Ingrese una nota válida.');
            return;
        }

        if (boleta.nota < 0 || boleta.nota > 20) {
            this.showError('La nota debe estar entre 0 y 20.');
            return;
        }

        this.boletaService.updateBoletaNota(this.cursoId, this.periodoId, boleta.alumnoId, boleta.nota, colegioId).subscribe({
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

        if (!this.cursoId || !this.periodoId) {
            this.showError('Seleccione curso y periodo para eliminar.');
            return;
        }

        if (confirm('¿Está seguro de que desea eliminar las boletas para este curso y periodo?')) {
            this.loading = true;
            this.boletaService.deleteBoletas(this.cursoId, this.periodoId, colegioId).subscribe({
                next: () => {
                    this.loading = false;
                    this.snackBar.open('Boletas eliminadas.', 'Cerrar', { duration: 3000 });
                    this.boletas = [];
                },
                error: (err) => {
                    console.error('Error eliminando boleta', err);
                    this.loading = false;
                    this.showError('Error al eliminar la boleta.');
                }
            });
        }
    }

    private showError(msg: string): void {
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
    }
}
