import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatternPuzzleRoutingModule } from './pattern-puzzle-routing.module';
import { PatternPuzzleComponent } from './pattern-puzzle/pattern-puzzle.component';
import { FormsModule } from '@angular/forms';
import { SecondsToHMSPipe } from '../../pipe/seconds-to-hms.pipe';


@NgModule({
  declarations: [
    PatternPuzzleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PatternPuzzleRoutingModule,
    SecondsToHMSPipe
  ]
})
export class PatternPuzzleModule { }
