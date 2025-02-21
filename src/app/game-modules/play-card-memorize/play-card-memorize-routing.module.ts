import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayCardMemorizeComponent } from './play-card-memorize/play-card-memorize.component';

const routes: Routes = [
  {
    path: '',
    component: PlayCardMemorizeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayCardMemorizeRoutingModule { }
