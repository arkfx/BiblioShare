import { Component } from '@angular/core';

import { AutenticacaoService } from './core/services/autenticacao.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly menuItens: MenuItem[] = [
    { label: 'Meus livros', icon: 'book-outline', route: '/meus-livros' },
    { label: 'Buscar livros', icon: 'search-outline', route: '/busca' },
    { label: 'Transações', icon: 'swap-horizontal-outline', route: '/transacoes' },
    { label: 'Perfil', icon: 'person-circle-outline', route: '/perfil' },
    { label: 'Lista de desejos', icon: 'heart-outline', route: '/lista-desejos' },
  ];

  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  estaAutenticado(): boolean {
    return this.autenticacaoService.estaAutenticado();
  }

  sair(): void {
    this.autenticacaoService.limparSessao();
  }
}
