import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SudokuComponent } from './sudoku/sudoku.component';

const routes: Routes = [
  {
    path: '',
    component: SudokuComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SudokuRoutingModule { }
