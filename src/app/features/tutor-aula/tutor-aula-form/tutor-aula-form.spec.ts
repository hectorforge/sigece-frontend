import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorAulaForm } from './tutor-aula-form';

describe('TutorAulaForm', () => {
  let component: TutorAulaForm;
  let fixture: ComponentFixture<TutorAulaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorAulaForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorAulaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
