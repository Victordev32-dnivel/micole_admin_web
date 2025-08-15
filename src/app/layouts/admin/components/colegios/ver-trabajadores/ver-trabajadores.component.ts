import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-ver-trabajadores',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatToolbar],
  templateUrl: './ver-trabajadores.component.html',
  styleUrls: ['./ver-trabajadores.component.css'],
})
export class VerTrabajadoresComponent {
  displayedColumns: string[] = [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
    'actions',
  ];
  trabajadoresDesasignados: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<VerTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { colegioId: number; trabajadoresAsignados: any[] }
  ) {}

  onDesasignar(trabajador: any) {
    if (!this.trabajadoresDesasignados.includes(trabajador)) {
      this.trabajadoresDesasignados.push(trabajador);
    }
  }

  onRemove(trabajador: any) {
    this.trabajadoresDesasignados = this.trabajadoresDesasignados.filter((t) => t !== trabajador);
  }

  onConfirm() {
    this.dialogRef.close(this.trabajadoresDesasignados);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
