from django.urls import path

from .views import ProporTrocaView, TransacaoDetalhesView, TransacoesListaView

app_name = 'transacoes_web'

urlpatterns = [
    path('transacoes/', TransacoesListaView.as_view(), name='lista'),
    path('transacoes/<int:pk>/', TransacaoDetalhesView.as_view(), name='detalhes'),
    path('transacoes/propor-troca/<int:livro_id>/', ProporTrocaView.as_view(), name='propor-troca'),
]

