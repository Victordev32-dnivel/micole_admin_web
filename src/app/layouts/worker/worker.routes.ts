import { Routes } from '@angular/router';
import { StudentListComponent } from './components/alumnos/student-list/student-list.component';
import { MatriculasListComponent } from './components/matriculas/matriculas-list/matriculas-list.component';
import { WorkerLayoutComponent } from './worker-layout/worker-layout.component';
import { ComunicadosListadoComponent } from './components/comunicados/lista-comunicados/comunicado-form.component';
import { TarjetasComponent } from './components/tarjetas/tarjetas-list/tarjetas.component';
import { AsistenciasComponent } from './components/asistencias/asistencias-list/asistencias-list.component';
import { NotasComponent } from './components/notas/lista-nota/notas.component';
import { ApoderadoListComponent } from './components/apoderado/apoderado-list/apoderado-list.component';
import { ListaGeneralComponent } from './components/salones/lista-general/lista-general.component';
import {SalidasListComponent } from './components/salidas/salidas-list.component';

export const WORKER_ROUTES: Routes = [
  {
    path: '',
    component: WorkerLayoutComponent,
    children: [
      { path: 'alumnos', component: StudentListComponent },
      { path: 'matriculas', component: MatriculasListComponent },
      { path: 'asistencias', component: AsistenciasComponent },
      { path: 'comunicados', component: ComunicadosListadoComponent },
      { path: 'tarjetas', component: TarjetasComponent },
      { path: 'notas', component: NotasComponent },
      { path: 'apoderado', component: ApoderadoListComponent },  
      { path: 'salones', component: ListaGeneralComponent },
      { path: 'salidas', component: SalidasListComponent },
    ],
  },
];
