import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLoadingButton]',
  standalone: true
})
export class LoadingButtonDirective implements OnInit {
  @Input() appLoadingButton!: number; // Duration in seconds

  private originalContent!: string;
  private overlay!: HTMLElement;
  private spinner!: HTMLElement;
  private countdown!: HTMLElement;
  private interval?: any;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.originalContent = this.el.nativeElement.innerHTML;
  }

  startLoading() {
    this.createOverlay();
    let remainingTime = this.appLoadingButton;

    this.interval = setInterval(() => {
      remainingTime--;
      this.countdown.innerText = remainingTime.toString();

      if (remainingTime <= 0) {
        this.stopLoading();
      }
    }, 1000);
  }

  private createOverlay() {
    this.el.nativeElement.disabled = true;
    this.el.nativeElement.style.position = 'relative';

    // Overlay
    this.overlay = this.renderer.createElement('div');
    this.renderer.setStyle(this.overlay, 'position', 'absolute');
    this.renderer.setStyle(this.overlay, 'top', '0');
    this.renderer.setStyle(this.overlay, 'left', '0');
    this.renderer.setStyle(this.overlay, 'width', '100%');
    this.renderer.setStyle(this.overlay, 'height', '100%');
    this.renderer.setStyle(this.overlay, 'display', 'flex');
    this.renderer.setStyle(this.overlay, 'align-items', 'center');
    this.renderer.setStyle(this.overlay, 'justify-content', 'center');
    this.renderer.setStyle(this.overlay, 'background', 'rgba(255,255,255,0.8)');
    this.renderer.setStyle(this.overlay, 'border-radius', '4px');

    // Spinner
    this.spinner = this.renderer.createElement('mat-spinner');
    this.renderer.setAttribute(this.spinner, 'diameter', '24');

    // Countdown
    this.countdown = this.renderer.createElement('span');
    this.renderer.setStyle(this.countdown, 'position', 'absolute');
    this.renderer.setStyle(this.countdown, 'font-weight', 'bold');
    this.renderer.setStyle(this.countdown, 'color', '#333');
    this.countdown.innerText = this.appLoadingButton.toString();

    // Append elements
    this.renderer.appendChild(this.overlay, this.spinner);
    this.renderer.appendChild(this.overlay, this.countdown);
    this.renderer.appendChild(this.el.nativeElement, this.overlay);
  }

  stopLoading() {
    if (this.interval) clearInterval(this.interval);
    this.el.nativeElement.disabled = false;
    this.renderer.removeChild(this.el.nativeElement, this.overlay);
  }
}
