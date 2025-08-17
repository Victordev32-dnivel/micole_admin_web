import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarSalonesComponent } from './eliminar-salones.component';

describe('EliminarSalonesComponent', () => {
  let component: EliminarSalonesComponent;
  let fixture: ComponentFixture<EliminarSalonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarSalonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarSalonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
