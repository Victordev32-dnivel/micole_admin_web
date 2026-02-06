import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PeriodoService, Periodo } from '../../../../../services/periodo.service';
import { PeriodoFormComponent } from '../periodo-form/periodo-form.component';
import { AuthService } from '../../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-periodo-list',
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
        <h1>Periodos</h1>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nuevo Periodo
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

          <!-- Nombre Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let element"> {{element.nombre}} </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button color="primary" (click)="openDialog(element)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deletePeriodo(element)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="3">No hay periodos registrados</td>
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
export class PeriodoListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'nombre', 'actions'];
  dataSource: Periodo[] = [];
  loading = false;

  constructor(
    private periodoService: PeriodoService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const colegioId = this.authService.getColegioId();
    if (!colegioId) {
      console.error('No colegioId found');
      return;
    }

    this.loading = true;
    this.periodoService.getByColegio(colegioId).subscribe({
      next: (data) => {
        this.dataSource = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading periodos:', err);
        this.loading = false;
        this.snackBar.open('Error al cargar los periodos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openDialog(periodo?: Periodo): void {
    const dialogRef = this.dialog.open(PeriodoFormComponent, {
      width: '400px',
      data: periodo || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  deletePeriodo(periodo: Periodo): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el periodo "${periodo.nombre}"?`)) {
      this.periodoService.delete(periodo.id).subscribe({
        next: () => {
          this.snackBar.open('Periodo eliminado correctamente', 'Cerrar', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting periodo:', err);
          this.snackBar.open('Error al eliminar el periodo', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
