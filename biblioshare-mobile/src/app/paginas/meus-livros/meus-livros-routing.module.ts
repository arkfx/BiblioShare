import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MeusLivrosPage } from './meus-livros.page';

const routes: Routes = [
  {
    path: '',
    component: MeusLivrosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MeusLivrosPageRoutingModule {}
