import { TestBed } from '@angular/core/testing';

import { ConfigOdbService } from './config-odb.service';

describe('ConfigOdbService', () => {
  let service: ConfigOdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigOdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
