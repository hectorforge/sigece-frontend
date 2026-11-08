import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorAulaList } from './tutor-aula-list';

describe('TutorAulaList', () => {
  let component: TutorAulaList;
  let fixture: ComponentFixture<TutorAulaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorAulaList],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorAulaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
