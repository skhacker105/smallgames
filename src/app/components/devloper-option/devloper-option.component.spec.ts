import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevloperOptionComponent } from './devloper-option.component';

describe('DevloperOptionComponent', () => {
  let component: DevloperOptionComponent;
  let fixture: ComponentFixture<DevloperOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevloperOptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DevloperOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
