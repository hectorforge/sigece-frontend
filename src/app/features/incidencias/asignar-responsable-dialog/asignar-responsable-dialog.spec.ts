import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarResponsableDialog } from './asignar-responsable-dialog';

describe('AsignarResponsableDialog', () => {
  let component: AsignarResponsableDialog;
  let fixture: ComponentFixture<AsignarResponsableDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarResponsableDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarResponsableDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
