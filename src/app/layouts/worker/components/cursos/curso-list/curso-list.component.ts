import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CursoService } from '../../../../../services/curso.service';
import { UserService } from '../../../../../services/UserData';
import { CreateCursoComponent } from '../create-curso/create-curso.component';
import { EnrollStudentDialogComponent } from '../enroll-student-dialog/enroll-student-dialog.component';

@Component({
    selector: 'app-curso-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        MatDialogModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './curso-list.component.html',
    styleUrls: ['./curso-list.component.css']
})
export class CursoListComponent implements OnInit {
    cursos: any[] = [];
    displayedColumns: string[] = ['titulo', 'descripcion', 'salon', 'acciones'];
    colegioId: number = 0;
    loading: boolean = true;

    salones: any[] = [];
    selectedSalonId: number | null = null;

    constructor(
        private cursoService: CursoService,
        private userService: UserService,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.userService.userData$.subscribe(userData => {
            if (userData) {
                this.colegioId = userData.colegio;
                if (this.colegioId) {
                    this.loadSalones();
                }
            }
        });
    }

    loadSalones() {
        this.cursoService.getSalones(this.colegioId).subscribe({
            next: (response: any) => {
                if (Array.isArray(response)) {
                    this.salones = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    this.salones = response.data;
                } else {
                    this.salones = [];
                }

                // Auto-select first salon if available
                if (this.salones.length > 0) {
                    this.selectedSalonId = this.salones[0].id;
                    this.loadCursos();
                } else {
                    this.loading = false; // Stop loading if no filter available
                }
            },
            error: (err) => {
                console.error('Error loading salones', err);
                this.loading = false;
            }
        });
    }

    onSalonChange(event: any) {
        this.selectedSalonId = event.value;
        this.loadCursos();
    }

    loadCursos() {
        if (!this.selectedSalonId) return;

        this.loading = true;
        this.cursoService.getCursosPorSalon(this.selectedSalonId).subscribe({
            next: (data: any) => {
                // Handle potential array wrapping {data: [...]} 
                if (Array.isArray(data)) {
                    this.cursos = data;
                } else if (data && data.data && Array.isArray(data.data)) {
                    this.cursos = data.data;
                } else {
                    this.cursos = [];
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error al cargar cursos', err);
                this.snackBar.open('Error al cargar la lista de cursos', 'Cerrar', { duration: 3000 });
                this.cursos = []; // Clear list on error
                this.loading = false;
            }
        });
    }

    crearCurso() {
        const dialogRef = this.dialog.open(CreateCursoComponent, {
            width: '600px',
            data: {
                isEditing: false,
                salonId: this.selectedSalonId,
                salones: this.salones
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadCursos();
            }
        });
    }

    registrarAlumnos() {
        if (!this.selectedSalonId) {
            this.snackBar.open('Debe seleccionar un salón primero', 'Cerrar', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(EnrollStudentDialogComponent, {
            width: '500px',
            data: {
                salonId: this.selectedSalonId
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Optionally reload or show success message if not handled in dialog
            }
        });
    }

    editarCurso(curso: any) {
        const dialogRef = this.dialog.open(CreateCursoComponent, {
            width: '600px',
            data: {
                isEditing: true,
                curso: curso,
                salones: this.salones
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadCursos();
            }
        });
    }

    eliminarCurso(curso: any) {
        // We can't use window.confirm if requirement is strictly "MODALS". 
        // I will use a TemplateRef for a simple modal here or a separate component.
        // For now, let's assume I can use a TemplateRef if I add it to HTML.
        // Actually, I'll create a separate ConfirmDialogComponent on the fly? 
        // To be safe and compliant with "strictly modals", I will implement a custom dialog here.

        // For now, I will use a simple "Are you sure?" dialog implemented via TemplateRef in HTML
        // But since I can't easily reference a template that doesn't exist yet, I'll update HTML next.
        // So here I'll assume `this.deleteDialog` is available or similar.
        // BETTER: Create a simple confirmation dialog component in the next step and use it here.
        // so I will leave this method to be updated in a moment or stub it.

        // Let's use a temporary placeholder that I will replace when I create the confirm component.
        this.openDeleteDialog(curso);
    }

    openDeleteDialog(curso: any) {
        // Logic to open delete modal
        // This requires a component. I will create 'DeleteConfirmationComponent' inside the curso-list directory.
        import('./delete-confirmation/delete-confirmation.component').then(m => {
            const dialogRef = this.dialog.open(m.DeleteConfirmationComponent, {
                width: '400px',
                data: { curso: curso }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.performDelete(curso.id);
                }
            });
        });
    }

    performDelete(id: number) {
        this.cursoService.deleteCurso(id).subscribe({
            next: () => {
                this.snackBar.open('Curso eliminado exitosamente', 'Cerrar', { duration: 3000 });
                this.loadCursos();
            },
            error: (err) => {
                console.error('Error al eliminar curso', err);
                this.snackBar.open('Error al eliminar el curso', 'Cerrar', { duration: 3000 });
            }
        });
    }
}
