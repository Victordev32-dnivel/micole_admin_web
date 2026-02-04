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
    cursoId: number | null = null;
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
        private userService: UserService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const userData = this.userService.getUserData();
        if (userData && userData.id) {
            this.loadCursos(userData.id);
            this.loadPeriodos();
        }
    }

    loadPeriodos(): void {
        this.periodoService.getPeriodos().subscribe({
            next: (data) => {
                this.periodos = data;
            },
            error: (err) => {
                console.error('Error cargando periodos', err);
                this.showError('No se pudieron cargar los periodos.');
            }
        });
    }

    loadCursos(usuarioId: number): void {
        this.profeService.getMisCursos(usuarioId).subscribe({
            next: (data) => {
                this.cursos = data;
            },
            error: (err) => {
                console.error('Error cargando cursos', err);
                this.showError('No se pudieron cargar los cursos.');
            }
        });
    }

    fetchBoletas(): void {
        if (!this.periodoId) {
            this.showError('Por favor, ingrese un ID de periodo.');
            return;
        }

        this.loading = true;
        this.boletaService.getBoletas(this.periodoId).subscribe({
            next: (data) => {
                this.boletas = data;
                this.loading = false;
                if (data.length === 0) {
                    this.snackBar.open('No se encontraron boletas para este periodo.', 'Cerrar', { duration: 3000 });
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
        if (!this.cursoId || !this.periodoId) {
            this.showError('Seleccione un curso e ingrese un periodo.');
            return;
        }

        this.loading = true;
        this.boletaService.createBoleta(this.cursoId, this.periodoId).subscribe({
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
        if (!this.cursoId || !this.periodoId) {
            this.showError('Curso o periodo no seleccionado.');
            return;
        }

        this.boletaService.updateBoletaNota(this.cursoId, this.periodoId, boleta.alumnoId, boleta.nota).subscribe({
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
        if (!this.cursoId || !this.periodoId) {
            this.showError('Seleccione curso y periodo para eliminar.');
            return;
        }

        if (confirm('¿Está seguro de que desea eliminar las boletas para este curso y periodo?')) {
            this.loading = true;
            this.boletaService.deleteBoletas(this.cursoId, this.periodoId).subscribe({
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
