import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { QRCodeModule } from 'angularx-qrcode';
import { UserService } from '../../services/user.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-qrcode',
  standalone: true,
  imports: [CommonModule, QRCodeModule, MatIconModule],
  templateUrl: './my-qrcode.component.html',
  styleUrl: './my-qrcode.component.scss'
})
export class MyQRCodeComponent implements OnInit {

  userString = ''

  constructor(public userService: UserService, public dialogRef: MatDialogRef<MyQRCodeComponent>) { }

  ngOnInit(): void {
    if (this.userService.me)
    this.userString = JSON.stringify(this.userService.me)
  }
}
