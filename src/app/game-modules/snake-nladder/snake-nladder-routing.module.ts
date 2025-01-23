import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SnakeNLadderComponent } from './snake-nladder/snake-nladder.component';

const routes: Routes = [
  {
    path: '',
    component: SnakeNLadderComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SnakeNLadderRoutingModule { }
