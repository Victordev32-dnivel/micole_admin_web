import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AddAsistenciaDialogComponent } from '../add-asistencia/add-asistencia.component';
import { EditAsistenciaDialogComponent } from '../edit-asistencia/edit-asistencia.component';
import { ConfirmationDialogComponent } from '../../alumnos/confirmation-delete/confirmation-dialog.component';

@Component({
  selector: 'app-asistencias-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './asistencias-list.component.html',
  styleUrls: ['./asistencias-list.component.css']
})
export class AsistenciasListComponent {
  asistenciasForm: FormGroup;
  asistencias = [
    { section: 'Sec-101', schedule: '08:00-10:00', type: 'Presencial', tolerance: '15 min', actions: '' },
    { section: 'Sec-102', schedule: '10:00-12:00', type: 'Virtual', tolerance: '10 min', actions: '' },
    { section: 'Sec-103', schedule: '14:00-16:00', type: 'Presencial', tolerance: '20 min', actions: '' }
  ];
  filteredAsistencias = [...this.asistencias];

  constructor(private fb: FormBuilder, public dialog: MatDialog) {
    this.asistenciasForm = this.fb.group({
      // Sin searchTerm ya que no hay búsqueda
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddAsistenciaDialogComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.asistencias.push(result);
        this.filteredAsistencias = [...this.asistencias];
      }
    });
  }

  openEditDialog(asistencia: any): void {
    const dialogRef = this.dialog.open(EditAsistenciaDialogComponent, {
      width: '400px',
      data: asistencia
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.asistencias.findIndex(a => a.section === result.section);
        if (index !== -1) {
          this.asistencias[index] = result;
          this.filteredAsistencias = [...this.asistencias];
        }
      }
    });
  }

  confirmDelete(section: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { message: '¿Estás seguro de eliminar este horario de asistencia?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteAsistencia(section);
      }
    });
  }

  deleteAsistencia(section: string): void {
    this.asistencias = this.asistencias.filter(a => a.section !== section);
    this.filteredAsistencias = [...this.asistencias];
  }
}