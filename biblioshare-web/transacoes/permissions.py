from typing import Optional

from rest_framework import permissions

from .models import Transacao


class EhParticipanteDaTransacao(permissions.BasePermission):
    message = 'Você não tem permissão para acessar esta transação.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        transacao = self._obter_transacao(view)
        return self._usuario_participa(request.user, transacao)

    def has_object_permission(self, request, view, obj):
        transacao = obj if isinstance(obj, Transacao) else getattr(obj, 'transacao', None)
        if transacao is None:
            transacao = self._obter_transacao(view)
        return self._usuario_participa(request.user, transacao)

    def _obter_transacao(self, view):
        if hasattr(view, 'get_transacao'):
            return view.get_transacao()
        return None

    def _usuario_participa(self, usuario, transacao: Optional[Transacao]) -> bool:
        if not transacao or not usuario.is_authenticated:
            return False
        return usuario.id in (transacao.solicitante_id, transacao.dono_id)

