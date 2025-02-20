import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HanoiOfTowerComponent } from './hanoi-of-tower/hanoi-of-tower.component';

const routes: Routes = [
  {
    path: '',
    component: HanoiOfTowerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HanoiOfTowerRoutingModule { }
