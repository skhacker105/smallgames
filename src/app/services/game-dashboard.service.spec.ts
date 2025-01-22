import { TestBed } from '@angular/core/testing';

import { GameDashboardService } from './game-dashboard.service';

describe('GameDashboardService', () => {
  let service: GameDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
