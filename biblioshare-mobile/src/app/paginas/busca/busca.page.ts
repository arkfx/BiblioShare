import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { Livro } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

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
export class BuscaPage {
  livros: Livro[] = [];
  carregando = false;
  erroCarregamento = false;
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

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  ionViewWillEnter(): void {
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
      params.q = q.trim();
    }
    if (modalidade) {
      params.modalidade = modalidade;
    }
    if (cidade.trim()) {
      params.cidade = cidade.trim();
    }
    if (ordenacao) {
      params.ordenacao = ordenacao;
    }
    return params;
  }
}
