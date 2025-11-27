import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Livro } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';
import {
  AutenticacaoService,
  UsuarioPerfil,
} from '../../core/services/autenticacao.service';

interface FiltrosBusca {
  q: string;
  modalidade: string;
  cidade: string;
  ordenacao: string;
}

@Component({
  selector: 'app-busca',
  templateUrl: './busca.page.html',
  styleUrls: ['./busca.page.scss'],
})
export class BuscaPage implements OnDestroy {
  livros: Livro[] = [];
  carregando = false;
  erroCarregamento = false;
  usuario?: UsuarioPerfil | null;
  filtros: FiltrosBusca = {
    q: '',
    modalidade: '',
    cidade: '',
    ordenacao: 'recentes',
  };
  modalidades = [
    { label: 'Todas as modalidades', valor: '' },
    { label: 'Doação', valor: 'DOACAO' },
    { label: 'Empréstimo', valor: 'EMPRESTIMO' },
    { label: 'Aluguel', valor: 'ALUGUEL' },
    { label: 'Troca', valor: 'TROCA' },
  ];
  ordenacoes = [
    { label: 'Mais recentes', valor: 'recentes' },
    { label: 'Título A-Z', valor: 'titulo' },
    { label: 'Cidade', valor: 'cidade' },
  ];
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
    private readonly autenticacaoService: AutenticacaoService,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.garantirPerfil();
    this.buscarLivros();
  }

  buscarLivros(event?: CustomEvent): void {
    this.carregando = true;
    this.erroCarregamento = false;
    const params = this.montarParametros();
    this.apiService
      .buscarLivros(params)
      .pipe(
        finalize(() => {
          this.carregando = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (dados) => {
          this.livros = dados;
        },
        error: () => {
          this.erroCarregamento = true;
        },
      });
  }

  limparFiltros(): void {
    this.filtros = {
      q: '',
      modalidade: '',
      cidade: '',
      ordenacao: 'recentes',
    };
    this.buscarLivros();
  }

  trackByLivro(_: number, livro: Livro): number {
    return livro.id;
  }

  abrirDetalhes(livro: Livro): void {
    this.router.navigate(['/livros', livro.id]);
  }

  proporTroca(livro: Livro, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/transacoes/propor-troca', livro.id], {
      state: { livro },
    });
  }

  permiteTroca(livro: Livro): boolean {
    if (!livro.modalidades?.includes('TROCA')) {
      return false;
    }
    if (!this.usuario) {
      return true;
    }
    return livro.dono !== this.usuario.id;
  }

  rotuloModalidade(modalidade: string): string {
    const mapa: Record<string, string> = {
      DOACAO: 'Doação',
      EMPRESTIMO: 'Empréstimo',
      ALUGUEL: 'Aluguel',
      TROCA: 'Troca',
    };
    return mapa[modalidade] ?? modalidade;
  }

  private montarParametros(): Record<string, string> {
    const params: Record<string, string> = {};
    const { q, modalidade, cidade, ordenacao } = this.filtros;
    if (q.trim()) {
      params['q'] = q.trim();
    }
    if (modalidade) {
      params['modalidade'] = modalidade;
    }
    if (cidade.trim()) {
      params['cidade'] = cidade.trim();
    }
    if (ordenacao) {
      params['ordenacao'] = ordenacao;
    }
    return params;
  }

  private garantirPerfil(): void {
    if (!this.autenticacaoService.estaAutenticado()) {
      return;
    }
    const atual = this.autenticacaoService.obterUsuarioAtual();
    if (atual) {
      this.usuario = atual;
      return;
    }
    this.subscriptions.add(
      this.autenticacaoService.obterPerfil().subscribe((perfil) => (this.usuario = perfil)),
    );
  }
}
