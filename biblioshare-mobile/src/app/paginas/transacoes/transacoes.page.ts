import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  Transacao,
  TransacaoStatus,
} from '../../core/modelos/transacoes';
import { ApiService } from '../../core/services/api.service';
import {
  AutenticacaoService,
  UsuarioPerfil,
} from '../../core/services/autenticacao.service';

type FiltroStatus = 'TODAS' | TransacaoStatus;

@Component({
  standalone: true,
  selector: 'app-transacoes',
  templateUrl: './transacoes.page.html',
  styleUrls: ['./transacoes.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TransacoesPage implements OnDestroy {
  transacoes: Transacao[] = [];
  carregando = false;
  erroCarregamento = false;
  statusFiltro: FiltroStatus = 'TODAS';
  readonly statusOpcoes = [
    { valor: 'TODAS' as FiltroStatus, label: 'Todas' },
    { valor: 'PENDENTE' as TransacaoStatus, label: 'Pendentes' },
    { valor: 'ACEITA' as TransacaoStatus, label: 'Aceitas' },
    { valor: 'EM_POSSE' as TransacaoStatus, label: 'Em posse' },
    { valor: 'CONCLUIDA' as TransacaoStatus, label: 'Concluídas' },
    { valor: 'CANCELADA' as TransacaoStatus, label: 'Canceladas' },
  ];
  private usuario?: UsuarioPerfil | null;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly apiService: ApiService,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly router: Router,
  ) {
    this.subscriptions.add(
      this.autenticacaoService.usuario$.subscribe((usuario) => (this.usuario = usuario)),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.garantirPerfil();
    this.carregarTransacoes();
  }

  carregarTransacoes(event?: CustomEvent): void {
    this.carregando = true;
    this.erroCarregamento = false;
    this.apiService
      .listarTransacoes()
      .pipe(
        finalize(() => {
          this.carregando = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (transacoes) => {
          this.transacoes = transacoes;
        },
        error: () => {
          this.erroCarregamento = true;
        },
      });
  }

  atualizarFiltro(event: CustomEvent): void {
    this.statusFiltro = event.detail.value as FiltroStatus;
  }

  get transacoesFiltradas(): Transacao[] {
    if (this.statusFiltro === 'TODAS') {
      return this.transacoes;
    }
    return this.transacoes.filter((transacao) => transacao.status === this.statusFiltro);
  }

  abrirDetalhes(transacao: Transacao): void {
    this.router.navigate(['/transacoes/detalhes', transacao.id]);
  }

  contraparte(transacao: Transacao): string {
    if (!this.usuario) {
      return transacao.dono.nome_completo;
    }
    return this.usuario.id === transacao.solicitante.id
      ? transacao.dono.nome_completo
      : transacao.solicitante.nome_completo;
  }

  rotuloTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      DOACAO: 'Doação',
      EMPRESTIMO: 'Empréstimo',
      ALUGUEL: 'Aluguel',
      TROCA: 'Troca',
    };
    return mapa[tipo] ?? tipo;
  }

  rotuloStatus(status: string): string {
    const mapa: Record<string, string> = {
      PENDENTE: 'Pendente',
      ACEITA: 'Aceita',
      EM_POSSE: 'Em posse',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
    };
    return mapa[status] ?? status;
  }

  trackById(_: number, transacao: Transacao): number {
    return transacao.id;
  }

  private garantirPerfil(): void {
    if (!this.autenticacaoService.estaAutenticado()) {
      return;
    }
    if (!this.autenticacaoService.obterUsuarioAtual()) {
      this.subscriptions.add(this.autenticacaoService.obterPerfil().subscribe());
    }
  }
}
