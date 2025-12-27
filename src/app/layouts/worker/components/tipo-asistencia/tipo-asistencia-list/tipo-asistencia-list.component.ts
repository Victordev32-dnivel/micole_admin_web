import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TipoAsistenciaService, TipoAsistencia } from '../../../../../services/tipo-asistencia.service';
import { TipoAsistenciaFormComponent } from '../tipo-asistencia-form/tipo-asistencia-form.component';

@Component({
  selector: 'app-tipo-asistencia-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Tipos de Asistencia</h1>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nuevo Tipo
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="table-container" *ngIf="!loading">
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z8">

          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef> ID </th>
            <td mat-cell *matCellDef="let element"> {{element.id}} </td>
          </ng-container>

          <!-- Tipo Column -->
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let element"> {{element.tipo}} </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" (click)="openDialog(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteTipo(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="3">No hay datos para mostrar</td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
  `]
})
export class TipoAsistenciaListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'tipo', 'actions'];
  dataSource: TipoAsistencia[] = [];
  loading = false;

  constructor(
    private tipoAsistenciaService: TipoAsistenciaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.tipoAsistenciaService.getAll().subscribe({
      next: (data) => {
        this.dataSource = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading types:', err);
        this.loading = false;
        this.snackBar.open('Error al cargar los tipos de asistencia', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openDialog(tipo?: TipoAsistencia): void {
    const dialogRef = this.dialog.open(TipoAsistenciaFormComponent, {
      width: '400px',
      data: tipo || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  deleteTipo(tipo: TipoAsistencia): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el tipo de asistencia "${tipo.tipo}"?`)) {
      this.tipoAsistenciaService.delete(tipo.id).subscribe({
        next: () => {
          this.snackBar.open('Tipo de asistencia eliminado correctamente', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          console.error('Error creating:', err);
          this.snackBar.open('Error al eliminar el tipo de asistencia', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
