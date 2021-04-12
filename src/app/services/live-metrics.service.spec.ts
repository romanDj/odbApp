import { TestBed } from '@angular/core/testing';

import { LiveMetricsService } from './live-metrics.service';

describe('LiveMetricsService', () => {
  let service: LiveMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
