import { Routes } from '@angular/router';
import { StudentListComponent } from './components/alumnos/student-list/student-list.component';
import { MatriculasListComponent } from './components/matriculas/matriculas-list/matriculas-list.component';
import { AsistenciasListComponent } from './components/asistencias/asistencias-list/asistencias-list.component';
import { WorkerLayoutComponent } from './worker-layout/worker-layout.component';
import { ComunicadoFormComponent } from './components/comunicados/comunicado-form/comunicado-form.component';

export const WORKER_ROUTES: Routes = [
  {
    path: '',
    component: WorkerLayoutComponent,
    children: [
      { path: 'alumnos', component: StudentListComponent },
      { path: 'matriculas', component: MatriculasListComponent },
      { path: 'asistencias', component: AsistenciasListComponent },
      { path: 'comunicados', component: ComunicadoFormComponent}
    ]
  }
];