from django.urls import path

from .views import (
    AdicionarLivroView,
    BuscarLivrosView,
    DetalhesLivroView,
    ListaDesejosView,
    MeusLivrosView,
    OfertaLivroView,
    VitrineLivrosView,
)

app_name = 'livros_web'

urlpatterns = [
    path('meus-livros/', MeusLivrosView.as_view(), name='meus-livros'),
    path('meus-livros/adicionar/', AdicionarLivroView.as_view(), name='adicionar-livro'),
    path('meus-livros/<int:pk>/', DetalhesLivroView.as_view(), name='detalhes-livro'),
    path('lista-desejos/', ListaDesejosView.as_view(), name='lista-desejos'),
    path('buscar/', BuscarLivrosView.as_view(), name='buscar'),
    path('vitrine/', VitrineLivrosView.as_view(), name='vitrine'),
    path('oferta/<int:pk>/', OfertaLivroView.as_view(), name='oferta-livro'),
]

