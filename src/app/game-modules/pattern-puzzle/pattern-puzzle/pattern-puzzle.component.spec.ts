import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternPuzzleComponent } from './pattern-puzzle.component';

describe('PatternPuzzleComponent', () => {
  let component: PatternPuzzleComponent;
  let fixture: ComponentFixture<PatternPuzzleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatternPuzzleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatternPuzzleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
