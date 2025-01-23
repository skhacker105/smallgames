import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SudokuRoutingModule } from './sudoku-routing.module';
import { SudokuComponent } from './sudoku/sudoku.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    SudokuComponent
  ],
  imports: [
    CommonModule,
    SudokuRoutingModule,
    FormsModule
  ]
})
export class SudokuModule { }
