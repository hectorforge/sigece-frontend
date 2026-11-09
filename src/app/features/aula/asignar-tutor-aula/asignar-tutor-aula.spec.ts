import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarTutorAula } from './asignar-tutor-aula';

describe('AsignarTutorAula', () => {
  let component: AsignarTutorAula;
  let fixture: ComponentFixture<AsignarTutorAula>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarTutorAula],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarTutorAula);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
