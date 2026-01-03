import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfeService } from '../../../../services/profe.service';
import { UserService } from '../../../../services/UserData';

interface ProfeCurso {
    usuarioId: number;
    cursoId: number;
    curso: {
        id: number;
        titulo: string;
        descripcion: string;
        salonId: number;
    };
}

@Component({
    selector: 'app-mis-cursos',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './mis-cursos.component.html',
    styleUrls: ['./mis-cursos.component.css']
})
export class MisCursosComponent implements OnInit {
    cursos: ProfeCurso[] = [];
    loading: boolean = true;
    error: string = '';
    usuarioId: number | null = null;
    displayedColumns: string[] = ['id', 'titulo', 'descripcion'];

    constructor(
        private profeService: ProfeService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        const userData = this.userService.getUserData();
        if (userData && userData.id) {
            this.usuarioId = userData.id;
            this.loadMisCursos();
        } else {
            this.error = 'No se encontró información del usuario.';
            this.loading = false;
        }
    }

    loadMisCursos(): void {
        if (!this.usuarioId) return;

        this.loading = true;
        this.profeService.getMisCursos(this.usuarioId).subscribe({
            next: (data: ProfeCurso[]) => {
                this.cursos = data;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error cargando cursos', err);
                this.error = 'Error al cargar la lista de cursos.';
                this.loading = false;
            }
        });
    }

    refresh(): void {
        this.loadMisCursos();
    }
}
