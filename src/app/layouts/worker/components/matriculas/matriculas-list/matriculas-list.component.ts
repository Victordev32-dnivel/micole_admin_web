import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AddMatriculaDialogComponent } from '../add-matricula/add-matricula.component';
import { EditMatriculaDialogComponent } from '../edit-matricula/edit-matricula.component';
import { ConfirmationDialogComponent } from '../../alumnos/confirmation-delete/confirmation-dialog.component';

@Component({
  selector: 'app-matriculas-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './matriculas-list.component.html',
  styleUrls: ['./matriculas-list.component.css']
})
export class MatriculasListComponent {
  matriculasForm: FormGroup;
  matriculas = [
    { section: 'Sec-101', student: 'Juan Pérez', status: 'Activo', actions: '' },
    { section: 'Sec-102', student: 'María Gómez', status: 'Inactivo', actions: '' },
    { section: 'Sec-103', student: 'Pedro López', status: 'Activo', actions: '' }
  ];
  filteredMatriculas = [...this.matriculas];

  constructor(private fb: FormBuilder, public dialog: MatDialog) {
    this.matriculasForm = this.fb.group({
      // Sin searchTerm ya que no hay búsqueda
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddMatriculaDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.matriculas.push(result);
        this.filteredMatriculas = [...this.matriculas];
      }
    });
  }

  openEditDialog(matricula: any): void {
    const dialogRef = this.dialog.open(EditMatriculaDialogComponent, {
      width: '400px',
      data: matricula
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.matriculas.findIndex(m => m.section === result.section);
        if (index !== -1) {
          this.matriculas[index] = result;
          this.filteredMatriculas = [...this.matriculas];
        }
      }
    });
  }

  confirmDelete(section: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: '¿Estás seguro de eliminar esta matrícula?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteMatricula(section);
      }
    });
  }

  deleteMatricula(section: string): void {
    this.matriculas = this.matriculas.filter(m => m.section !== section);
    this.filteredMatriculas = [...this.matriculas];
  }
}