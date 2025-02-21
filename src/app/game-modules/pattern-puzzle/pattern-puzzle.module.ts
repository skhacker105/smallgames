import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatternPuzzleRoutingModule } from './pattern-puzzle-routing.module';
import { PatternPuzzleComponent } from './pattern-puzzle/pattern-puzzle.component';


@NgModule({
  declarations: [
    PatternPuzzleComponent
  ],
  imports: [
    CommonModule,
    PatternPuzzleRoutingModule
  ]
})
export class PatternPuzzleModule { }
