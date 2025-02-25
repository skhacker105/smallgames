import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImagePuzzleComponent } from './image-puzzle/image-puzzle.component';

const routes: Routes = [
  {
    path: '',
    component: ImagePuzzleComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImagePuzzleRoutingModule { }
