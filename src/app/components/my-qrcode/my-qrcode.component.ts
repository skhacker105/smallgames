import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { UserService } from '../../services/user.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

@Component({
  selector: 'app-my-qrcode',
  standalone: true,
  imports: [CommonModule, QRCodeModule, MatIconModule],
  templateUrl: './my-qrcode.component.html',
  styleUrl: './my-qrcode.component.scss'
})
export class MyQRCodeComponent implements OnInit {

  userString = '';
  userName = '';
  @ViewChild('qrCode', { static: false }) qrCodeElement!: QRCodeComponent;

  constructor(public userService: UserService, public dialogRef: MatDialogRef<MyQRCodeComponent>) { }

  ngOnInit(): void {
    if (!this.userService.me) return;

    this.userString = JSON.stringify(this.userService.me);
    this.userName = this.userService.me.userName;
  }

  downloadQRCode(qrCodeElement: QRCodeComponent) {
    setTimeout(() => { // Ensure QR code is fully rendered
      const qrCanvas = qrCodeElement.qrcElement.nativeElement.querySelector('canvas');

      if (qrCanvas) {
        const imageUrl = qrCanvas.toDataURL('image/png'); // Convert to PNG format

        // Create a download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'small-games.user.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 100); // Delay to allow QR code rendering
  }

  editMeUser(): void {
    this.userService.askForMeUser()
    .afterClosed()
    .pipe(take(1))
    .subscribe(userName => {
      if (!userName || userName === this.userName) return;

      this.userName = userName;
      this.userService.setMeUser(userName);
    });
  }
}
