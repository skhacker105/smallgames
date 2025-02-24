import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectingDotsComponent } from './connecting-dots.component';

describe('ConnectingDotsComponent', () => {
  let component: ConnectingDotsComponent;
  let fixture: ComponentFixture<ConnectingDotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectingDotsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectingDotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
