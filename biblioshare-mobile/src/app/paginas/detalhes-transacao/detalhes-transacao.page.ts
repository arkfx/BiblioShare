import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  Transacao,
  TransacaoLivroResumo,
} from '../../core/modelos/transacoes';
import { ApiService } from '../../core/services/api.service';
import {
  AutenticacaoService,
  UsuarioPerfil,
} from '../../core/services/autenticacao.service';

type AcaoTransacao = 'aceitar' | 'recusar' | 'cancelar';

@Component({
  selector: 'app-detalhes-transacao',
  templateUrl: './detalhes-transacao.page.html',
  styleUrls: ['./detalhes-transacao.page.scss'],
})
export class DetalhesTransacaoPage implements OnDestroy {
  transacao?: Transacao;
  carregando = false;
  processando = false;
  private readonly transacaoId: number;
  private usuario?: UsuarioPerfil | null;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly navController: NavController,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController,
    private readonly autenticacaoService: AutenticacaoService,
  ) {
    this.transacaoId = Number(this.route.snapshot.paramMap.get('id'));
    this.subscriptions.add(
      this.autenticacaoService.usuario$.subscribe((usuario) => (this.usuario = usuario)),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter(): void {
    if (!this.transacaoId) {
      this.navController.back();
      return;
    }
    this.garantirPerfil();
    this.buscarTransacao();
  }

  buscarTransacao(event?: CustomEvent): void {
    this.carregando = true;
    this.apiService
      .obterTransacao(this.transacaoId)
      .pipe(
        finalize(() => {
          this.carregando = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (transacao) => {
          this.transacao = transacao;
        },
        error: async () => {
          await this.exibirToast('Não foi possível carregar a transação.');
          this.navController.back();
        },
      });
  }

  get podeAceitar(): boolean {
    return (
      this.transacao?.status === 'PENDENTE' &&
      this.usuario?.id === this.transacao?.dono.id
    );
  }

  get podeRecusar(): boolean {
    return this.podeAceitar;
  }

  get podeCancelar(): boolean {
    if (!this.transacao || !this.usuario) {
      return false;
    }
    return (
      ['PENDENTE', 'ACEITA'].includes(this.transacao.status) &&
      [this.transacao.dono.id, this.transacao.solicitante.id].includes(this.usuario.id)
    );
  }

  get livrosSolicitadosExtras(): TransacaoLivroResumo[] {
    if (!this.transacao) {
      return [];
    }
    return this.transacao.livros_solicitados.filter(
      (livro) => livro.id !== this.transacao?.livro_principal.id,
    );
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

  async confirmarAcao(acao: AcaoTransacao): Promise<void> {
    const mensagens: Record<AcaoTransacao, string> = {
      aceitar: 'Deseja aceitar esta solicitação?',
      recusar: 'Deseja recusar esta solicitação?',
      cancelar: 'Deseja cancelar a transação?',
    };
    const alerta = await this.alertController.create({
      header: 'Confirmar ação',
      message: mensagens[acao],
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => this.executarAcao(acao),
        },
      ],
    });
    await alerta.present();
  }

  private executarAcao(acao: AcaoTransacao): void {
    if (!this.transacao) {
      return;
    }
    this.processando = true;
    let requisicao;
    if (acao === 'aceitar') {
      requisicao = this.apiService.aceitarTransacao(this.transacao.id);
    } else if (acao === 'recusar') {
      requisicao = this.apiService.recusarTransacao(this.transacao.id);
    } else {
      requisicao = this.apiService.cancelarTransacao(this.transacao.id);
    }
    requisicao
      .pipe(finalize(() => (this.processando = false)))
      .subscribe({
        next: async (transacaoAtualizada) => {
          this.transacao = transacaoAtualizada;
          await this.exibirToast('Transação atualizada.', 'success');
        },
        error: async (erro) => {
          const mensagem = erro?.error?.detail ?? erro?.error ?? 'Ação não permitida.';
          await this.exibirToast(mensagem);
        },
      });
  }

  private garantirPerfil(): void {
    if (!this.autenticacaoService.estaAutenticado()) {
      return;
    }
    if (!this.autenticacaoService.obterUsuarioAtual()) {
      this.subscriptions.add(this.autenticacaoService.obterPerfil().subscribe((perfil) => (this.usuario = perfil)));
    }
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' = 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

