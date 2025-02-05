import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeerConnetionComponent } from './peer-connetion.component';

describe('PeerConnetionComponent', () => {
  let component: PeerConnetionComponent;
  let fixture: ComponentFixture<PeerConnetionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeerConnetionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PeerConnetionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
