import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatternPuzzleComponent } from './pattern-puzzle/pattern-puzzle.component';

const routes: Routes = [
  {
    path: '',
    component: PatternPuzzleComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatternPuzzleRoutingModule { }
