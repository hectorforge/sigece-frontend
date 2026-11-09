import { TestBed } from '@angular/core/testing';
import { ReporteApi } from './reporte-api';

describe('ReporteApi', () => {
  let service: ReporteApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
