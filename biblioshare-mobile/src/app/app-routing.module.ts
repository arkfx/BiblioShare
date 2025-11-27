import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

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
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/meus-livros/meus-livros.module').then((m) => m.MeusLivrosPageModule),
  },
  {
    path: 'adicionar-livro',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/adicionar-livro/adicionar-livro.module').then(
        (m) => m.AdicionarLivroPageModule,
      ),
  },
  {
    path: 'livros/:id',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/detalhes-livro/detalhes-livro.module').then(
        (m) => m.DetalhesLivroPageModule,
      ),
  },
  {
    path: 'lista-desejos',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/lista-desejos/lista-desejos.module').then(
        (m) => m.ListaDesejosPageModule,
      ),
  },
  {
    path: 'busca',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/busca/busca.module').then((m) => m.BuscaPageModule),
  },
  {
    path: 'transacoes/detalhes/:id',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/detalhes-transacao/detalhes-transacao.module').then(
        (m) => m.DetalhesTransacaoPageModule,
      ),
  },
  {
    path: 'transacoes/propor-troca/:livroId',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/proposta-troca/proposta-troca.module').then(
        (m) => m.PropostaTrocaPageModule,
      ),
  },
  {
    path: 'transacoes',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/transacoes/transacoes.module').then((m) => m.TransacoesPageModule),
  },
  {
    path: 'perfil',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./paginas/perfil/perfil.module').then((m) => m.PerfilPageModule),
  },
  {
    path: 'registrar',
    loadChildren: () =>
      import('./paginas/registro/registro.module').then((m) => m.RegistroPageModule),
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
