import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarNivelesComponent } from './eliminar-niveles.component';

describe('EliminarNivelesComponent', () => {
  let component: EliminarNivelesComponent;
  let fixture: ComponentFixture<EliminarNivelesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarNivelesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarNivelesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
