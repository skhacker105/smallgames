import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayCardMemorizeRoutingModule } from './play-card-memorize-routing.module';
import { PlayCardMemorizeComponent } from './play-card-memorize/play-card-memorize.component';
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [
    PlayCardMemorizeComponent
  ],
  imports: [
    CommonModule,
    PlayCardMemorizeRoutingModule,
    DragDropModule
  ]
})
export class PlayCardMemorizeModule { }
