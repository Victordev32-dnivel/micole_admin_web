import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../services/UserData';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-academia-matricula',
    standalone: true,
    imports: [
        CommonModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        MatTableModule,
        MatIconModule,
        MatCardModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        FormsModule
    ],
    template: `
    <div class="page-container">
      <mat-card>
        <div class="header">
          <h2>Matrícula Academia (Pase de Alumnos)</h2>
        </div>

        <div class="filters">
            <mat-form-field appearance="outline">
                <mat-label>Seleccionar Colegio Origen</mat-label>
                <mat-select [(value)]="selectedColegioId" (selectionChange)="onColegioChange()">
                    <mat-option *ngFor="let colegio of colegios" [value]="colegio.id">
                        {{ colegio.nombre }}
                    </mat-option>
                </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="ml-2" style="margin-left: 16px;">
                <mat-label>Seleccionar Salón Academia Destino</mat-label>
                <mat-select [(value)]="selectedAcademiaSalonId">
                    <mat-option *ngFor="let salon of academiaSalones" [value]="salon.id">
                        {{ salon.nombre }}
                    </mat-option>
                </mat-select>
            </mat-form-field>
        </div>

        <div class="table-container" *ngIf="alumnos.length > 0; else noData">
            <table mat-table [dataSource]="alumnos" class="full-width-table">
                <!-- Nombre Column -->
                <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef> Nombre Completo </th>
                    <td mat-cell *matCellDef="let element"> {{element.nombre_completo}} </td>
                </ng-container>

                <!-- DNI Column -->
                <ng-container matColumnDef="dni">
                    <th mat-header-cell *matHeaderCellDef> DNI </th>
                    <td mat-cell *matCellDef="let element"> {{element.numero_documento}} </td>
                </ng-container>

                <!-- Grado Column -->
                <ng-container matColumnDef="grado">
                    <th mat-header-cell *matHeaderCellDef> Grado Actual </th>
                    <td mat-cell *matCellDef="let element"> {{element.grado}} </td>
                </ng-container>

                <!-- Salon Column -->
                <ng-container matColumnDef="salon">
                    <th mat-header-cell *matHeaderCellDef> Salón Actual </th>
                    <td mat-cell *matCellDef="let element"> {{element.salon}} </td>
                </ng-container>

                <!-- Academia Column -->
                <ng-container matColumnDef="academia">
                    <th mat-header-cell *matHeaderCellDef> Academia </th>
                    <td mat-cell *matCellDef="let element">
                        <span [style.color]="element.academia ? 'green' : 'red'" [style.fontWeight]="'bold'">
                            {{element.academia ? 'SÍ' : 'NO'}}
                        </span>
                    </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef> Acciones </th>
                    <td mat-cell *matCellDef="let element">
                        <button mat-raised-button color="accent" *ngIf="!element.academia" (click)="matricular(element)" [disabled]="!selectedAcademiaSalonId">
                            <mat-icon>school</mat-icon> Matricular
                        </button>
                        <button mat-raised-button color="warn" *ngIf="element.academia" (click)="desmatricular(element)">
                            <mat-icon>person_remove</mat-icon> Desmatricular
                        </button>
                    </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
        </div>

        <ng-template #noData>
            <div class="no-data" *ngIf="selectedColegioId">
                <p *ngIf="loading">Cargando alumnos...</p>
                <p *ngIf="!loading">No hay alumnos en el colegio seleccionado.</p>
            </div>
            <div class="no-data" *ngIf="!selectedColegioId">
                <p>Seleccione un colegio para ver sus alumnos.</p>
            </div>
        </ng-template>

        <div class="loading-overlay" *ngIf="loading">
             <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        </div>

      </mat-card>
    </div>
  `,
    styles: [`
    .page-container { padding: 20px; }
    .header { margin-bottom: 20px; }
    .filters { margin-bottom: 20px; display: flex; align-items: center; } /* added flex for inline inputs */
    .full-width-table { width: 100%; }
    .no-data { text-align: center; padding: 20px; color: #666; }
    .loading-overlay { 
      position: absolute; top:0; left:0; width:100%; height:100%; 
      background: rgba(255,255,255,0.7); display: flex; 
      align-items: center; justify-content: center; z-index: 1000;
    }
    mat-card { position: relative; min-height: 200px; }
  `]
})
export class AcademiaMatriculaComponent implements OnInit {
    colegios: any[] = [];
    alumnos: any[] = [];
    academiaSalones: any[] = []; // List of academy classrooms
    selectedColegioId: number | null = null;
    selectedAcademiaSalonId: number | null = null; // Selected academy classroom
    loading = false;
    displayedColumns: string[] = ['nombre', 'dni', 'grado', 'salon', 'academia', 'actions'];
    private apiBase = '/api';

    constructor(
        private http: HttpClient,
        private userService: UserService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.loadColegios();
        this.loadAcademiaSalones();
    }

    getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Authorization': `Bearer ${this.userService.getJwtToken()}`,
            'Content-Type': 'application/json'
        });
    }

    loadColegios() {
        this.http.get<any>(`${this.apiBase}/colegio/lista`, { headers: this.getHeaders() })
            .subscribe({
                next: (res) => {
                    this.colegios = res.data || [];
                },
                error: (err) => console.error('Error loading colleges', err)
            });
    }

    loadAcademiaSalones() {
        // ID 7 is hardcoded for Academia as per requirement
        const academiaId = 7;
        this.http.get<any>(`${this.apiBase}/salon/colegio/lista/${academiaId}`, { headers: this.getHeaders() })
            .subscribe({
                next: (res) => {
                    // The API returns the array directly, not inside a 'data' property based on the user's curl response
                    this.academiaSalones = res || [];
                },
                error: (err) => {
                    console.error('Error loading academy salons', err);
                    this.snackBar.open('Error al cargar salones de academia', 'Cerrar', { duration: 3000 });
                }
            });
    }

    onColegioChange() {
        if (this.selectedColegioId) {
            this.loading = true;
            this.alumnos = []; // Clear previous
            this.http.get<any>(`${this.apiBase}/alumno/colegio/${this.selectedColegioId}`, { headers: this.getHeaders() })
                .subscribe({
                    next: (res) => {
                        this.alumnos = res.data || [];
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Error loading students', err);
                        this.loading = false;
                        this.snackBar.open('Error al cargar alumnos', 'Cerrar', { duration: 3000 });
                    }
                });
        }
    }

    matricular(alumno: any) {
        if (!this.selectedAcademiaSalonId) {
            this.snackBar.open('Por favor seleccione un salón de academia destino', 'Cerrar', { duration: 3000 });
            return;
        }

        const selectedSalon = this.academiaSalones.find(s => s.id === this.selectedAcademiaSalonId);
        const salonName = selectedSalon ? selectedSalon.nombre : 'el salón seleccionado';

        if (!confirm(`¿Seguro que deseas matricular a ${alumno.nombre_completo} en ${salonName}?`)) {
            return;
        }

        this.loading = true;

        const body = {
            idAlumno: alumno.id,
            idSalon: this.selectedAcademiaSalonId
        };

        this.http.patch(`${this.apiBase}/alumno/matricula`, body, { headers: this.getHeaders(), responseType: 'text' })
            .subscribe({
                next: () => {
                    this.snackBar.open(`Alumno matriculado en ${salonName} exitosamente`, 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
                    this.loading = false;
                    // Update the local state to reflect the change immediately
                    alumno.academia = true;
                },
                error: (err) => {
                    console.error('Error matriculating', err);
                    this.loading = false;
                    // If responseType is text, err.error should be the text body. 
                    // Fallback to a generic message if empty.
                    const errorMessage = err.error || 'Error al matricular alumno';
                    this.snackBar.open(errorMessage, 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
                }
            });
    }

    desmatricular(alumno: any) {
        if (!confirm(`¿Seguro que deseas desmatricular a ${alumno.nombre_completo} de la Academia?`)) {
            return;
        }

        this.loading = true;

        this.http.delete(`${this.apiBase}/alumno/matricula/${alumno.id}`, { headers: this.getHeaders(), responseType: 'text' })
            .subscribe({
                next: () => {
                    this.snackBar.open('Alumno desmatriculado de Academia exitosamente', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
                    this.loading = false;
                    // Update the local state
                    alumno.academia = false;
                },
                error: (err) => {
                    console.error('Error un-matriculating', err);
                    this.loading = false;
                    const errorMessage = err.error || 'Error al desmatricular alumno';
                    this.snackBar.open(errorMessage, 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
                }
            });
    }
}
