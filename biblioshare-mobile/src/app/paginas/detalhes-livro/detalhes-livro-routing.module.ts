import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DetalhesLivroPage } from './detalhes-livro.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhesLivroPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhesLivroPageRoutingModule {}

