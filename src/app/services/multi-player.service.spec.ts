import { TestBed } from '@angular/core/testing';

import { MultiPlayerService } from './multi-player.service';

describe('MultiPlayerService', () => {
  let service: MultiPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultiPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
