from datetime import date, timedelta
from typing import Iterable, Sequence

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from livros.models import Livro

from .models import HistoricoTransacao, Transacao


class ErroTransacao(Exception):
    pass


class LivroIndisponivelError(ErroTransacao):
    pass


class PermissaoNegadaError(ErroTransacao):
    pass


class EstadoInvalidoError(ErroTransacao):
    pass


def criar_transacao_solicitacao(
    usuario_solicitante,
    livro_principal_id: int,
    tipo: str,
    livros_oferecidos_ids: Sequence[int] | None = None,
    livros_solicitados_ids: Sequence[int] | None = None,
    data_limite: date | None = None,
) -> Transacao:
    livros_oferecidos_ids = list(dict.fromkeys(livros_oferecidos_ids or []))
    livros_solicitados_ids = list(dict.fromkeys(livros_solicitados_ids or []))
    with transaction.atomic():
        livro_principal = (
            Livro.objects.select_for_update()
            .select_related('dono')
            .get(pk=livro_principal_id)
        )
        if livro_principal.dono_id == usuario_solicitante.id:
            raise PermissaoNegadaError('Você não pode solicitar o próprio livro.')
        livros_para_travar = [livro_principal]
        livros_oferecidos = []
        livros_solicitados_extra = []
        if tipo == Transacao.Tipo.TROCA:
            if not livros_oferecidos_ids:
                raise ValidationError('Informe pelo menos um livro oferecido para a troca.')
            livros_oferecidos = list(
                Livro.objects.select_for_update()
                .select_related('dono')
                .filter(id__in=livros_oferecidos_ids)
            )
            if len(livros_oferecidos) != len(livros_oferecidos_ids):
                raise LivroIndisponivelError('Algum livro oferecido não foi encontrado.')
            for livro in livros_oferecidos:
                if livro.dono_id != usuario_solicitante.id:
                    raise PermissaoNegadaError('Só é possível oferecer livros do próprio acervo.')
            if livros_solicitados_ids:
                livros_solicitados_extra = list(
                    Livro.objects.select_for_update()
                    .select_related('dono')
                    .filter(id__in=livros_solicitados_ids)
                )
                if len(livros_solicitados_extra) != len(livros_solicitados_ids):
                    raise LivroIndisponivelError('Algum livro solicitado não foi encontrado.')
                for livro in livros_solicitados_extra:
                    if livro.dono_id != livro_principal.dono_id:
                        raise PermissaoNegadaError('Só é possível solicitar livros do mesmo dono.')
            livros_para_travar.extend(livros_oferecidos + livros_solicitados_extra)
        else:
            if livros_oferecidos_ids or livros_solicitados_ids:
                raise ValidationError('Livros extras só podem ser informados em trocas.')
        _validar_disponibilidade(livros_para_travar)
        data_limite_final = _resolver_data_limite(tipo, livro_principal, data_limite)
        transacao = Transacao.objects.create(
            tipo=tipo,
            status=Transacao.Status.PENDENTE,
            solicitante=usuario_solicitante,
            dono=livro_principal.dono,
            livro_principal=livro_principal,
            data_limite_devolucao=data_limite_final,
        )
        livros_reservados: dict[int, Livro] = {livro_principal.pk: livro_principal}
        transacao.livros_solicitados.add(livro_principal)
        if tipo == Transacao.Tipo.TROCA:
            transacao.livros_oferecidos.add(*livros_oferecidos)
            transacao.livros_solicitados.add(*[livro for livro in livros_solicitados_extra if livro.pk != livro_principal.pk])
            for livro in livros_oferecidos + livros_solicitados_extra:
                livros_reservados[livro.pk] = livro
        _reservar_livros(livros_reservados.values())
        return transacao


def aceitar_solicitacao(transacao: Transacao, usuario) -> Transacao:
    if usuario.id != transacao.dono_id:
        raise PermissaoNegadaError('Apenas o dono do livro pode aceitar a solicitação.')
    if transacao.status != Transacao.Status.PENDENTE:
        raise EstadoInvalidoError('A transação precisa estar pendente para ser aceita.')
    return _alterar_status(transacao, Transacao.Status.ACEITA, usuario)


def recusar_solicitacao(transacao: Transacao, usuario) -> Transacao:
    if usuario.id != transacao.dono_id:
        raise PermissaoNegadaError('Apenas o dono do livro pode recusar a solicitação.')
    if transacao.status != Transacao.Status.PENDENTE:
        raise EstadoInvalidoError('A transação precisa estar pendente para ser recusada.')
    transacao = _alterar_status(transacao, Transacao.Status.CANCELADA, usuario)
    _liberar_livros(transacao)
    return transacao


def cancelar_transacao(transacao: Transacao, usuario) -> Transacao:
    if usuario.id not in (transacao.solicitante_id, transacao.dono_id):
        raise PermissaoNegadaError('Você não participa desta transação.')
    if transacao.status not in (Transacao.Status.PENDENTE, Transacao.Status.ACEITA):
        raise EstadoInvalidoError('A transação não pode mais ser cancelada.')
    transacao = _alterar_status(transacao, Transacao.Status.CANCELADA, usuario)
    _liberar_livros(transacao)
    return transacao


def concluir_transacao(transacao: Transacao, usuario) -> Transacao:
    if usuario.id not in (transacao.solicitante_id, transacao.dono_id):
        raise PermissaoNegadaError('Você não participa desta transação.')
    if transacao.status != Transacao.Status.EM_POSSE:
        raise EstadoInvalidoError('A transação precisa estar em posse para ser concluída.')
    transacao = _alterar_status(transacao, Transacao.Status.CONCLUIDA, usuario)
    _liberar_livros(transacao)
    return transacao


def marcar_em_posse(transacao: Transacao, usuario) -> Transacao:
    if usuario.id not in (transacao.solicitante_id, transacao.dono_id):
        raise PermissaoNegadaError('Você não participa desta transação.')
    if transacao.status != Transacao.Status.ACEITA:
        raise EstadoInvalidoError('A transação precisa estar aceita para avançar.')
    return _alterar_status(transacao, Transacao.Status.EM_POSSE, usuario)


def _validar_disponibilidade(livros: Sequence[Livro]) -> None:
    for livro in livros:
        if not livro.disponivel:
            raise LivroIndisponivelError(f'O livro {livro.titulo} não está disponível.')


def _resolver_data_limite(tipo: str, livro_principal: Livro, data_limite):
    if tipo not in (Transacao.Tipo.EMPRESTIMO, Transacao.Tipo.ALUGUEL):
        return None
    if data_limite:
        return data_limite
    dias_prazo = livro_principal.prazo_emprestimo_dias
    if not dias_prazo:
        raise ValidationError('Defina um prazo de empréstimo para este livro.')
    return timezone.now().date() + timedelta(days=dias_prazo)


def _reservar_livros(livros: Iterable[Livro]) -> None:
    for livro in livros:
        if livro.disponivel:
            livro.disponivel = False
            livro.save(update_fields=['disponivel'])


def _liberar_livros(transacao: Transacao) -> None:
    for livro in _livros_relacionados(transacao):
        if not livro.disponivel:
            livro.disponivel = True
            livro.save(update_fields=['disponivel'])


def _livros_relacionados(transacao: Transacao) -> set[Livro]:
    livros = {transacao.livro_principal}
    livros.update(transacao.livros_oferecidos.all())
    livros.update(transacao.livros_solicitados.all())
    return livros


def _alterar_status(transacao: Transacao, novo_status: str, usuario) -> Transacao:
    if transacao.status == novo_status:
        return transacao
    status_anterior = transacao.status
    transacao.status = novo_status
    transacao.save(update_fields=['status', 'atualizado_em'])
    HistoricoTransacao.objects.create(
        transacao=transacao,
        status_anterior=status_anterior,
        status_novo=novo_status,
        usuario=usuario,
    )
    return transacao

