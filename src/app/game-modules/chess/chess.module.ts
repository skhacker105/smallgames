import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChessRoutingModule } from './chess-routing.module';
import { ChessBoardComponent } from './chess-board/chess-board.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ChessBoardComponent
  ],
  imports: [
    CommonModule,
    ChessRoutingModule,
    FormsModule
  ]
})
export class ChessModule { }
