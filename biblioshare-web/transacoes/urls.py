from django.urls import path

from .views import (
    TransacaoAceitarAPIView,
    TransacaoCancelarAPIView,
    TransacaoDetailAPIView,
    TransacaoListCreateAPIView,
    TransacaoRecusarAPIView,
)

app_name = 'transacoes_api'

urlpatterns = [
    path('transacoes/', TransacaoListCreateAPIView.as_view(), name='transacoes-lista'),
    path('transacoes/<int:pk>/', TransacaoDetailAPIView.as_view(), name='transacoes-detalhe'),
    path('transacoes/<int:pk>/aceitar/', TransacaoAceitarAPIView.as_view(), name='transacoes-aceitar'),
    path('transacoes/<int:pk>/recusar/', TransacaoRecusarAPIView.as_view(), name='transacoes-recusar'),
    path('transacoes/<int:pk>/cancelar/', TransacaoCancelarAPIView.as_view(), name='transacoes-cancelar'),
]

