import { Component, ViewChild, Inject } from '@angular/core';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { IUser } from '../../interfaces';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { SocketService } from '../../services/socket.service';
import { Camera, CameraResultType } from '@capacitor/camera';
import { BrowserQRCodeReader } from '@zxing/browser';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scan-user',
  standalone: true,
  imports: [MatIconModule, QRCodeModule, CommonModule],
  templateUrl: './scan-user.component.html',
  styleUrl: './scan-user.component.scss'
})
export class ScanUserComponent {
  @ViewChild('qrcode', { static: false }) qrcodeElement!: QRCodeComponent;

  scannedUser: IUser | null = null;
  scanError = '';
  localDataAsQRCodeText = '';
  @ViewChild('qrCode', { static: false }) qrCodeElement!: QRCodeComponent;

  constructor(
    public dialogRef: MatDialogRef<ScanUserComponent>,
    private userService: UserService,
    private socketService: SocketService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.localDataAsQRCodeText = JSON.stringify(this.userService.me);
  }

  async startScan() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri
      });

      const scannedText = await this.readQRCode(image.webPath!);
      if (scannedText) {
        const scannedUser: IUser = JSON.parse(scannedText) as IUser;
        const validationError = this.validateScannedUser(scannedUser);
        if (!validationError) this.scannedUser = scannedUser;
        this.scanError = validationError;
      }
    } catch (error) {
      this.scanError = 'Error scanning QR code. Please try again.';
      console.error('Error scanning QR code:', error);
    }
  }

  async readQRCode(webPath: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const codeReader = new BrowserQRCodeReader();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = webPath;

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Canvas rendering context not supported');
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          try {
            const qrCodeResult = await codeReader.decodeFromCanvas(canvas);
            resolve(qrCodeResult.getText());
          } catch (error) {
            reject(`Error scanning QR code: ${error}`);
          }
        };

        img.onerror = (error) => reject(`Error loading image: ${error}`);
      } catch (error) {
        reject(`Error scanning QR code: ${error}`);
      }
    });
  }

  validateScannedUser(scannedUser: IUser): string {
    if (scannedUser.userId === this.userService.me?.userId)
      return 'Invalid user selected'
    return '';
  }

  createAndSaveConnection() {
    if (!this.scannedUser) return;

    // const newUser = new ConnectedUser('client', this.scannedUser, this.socketService);
    this.dialogRef.close(this.scannedUser);
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
}
