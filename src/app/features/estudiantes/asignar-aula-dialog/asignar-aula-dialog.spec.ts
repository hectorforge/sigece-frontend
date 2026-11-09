import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarAulaDialog } from './asignar-aula-dialog';

describe('AsignarAulaDialog', () => {
  let component: AsignarAulaDialog;
  let fixture: ComponentFixture<AsignarAulaDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarAulaDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarAulaDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
