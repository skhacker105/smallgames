import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayCardMemorizeComponent } from './play-card-memorize.component';

describe('PlayCardMemorizeComponent', () => {
  let component: PlayCardMemorizeComponent;
  let fixture: ComponentFixture<PlayCardMemorizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayCardMemorizeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlayCardMemorizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
