import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Game2048Component } from './game2048/game2048.component';

const routes: Routes = [
  {
    path: '',
    component: Game2048Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Game2048RoutingModule { }
