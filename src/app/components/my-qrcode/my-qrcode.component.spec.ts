import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyQRCodeComponent } from './my-qrcode.component';

describe('MyQRCodeComponent', () => {
  let component: MyQRCodeComponent;
  let fixture: ComponentFixture<MyQRCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyQRCodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyQRCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
