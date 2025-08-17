import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarSeccionesComponent } from './eliminar-secciones.component';

describe('EliminarSeccionesComponent', () => {
  let component: EliminarSeccionesComponent;
  let fixture: ComponentFixture<EliminarSeccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarSeccionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarSeccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
