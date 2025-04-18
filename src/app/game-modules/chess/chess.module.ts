import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChessRoutingModule } from './chess-routing.module';
import { ChessBoardComponent } from './chess-board/chess-board.component';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from '../../components/spinner/spinner.component';


@NgModule({
  declarations: [
    ChessBoardComponent
  ],
  imports: [
    CommonModule,
    ChessRoutingModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    SpinnerComponent
  ]
})
export class ChessModule { }
