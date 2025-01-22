import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameDashboardIconComponent } from './game-dashboard-icon.component';

describe('GameDashboardIconComponent', () => {
  let component: GameDashboardIconComponent;
  let fixture: ComponentFixture<GameDashboardIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameDashboardIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GameDashboardIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
