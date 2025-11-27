import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonicModule,
  NavController,
  ToastController,
} from '@ionic/angular';
import { Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  MensagemTransacao,
  Transacao,
  TransacaoLivroResumo,
} from '../../core/modelos/transacoes';
import { ApiService } from '../../core/services/api.service';
import {
  AutenticacaoService,
  UsuarioPerfil,
} from '../../core/services/autenticacao.service';
import { ChatService } from '../../core/services/chat.service';

type AcaoTransacao = 'aceitar' | 'recusar' | 'cancelar';

@Component({
  standalone: true,
  selector: 'app-detalhes-transacao',
  templateUrl: './detalhes-transacao.page.html',
  styleUrls: ['./detalhes-transacao.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class DetalhesTransacaoPage implements OnDestroy {
  @ViewChild(IonContent) ionContent?: IonContent;
  transacao?: Transacao;
  carregando = false;
  processando = false;
  mensagens: MensagemTransacao[] = [];
  novaMensagem = '';
  sincronizandoChat = false;
  enviandoMensagem = false;
  chatStatus = 'Conectando...';
  chatErro?: string;
  private readonly transacaoId: number;
  private usuario?: UsuarioPerfil | null;
  private readonly subscriptions = new Subscription();
  private ultimaMensagemId: number | null = null;
  private pollingMensagens?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: ApiService,
    private readonly chatService: ChatService,
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
    this.encerrarPollingMensagens();
    this.subscriptions.unsubscribe();
  }

  ionViewWillEnter(): void {
    if (!this.transacaoId) {
      this.navController.back();
      return;
    }
    this.garantirPerfil();
    this.buscarTransacao();
    this.iniciarChat();
  }

  ionViewWillLeave(): void {
    this.encerrarPollingMensagens();
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

  get usuarioAtualId(): number | undefined {
    return this.usuario?.id ?? undefined;
  }

  enviarMensagem(): void {
    const conteudo = this.novaMensagem.trim();
    if (!conteudo || this.enviandoMensagem) {
      return;
    }
    this.enviandoMensagem = true;
    const envioSub = this.chatService
      .enviarMensagem(this.transacaoId, conteudo)
      .pipe(finalize(() => (this.enviandoMensagem = false)))
      .subscribe({
        next: (mensagem) => {
          this.registrarMensagens([mensagem], false);
          this.novaMensagem = '';
          this.chatErro = undefined;
          this.atualizarStatusChat();
        },
        error: async () => {
          await this.exibirToast('Não foi possível enviar a mensagem.');
        },
      });
    this.subscriptions.add(envioSub);
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

  private iniciarChat(): void {
    if (!this.transacaoId) {
      return;
    }
    this.carregarMensagens(false);
    this.encerrarPollingMensagens();
    this.pollingMensagens = interval(4000).subscribe(() => this.carregarMensagens(true));
  }

  private encerrarPollingMensagens(): void {
    this.pollingMensagens?.unsubscribe();
    this.pollingMensagens = undefined;
  }

  private carregarMensagens(incremental: boolean): void {
    if (!this.transacaoId) {
      return;
    }
    if (this.sincronizandoChat && incremental) {
      return;
    }
    const depoisDe = incremental && this.ultimaMensagemId ? this.ultimaMensagemId : undefined;
    this.sincronizandoChat = true;
    const sincronizacaoSub = this.chatService
      .listarMensagens(this.transacaoId, depoisDe)
      .pipe(finalize(() => (this.sincronizandoChat = false)))
      .subscribe({
        next: (mensagens) => {
          this.registrarMensagens(mensagens, !incremental);
          this.chatErro = undefined;
          if (this.mensagens.length) {
            this.atualizarStatusChat();
          } else {
            this.chatStatus = 'Nenhuma mensagem ainda';
          }
        },
        error: () => {
          this.chatErro = 'Não foi possível sincronizar o chat.';
          this.chatStatus = 'Offline';
        },
      });
    this.subscriptions.add(sincronizacaoSub);
  }

  private registrarMensagens(recebidas: MensagemTransacao[], substituir: boolean): void {
    if (substituir) {
      this.mensagens = [];
    }
    if (!recebidas.length) {
      this.atualizarUltimaMensagem();
      return;
    }
    const existentes = new Map(this.mensagens.map((mensagem) => [mensagem.id, mensagem]));
    recebidas.forEach((mensagem) => existentes.set(mensagem.id, mensagem));
    this.mensagens = Array.from(existentes.values()).sort((a, b) => a.id - b.id);
    this.atualizarUltimaMensagem();
    this.rolarChatParaBase();
  }

  private atualizarUltimaMensagem(): void {
    this.ultimaMensagemId = this.mensagens.length
      ? this.mensagens[this.mensagens.length - 1].id
      : null;
  }

  private atualizarStatusChat(): void {
    const agora = new Date();
    this.chatStatus = `Atualizado às ${agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  private rolarChatParaBase(): void {
    requestAnimationFrame(() => {
      this.ionContent?.scrollToBottom(300);
    });
  }
}

