import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProfeService } from '../../../../services/profe.service';
import { UserService } from '../../../../services/UserData';
import { ProfeDialogComponent } from './profe-dialog/profe-dialog.component';

@Component({
    selector: 'app-profesores',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './profesores.component.html',
    styleUrls: ['./profesores.component.css']
})
export class ProfesoresComponent implements OnInit {
    profesores: any[] = [];
    loading: boolean = true;
    error: string = '';
    colegioId: number | null = null;
    displayedColumns: string[] = ['id', 'nombreCompleto', 'actions'];

    constructor(
        private profeService: ProfeService,
        private userService: UserService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        const userData = this.userService.getUserData();
        if (userData && userData.colegio) {
            this.colegioId = userData.colegio;
            this.loadProfesores();
        } else {
            this.error = 'No se encontró información del colegio.';
            this.loading = false;
        }
    }

    loadProfesores(): void {
        if (!this.colegioId) return;

        this.loading = true;
        this.profeService.getProfesores(this.colegioId).subscribe({
            next: (data: any[]) => {
                this.profesores = data;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error cargando profesores', err);
                this.error = 'Error al cargar la lista de profesores.';
                this.loading = false;
            }
        });
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ProfeDialogComponent, {
            width: '600px',
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && this.colegioId) {
                const newProfe = { ...result, idColegio: this.colegioId };
                this.profeService.createProfe(newProfe).subscribe({
                    next: () => {
                        this.showSnackBar('Profesor creado exitosamente');
                        this.loadProfesores();
                    },
                    error: (err) => {
                        console.error('Error creando profesor', err);
                        this.showSnackBar('Error al crear profesor');
                    }
                });
            }
        });
    }

    openEditDialog(profe: any): void {
        // Fetch full details first to populate the form correctly? 
        // Or can we use what we have? The list usually just has basic info.
        // We should fetch details first to ensure we have phone, document, etc.
        this.profeService.getProfeDetail(profe.id).subscribe({
            next: (fullProfe) => {
                const dialogRef = this.dialog.open(ProfeDialogComponent, {
                    width: '600px',
                    data: { mode: 'edit', profe: fullProfe }
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        // API Update expects: contrasena, names, surnames, genero, telefono, idColegio
                        const updatePayload = {
                            ...result,
                            idColegio: this.colegioId
                        };
                        // Remove numeroDocumento if it's there, as API might not want it on update
                        // delete updatePayload.numeroDocumento;

                        this.profeService.updateProfe(profe.id, updatePayload).subscribe({
                            next: () => {
                                this.showSnackBar('Profesor actualizado exitosamente');
                                this.loadProfesores();
                            },
                            error: (err) => {
                                console.error('Error actualizando profesor', err);
                                this.showSnackBar('Error al actualizar profesor');
                            }
                        });
                    }
                });
            },
            error: (err) => {
                console.error('Error obteniendo detalles', err);
                this.showSnackBar('Error al obtener detalles del profesor');
            }
        });
    }

    openViewDialog(profe: any): void {
        this.profeService.getProfeDetail(profe.id).subscribe({
            next: (fullProfe) => {
                this.dialog.open(ProfeDialogComponent, {
                    width: '600px',
                    data: { mode: 'view', profe: fullProfe }
                });
            },
            error: (err) => {
                console.error('Error obteniendo detalles', err);
                this.showSnackBar('Error al obtener detalles del profesor');
            }
        });
    }

    deleteProfe(profe: any): void {
        if (confirm(`¿Está seguro de eliminar al profesor ${profe.nombreCompleto}?`)) {
            this.profeService.deleteProfe(profe.id).subscribe({
                next: () => {
                    this.showSnackBar('Profesor eliminado exitosamente');
                    this.loadProfesores();
                },
                error: (err) => {
                    console.error('Error eliminando profesor', err);
                    this.showSnackBar('Error al eliminar profesor');
                }
            });
        }
    }

    private showSnackBar(message: string): void {
        this.snackBar.open(message, 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }

    openAssignCoursesDialog(profe: any): void {
        import('./assign-courses-dialog/assign-courses-dialog.component').then(component => {
            const dialogRef = this.dialog.open(component.AssignCoursesDialogComponent, {
                width: '600px',
                data: { profe: profe, colegioId: this.colegioId }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.profeService.assignCoursesToProfe(profe.id, result).subscribe({
                        next: () => {
                            this.showSnackBar('Cursos asignados exitosamente');
                        },
                        error: (err) => {
                            console.error('Error asignando cursos', err);
                            this.showSnackBar('Error al asignar cursos');
                        }
                    });
                }
            });
        });

    }
}

