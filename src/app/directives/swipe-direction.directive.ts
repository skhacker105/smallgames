import { Directive, ElementRef, Renderer2, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appSwipeDirection]',
  standalone: true
})
export class SwipeDirectionDirective {
  private startX = 0;
  private startY = 0;
  private threshold = 50; // Minimum distance to qualify as a swipe

  @Output() swipe = new EventEmitter<string>();

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    this.detectSwipe(deltaX, deltaY);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    this.detectSwipe(deltaX, deltaY);
  }

  private detectSwipe(deltaX: number, deltaY: number): void {
    if (Math.abs(deltaX) > this.threshold || Math.abs(deltaY) > this.threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal Swipe
        this.swipe.emit(deltaX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        // Vertical Swipe
        this.swipe.emit(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }
  }
}
