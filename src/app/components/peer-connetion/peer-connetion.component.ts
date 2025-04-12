import { ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Camera, CameraResultType } from '@capacitor/camera';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { P2PClient, P2PServer } from '../../classes';
import { Subject, combineLatest, skip, takeUntil } from 'rxjs';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { TabType } from '../../types';
// import { ConnectedUser } from '../../classes';
import { UserService } from '../../services/user.service';
import { IUser } from '../../interfaces';
import { SocketService } from '../../services/socket.service';

interface ITab {
  type: TabType;
  header: string;
  fileName: string;
}

@Component({
  selector: 'app-peer-connetion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTabsModule, QRCodeModule, MatStepperModule, NgxSpinnerModule],
  templateUrl: './peer-connetion.component.html',
  styleUrl: './peer-connetion.component.scss'
})
export class PeerConnetionComponent implements OnDestroy {

  @ViewChild('qrcodeServer', { static: false }) qrcodeServerElement!: QRCodeComponent;
  @ViewChild('qrcodePlayer', { static: false }) qrcodePlayerElement!: QRCodeComponent;

  componentIsActive = new Subject<boolean>();
  divider = '________';
  scanError = '';
  message: string = '';
  messages: string[] = [];

  tabs: ITab[] = [
    {
      type: 'server',
      header: 'Host',
      fileName: 'qr1.png'
    },
    {
      type: 'client',
      header: 'Player',
      fileName: 'qr2.png'
    }
  ];
  objServer?: P2PServer;
  objClient?: P2PClient;
  connectedUser?: IUser;

  formGroup?: FormGroup;
  selectedTabId = 0;
  localDescription = '';
  localCandiate = '';
  private remoteDescription: string = '';
  private remoteCandidate: string = '';

  // Form Controls
  localQR = new FormControl<string>('', [Validators.required]);
  isScanDone = new FormControl<boolean>(false, Validators.requiredTrue);
  remoteQR = new FormControl<string>('', [Validators.required]);

  get me(): IUser | undefined {
    return this.userService.me;
  }

  get selectedTab(): ITab {
    return this.tabs[this.selectedTabId];
  }

  get localDataAsQRCodeText(): string {
    const meId: string = this.me?.userId ?? '';
    const meName: string = this.me?.userName ?? '';
    return this.localDescription + this.divider + this.localCandiate + this.divider + meId + this.divider + meName;
  }


  constructor(
    public dialogRef: MatDialogRef<PeerConnetionComponent>,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private socketService: SocketService
  ) {
  }

  ngOnDestroy(): void {
    this.componentIsActive.next(true);
    this.componentIsActive.complete();
  }

  async scanQRCode() {
    return new Promise<string | null>(async (resolve, reject) => {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri
        });

        const text = await this.readQRCode(image.webPath!);
        resolve(text);

      } catch (error) {
        reject(error);
      }
    });
    // this.scanError = ''

  }

  async readQRCode(webPath: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const codeReader = new BrowserQRCodeReader();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = webPath;

        img.onload = async () => {
          // Create a canvas and draw the image to ensure proper dimensions
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
            // Use the canvas to decode the QR code
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

  downloadQRCode(qrCodeElement: QRCodeComponent, fileName: string) {
    setTimeout(() => { // Ensure QR code is fully rendered
      const qrCanvas = qrCodeElement.qrcElement.nativeElement.querySelector('canvas');

      if (qrCanvas) {
        const imageUrl = qrCanvas.toDataURL('image/png'); // Convert to PNG format

        // Create a download link
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 100); // Delay to allow QR code rendering
  }

  sendMessage() {
    if (!this.message) return;

    this.spinner.show();
    if (this.objServer)
      this.objServer.sendMessage(this.message);
    else if (this.objClient)
      this.objClient.sendMessage(this.message);

    this.spinner.hide();
    this.message = ''
  }

  setScanComplete(stepper: MatStepper) {
    this.isScanDone.setValue(true);
    stepper.next();
  }

  resetSteps(stepper: MatStepper) {
    stepper.reset();
    this.localQR.reset();
    this.isScanDone.setValue(false);
    this.remoteQR.reset();
    this.objClient = undefined;
    this.objServer = undefined;
  }

  setRemoteUser(remoteUserId: string, remoteUserName: string): void {
    this.connectedUser = undefined;
    if (!remoteUserId || !remoteUserName) return;

    this.connectedUser = {
      userId: remoteUserId,
      userName: remoteUserName
    };
  }



  // SERVER
  startServer(stepper: MatStepper): void {
    this.spinner.show();
    this.objServer = new P2PServer();
    this.localQR.reset();

    this.objServer.messageReceived$.pipe(takeUntil(this.componentIsActive))
      .subscribe(message => {
        this.messages.push(message);
      });

    combineLatest([this.objServer.localDescription, this.objServer.localCandidates])
      .pipe(takeUntil(this.componentIsActive), skip(2))
      .subscribe(response => {
        this.localDescription = response[0];
        this.localCandiate = response[1];
        this.spinner.hide();
        this.localQR.setValue(this.localDataAsQRCodeText);
        stepper.next();
        this.cdr.detectChanges();
      });
    this.objServer.start();
  }

  scanPlayer(stepper: MatStepper): void {
    this.remoteDescription = '';
    this.spinner.show();
    this.remoteQR.reset();

    this.scanQRCode()
      .then(async (scannedText) => {
        if (scannedText) {
          const [remoteDescription, remoteCandidate, remoteUserId, remoteUserName] = scannedText.split(this.divider);
          this.remoteDescription = remoteDescription;
          this.remoteCandidate = remoteCandidate;
          this.setRemoteUser(remoteUserId, remoteUserName);
          this.remoteQR.setValue(scannedText);
          await this.setPlayerDescription();
          await this.setPlayerCandidate();
          this.spinner.hide();
          stepper.next();
          this.cdr.detectChanges();
        }
      })
      .catch(error => {
        this.spinner.hide();
        console.error('Error scanning QR code:', error);
      });
  }

  async setPlayerDescription(): Promise<void> {
    if (!this.remoteDescription || !this.objServer) return;

    await this.objServer.setRemoteDescription(this.remoteDescription);
  }

  async setPlayerCandidate(): Promise<void> {
    if (!this.remoteCandidate || !this.objServer) return;

    await this.objServer.addRemoteCandidates(this.remoteCandidate);
  }


  // CLIENT
  scanServer(stepper: MatStepper): void {
    this.remoteDescription = '';
    this.remoteCandidate = '';
    this.spinner.show();
    this.localQR.reset();

    this.scanQRCode()
      .then(scannedText => {
        if (scannedText) {
          const [remoteDescription, remoteCandidate, remoteUserId, remoteUserName] = scannedText.split(this.divider);
          if (!remoteDescription || !remoteCandidate) return;

          this.localQR.setValue(scannedText);
          this.remoteDescription = remoteDescription;
          this.remoteCandidate = remoteCandidate;
          this.setRemoteUser(remoteUserId, remoteUserName);
          this.startClient();
          this.setHostDescription(stepper);
        }
      })
      .catch(error => {
        this.spinner.hide();
        console.error('Error scanning QR code:', error)
      })
  }

  startClient(): void {
    this.objClient = new P2PClient();

    this.objClient.messageReceived$.pipe(takeUntil(this.componentIsActive))
      .subscribe(message => {
        this.messages.push(message);
      });

    this.objClient.start();
  }

  async setHostDescription(stepper: MatStepper): Promise<void> {
    if (!this.remoteDescription || !this.objClient) return;
    this.localDescription = '';

    combineLatest([this.objClient.localDescription, this.objClient.localCandidates])
      .pipe(takeUntil(this.componentIsActive), skip(2))
      .subscribe({
        next: async (response) => {
          this.localDescription = response[0];
          this.localCandiate = response[1];
          stepper.next();
          this.spinner.hide();
          this.cdr.detectChanges();
        },
        error: err => {
          this.spinner.hide();
        }
      });
    await this.objClient?.setRemoteDescription(this.remoteDescription);
  }

  async setHostCandidate(stepper: MatStepper): Promise<void> {
    if (!this.remoteCandidate || !this.objClient) return;

    this.spinner.show();

    await this.objClient.addRemoteCandidates(this.remoteCandidate);
    stepper.next();
    this.spinner.hide();
  }


  // SUBMIT
  createAndSaveConnection(): void {
    const objConenction = this.objServer ?? this.objClient;
    if (!objConenction || !this.connectedUser) return;


    // const newUsr = this.userService.connectedUsers.find(u => u.connectedUser.userId === this.connectedUser?.userId)
    //   ?? new ConnectedUser(this.selectedTab.type, this.connectedUser, this.socketService);
    // newUsr.setConnection(objConenction);
    // this.dialogRef.close(newUsr);
  }
}
