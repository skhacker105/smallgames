import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImagePuzzleRoutingModule } from './image-puzzle-routing.module';
import { ImagePuzzleComponent } from './image-puzzle/image-puzzle.component';
import { FormsModule } from '@angular/forms';
import { SecondsToHMSPipe } from '../../pipe/seconds-to-hms.pipe';


@NgModule({
  declarations: [
    ImagePuzzleComponent
  ],
  imports: [
    CommonModule,
    ImagePuzzleRoutingModule,
    FormsModule,
    SecondsToHMSPipe
  ]
})
export class ImagePuzzleModule { }
