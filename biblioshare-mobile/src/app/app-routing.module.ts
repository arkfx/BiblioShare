import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'entrar',
    pathMatch: 'full',
  },
  {
    path: 'entrar',
    loadChildren: () =>
      import('./paginas/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'meus-livros',
    loadChildren: () =>
      import('./paginas/meus-livros/meus-livros.module').then((m) => m.MeusLivrosPageModule),
  },
  {
    path: 'busca',
    loadChildren: () =>
      import('./paginas/busca/busca.module').then((m) => m.BuscaPageModule),
  },
  {
    path: 'transacoes',
    loadChildren: () =>
      import('./paginas/transacoes/transacoes.module').then((m) => m.TransacoesPageModule),
  },
  {
    path: 'perfil',
    loadChildren: () =>
      import('./paginas/perfil/perfil.module').then((m) => m.PerfilPageModule),
  },
  {
    path: '**',
    redirectTo: 'entrar',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
