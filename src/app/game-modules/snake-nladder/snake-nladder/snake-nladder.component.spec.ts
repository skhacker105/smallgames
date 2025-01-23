import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnakeNLadderComponent } from './snake-nladder.component';

describe('SnakeNLadderComponent', () => {
  let component: SnakeNLadderComponent;
  let fixture: ComponentFixture<SnakeNLadderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SnakeNLadderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SnakeNLadderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
