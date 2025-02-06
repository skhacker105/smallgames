import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Camera, CameraResultType } from '@capacitor/camera';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { P2PClient, P2PServer } from '../../classes';
import { Subject, combineLatest, skip, take, takeUntil } from 'rxjs';
import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

type TabType = 'server' | 'client';

interface ITab {
  type: TabType;
  header: string;
  fileName: string;
}

@Component({
  selector: 'app-peer-connetion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTabsModule, QRCodeModule, MatStepperModule, NgxSpinnerModule],
  templateUrl: './peer-connetion.component.html',
  styleUrl: './peer-connetion.component.scss'
})
export class PeerConnetionComponent {

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

  formGroup?: FormGroup;
  selectedTabId = 0;
  localDescription = '';
  localCandiate = '';
  private remoteDescription: string = '';
  private remoteCandidate: string = '';

  get selectedTab(): ITab {
    return this.tabs[this.selectedTabId];
  }

  get localDataAsQRCodeText(): string {
    return this.localDescription + this.divider + this.localCandiate;
  }


  constructor(public dialogRef: MatDialogRef<PeerConnetionComponent>, private spinner: NgxSpinnerService, private cdr: ChangeDetectorRef) {
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

  downloadQRCode(qrCodeElement: QRCodeComponent, fileName: string, stepper: MatStepper) {
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
        setTimeout(() => {
          stepper.next();
          this.cdr.detectChanges();
        }, 100);
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

  resetSteps(stepper: MatStepper) {
    stepper.reset();
    this.objClient = undefined;
    this.objServer = undefined;
  }



  // SERVER
  startServer(stepper: MatStepper): void {
    this.spinner.show();
    this.objServer = new P2PServer();

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
      });
    stepper.next();
    this.objServer.startServer();
  }

  scanPlayer(stepper: MatStepper) {
    this.remoteDescription = '';
    this.spinner.show();
    this.scanQRCode()
      .then(async (scannedText) => {
        if (scannedText) {
          const [remoteDescription, remoteCandidate] = scannedText.split(this.divider);
          this.remoteDescription = remoteDescription;
          this.remoteCandidate = remoteCandidate;
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

  async setPlayerDescription() {
    if (!this.remoteDescription || !this.objServer) return;

    await this.objServer.setRemoteDescription(this.remoteDescription);
  }

  async setPlayerCandidate() {
    if (!this.remoteCandidate || !this.objServer) return;

    await this.objServer.addRemoteCandidates(this.remoteCandidate);
  }


  // CLIENT
  scanServer(stepper: MatStepper) {
    this.remoteDescription = '';
    this.remoteCandidate = '';
    this.spinner.show();
    this.scanQRCode()
      .then(scannedText => {
        if (scannedText) {
          const [remoteDescription, remoteCandidate] = scannedText.split(this.divider);
          if (!remoteDescription || !remoteCandidate) return;

          this.remoteDescription = remoteDescription;
          this.remoteCandidate = remoteCandidate;
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

    this.objClient.startClient();
  }

  async setHostDescription(stepper: MatStepper) {
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

  async setHostCandidate(stepper: MatStepper) {
    if (!this.remoteCandidate || !this.objClient) return;

    this.spinner.show();

    await this.objClient.addRemoteCandidates(this.remoteCandidate);
    stepper.next();
    this.spinner.hide();
  }

  // private peerConnection?: RTCPeerConnection;
  // private dataChannel?: RTCDataChannel;
  // localDescription: string = '';
  // remoteDescription: string = '';
  // localCandidates: string = '';
  // remoteCandidates: string = '';
  // message: string = '';
  // inputMessage: string = '';

  // constructor(public dialogRef: MatDialogRef<PeerConnetionComponent>) { }

  // // Start the "server" (initiator)
  // startServer() {
  //   this.peerConnection = new RTCPeerConnection();

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       this.localCandidates += JSON.stringify(event.candidate) + '\n';
  //       console.log('this.localCandidates = ', this.localCandidates)
  //     }
  //   };

  //   this.dataChannel = this.peerConnection.createDataChannel('chat');
  //   this.dataChannel.onopen = () => {
  //     this.message = 'Data channel opened!';
  //   };
  //   this.dataChannel.onmessage = (event) => {
  //     this.message = `Received: ${event.data}`;
  //   };

  //   this.peerConnection.createOffer().then((offer) => {
  //     return this.peerConnection?.setLocalDescription(offer);
  //   }).then(() => {
  //     this.localDescription = JSON.stringify(this.peerConnection?.localDescription);
  //   });
  // }

  // // Start the "client" (receiver)
  // startClient() {
  //   this.peerConnection = new RTCPeerConnection();

  //   this.peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       this.localCandidates += JSON.stringify(event.candidate) + '\n';
  //     }
  //   };

  //   this.peerConnection.ondatachannel = (event) => {
  //     this.dataChannel = event.channel;
  //     this.dataChannel.onopen = () => {
  //       this.message = 'Data channel opened!';
  //     };
  //     this.dataChannel.onmessage = (event) => {
  //       this.message = `Received: ${event.data}`;
  //     };
  //   };
  // }

  // // Set the remote description (offer/answer)
  // setRemoteDescription() {
  //   const remoteDesc = JSON.parse(this.remoteDescription);
  //   this.peerConnection?.setRemoteDescription(new RTCSessionDescription(remoteDesc));

  //   if (remoteDesc.type === 'offer') {
  //     this.peerConnection?.createAnswer().then((answer) => {
  //       return this.peerConnection?.setLocalDescription(answer);
  //     }).then(() => {
  //       this.localDescription = JSON.stringify(this.peerConnection?.localDescription);
  //     });
  //   }
  // }

  // // Add remote ICE candidates
  // addRemoteCandidates() {
  //   const candidates = this.remoteCandidates.trim().split('\n');
  //   candidates.forEach((candidate) => {
  //     if (candidate) {
  //       this.peerConnection?.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
  //     }
  //   });
  // }

  // // Send a message over the data channel
  // sendMessage() {
  //   if (this.dataChannel && this.dataChannel.readyState === 'open') {
  //     this.dataChannel.send(this.inputMessage);
  //     this.inputMessage = '';
  //   }
  // }

}
