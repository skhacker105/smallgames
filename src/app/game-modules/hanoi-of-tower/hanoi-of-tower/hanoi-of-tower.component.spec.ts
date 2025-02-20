import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HanoiOfTowerComponent } from './hanoi-of-tower.component';

describe('HanoiOfTowerComponent', () => {
  let component: HanoiOfTowerComponent;
  let fixture: ComponentFixture<HanoiOfTowerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HanoiOfTowerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HanoiOfTowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
