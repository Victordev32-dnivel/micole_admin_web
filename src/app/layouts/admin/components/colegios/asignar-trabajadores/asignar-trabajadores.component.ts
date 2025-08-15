import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatToolbar } from "@angular/material/toolbar";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-asignar-trabajadores',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './asignar-trabajadores.component.html',
  styleUrls: ['./asignar-trabajadores.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AsignarTrabajadoresComponent {
  trabajadores: any[] = [];
  filteredTrabajadores: any[] = [];
  selectedTrabajadores: any[] = [];
  searchTermControl = new FormControl('');
  displayedColumns: string[] = [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'dni',
    'telefono',
    'actions',
  ];

  constructor(
    public dialogRef: MatDialogRef<AsignarTrabajadoresComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { colegioId: number }
  ) {
    this.trabajadores = this.simulateTrabajadores();
    this.filteredTrabajadores = [...this.trabajadores];
    this.searchTermControl.valueChanges.subscribe((value) => {
      this.filterTrabajadores(value || '');
    });
  }

  private simulateTrabajadores() {
    return [
      {
        id: 1,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        dni: '12345678',
        telefono: '987654321',
      },
      {
        id: 2,
        nombre: 'María',
        apellidoPaterno: 'López',
        apellidoMaterno: 'Martínez',
        dni: '87654321',
        telefono: '123456789',
      },
      {
        id: 3,
        nombre: 'Carlos',
        apellidoPaterno: 'Hernández',
        apellidoMaterno: 'Rodríguez',
        dni: '11223344',
        telefono: '555666777',
      },
      {
        id: 4,
        nombre: 'Ana',
        apellidoPaterno: 'González',
        apellidoMaterno: 'Sánchez',
        dni: '44332211',
        telefono: '444555666',
      },
      {
        id: 5,
        nombre: 'Luis',
        apellidoPaterno: 'Ramírez',
        apellidoMaterno: 'Torres',
        dni: '99887766',
        telefono: '333444555',
      },
      {
        id: 6,
        nombre: 'Sofía',
        apellidoPaterno: 'Flores',
        apellidoMaterno: 'Ríos',
        dni: '66554433',
        telefono: '222333444',
      },
      {
        id: 7,
        nombre: 'Miguel',
        apellidoPaterno: 'Cruz',
        apellidoMaterno: 'Morales',
        dni: '55443322',
        telefono: '111222333',
      },
      {
        id: 8,
        nombre: 'Elena',
        apellidoPaterno: 'Ortiz',
        apellidoMaterno: 'Vargas',
        dni: '33221100',
        telefono: '000111222',
      },
      {
        id: 9,
        nombre: 'David',
        apellidoPaterno: 'Reyes',
        apellidoMaterno: 'Guzmán',
        dni: '22110099',
        telefono: '999000111',
      },
      {
        id: 10,
        nombre: 'Laura',
        apellidoPaterno: 'Mendoza',
        apellidoMaterno: 'Castillo',
        dni: '11009988',
        telefono: '888999000',
      },
    ];
  }

  filterTrabajadores(term: string) {
    term = term.toLowerCase();
    this.filteredTrabajadores = this.trabajadores.filter(
      (trabajador) =>
        trabajador.nombre.toLowerCase().includes(term) ||
        trabajador.apellidoPaterno.toLowerCase().includes(term) ||
        trabajador.apellidoMaterno.toLowerCase().includes(term) ||
        trabajador.dni.toLowerCase().includes(term)
    );
  }

  onAsignar(trabajador: any) {
    if (!this.selectedTrabajadores.includes(trabajador)) {
      this.selectedTrabajadores.push(trabajador);
    }
  }

  onRemove(selectedTrabajador: any) {
    this.selectedTrabajadores = this.selectedTrabajadores.filter(
      (t) => t !== selectedTrabajador
    );
  }

  onConfirm() {
    // Por ahora, solo cierra el modal
    this.dialogRef.close(this.selectedTrabajadores);
  }

  onCancel() {
    this.dialogRef.close();
  }
}
