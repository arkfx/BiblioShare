from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import DetailView, FormView, ListView
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from livros.models import Livro

from .forms import ProporTrocaForm
from .models import Transacao
from .serializers import TransacaoCriarSerializer, TransacaoSerializer
from .services import (
    ErroTransacao,
    EstadoInvalidoError,
    LivroIndisponivelError,
    PermissaoNegadaError,
    aceitar_solicitacao,
    cancelar_transacao,
    criar_transacao_solicitacao,
    recusar_solicitacao,
)


class TransacaoQuerysetMixin:
    def get_queryset(self):
        usuario = self.request.user
        return (
            Transacao.objects.filter(Q(solicitante=usuario) | Q(dono=usuario))
            .select_related('solicitante', 'dono', 'livro_principal')
            .prefetch_related('livros_oferecidos', 'livros_solicitados')
        )


class TransacaoListCreateAPIView(TransacaoQuerysetMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TransacaoCriarSerializer
        return TransacaoSerializer

    def get_serializer_context(self):
        contexto = super().get_serializer_context()
        contexto['request'] = self.request
        return contexto


class TransacaoDetailAPIView(TransacaoQuerysetMixin, generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransacaoSerializer


class TransacaoAcaoBaseAPIView(TransacaoQuerysetMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk: int):
        transacao = get_object_or_404(self.get_queryset(), pk=pk)
        try:
            transacao = self.executar_acao(transacao, request.user)
        except PermissaoNegadaError as erro:
            raise PermissionDenied(str(erro)) from erro
        except (EstadoInvalidoError, LivroIndisponivelError, ErroTransacao) as erro:
            raise ValidationError(str(erro)) from erro
        serializer = TransacaoSerializer(transacao, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def executar_acao(self, transacao: Transacao, usuario):
        raise NotImplementedError


class TransacaoAceitarAPIView(TransacaoAcaoBaseAPIView):
    def executar_acao(self, transacao: Transacao, usuario):
        return aceitar_solicitacao(transacao, usuario)


class TransacaoRecusarAPIView(TransacaoAcaoBaseAPIView):
    def executar_acao(self, transacao: Transacao, usuario):
        return recusar_solicitacao(transacao, usuario)


class TransacaoCancelarAPIView(TransacaoAcaoBaseAPIView):
    def executar_acao(self, transacao: Transacao, usuario):
        return cancelar_transacao(transacao, usuario)


class TransacoesListaView(LoginRequiredMixin, ListView):
    template_name = 'transacoes/lista.html'
    context_object_name = 'transacoes'

    def get_queryset(self):
        usuario = self.request.user
        queryset = (
            Transacao.objects.filter(Q(solicitante=usuario) | Q(dono=usuario))
            .select_related('solicitante', 'dono', 'livro_principal')
            .prefetch_related('livros_oferecidos', 'livros_solicitados')
            .order_by('-atualizado_em')
        )
        status_param = self.request.GET.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        contexto['status_opcoes'] = Transacao.Status.choices
        contexto['status_selecionado'] = self.request.GET.get('status', '')
        return contexto


class TransacaoDetalhesView(LoginRequiredMixin, DetailView):
    template_name = 'transacoes/detalhes.html'
    context_object_name = 'transacao'

    def get_queryset(self):
        usuario = self.request.user
        return (
            Transacao.objects.filter(Q(solicitante=usuario) | Q(dono=usuario))
            .select_related('solicitante', 'dono', 'livro_principal')
            .prefetch_related('livros_oferecidos', 'livros_solicitados', 'historicos__usuario')
        )

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        transacao = self.object
        usuario = self.request.user
        contexto['historicos'] = transacao.historicos.select_related('usuario')
        contexto['pode_aceitar'] = (
            usuario.id == transacao.dono_id and transacao.status == Transacao.Status.PENDENTE
        )
        contexto['pode_recusar'] = contexto['pode_aceitar']
        contexto['pode_cancelar'] = (
            transacao.status in (Transacao.Status.PENDENTE, Transacao.Status.ACEITA)
            and usuario.id in (transacao.dono_id, transacao.solicitante_id)
        )
        contexto['usuario_eh_solicitante'] = usuario.id == transacao.solicitante_id
        return contexto

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        acao = request.POST.get('acao')
        try:
            if acao == 'aceitar':
                aceitar_solicitacao(self.object, request.user)
                messages.success(request, 'Solicitação aceita.')
            elif acao == 'recusar':
                recusar_solicitacao(self.object, request.user)
                messages.info(request, 'Solicitação recusada.')
            elif acao == 'cancelar':
                cancelar_transacao(self.object, request.user)
                messages.info(request, 'Transação cancelada.')
            else:
                messages.error(request, 'Ação desconhecida.')
        except PermissaoNegadaError as erro:
            messages.error(request, str(erro))
        except (EstadoInvalidoError, LivroIndisponivelError, ErroTransacao) as erro:
            messages.error(request, str(erro))
        self.object.refresh_from_db()
        return redirect('transacoes_web:detalhes', pk=self.object.pk)


class ProporTrocaView(LoginRequiredMixin, FormView):
    template_name = 'transacoes/propor_troca.html'
    form_class = ProporTrocaForm
    success_url = reverse_lazy('transacoes_web:lista')

    def dispatch(self, request, *args, **kwargs):
        self.livro_principal = get_object_or_404(
            Livro.objects.select_related('dono'),
            pk=kwargs['livro_id'],
        )
        if self.livro_principal.dono_id == request.user.id:
            messages.error(request, 'Você não pode propor troca com um livro próprio.')
            return redirect('livros_web:detalhes-livro', pk=self.livro_principal.pk)
        return super().dispatch(request, *args, **kwargs)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['usuario'] = self.request.user
        kwargs['livro_principal'] = self.livro_principal
        return kwargs

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        contexto['livro_principal'] = self.livro_principal
        return contexto

    def form_valid(self, form):
        livros_oferecidos = list(form.cleaned_data['livros_oferecidos'].values_list('id', flat=True))
        livros_solicitados = list(form.cleaned_data['livros_solicitados'].values_list('id', flat=True))
        try:
            criar_transacao_solicitacao(
                self.request.user,
                self.livro_principal.id,
                Transacao.Tipo.TROCA,
                livros_oferecidos_ids=livros_oferecidos,
                livros_solicitados_ids=livros_solicitados,
            )
        except PermissaoNegadaError as erro:
            form.add_error(None, str(erro))
            return self.form_invalid(form)
        except (EstadoInvalidoError, LivroIndisponivelError, ErroTransacao) as erro:
            form.add_error(None, str(erro))
            return self.form_invalid(form)
        messages.success(self.request, 'Proposta de troca enviada.')
        return super().form_valid(form)
