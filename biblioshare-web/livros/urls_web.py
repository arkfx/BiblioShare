from django.urls import path

from .views import AdicionarLivroView, DetalhesLivroView, ListaDesejosView, MeusLivrosView

app_name = 'livros_web'

urlpatterns = [
    path('meus-livros/', MeusLivrosView.as_view(), name='meus-livros'),
    path('meus-livros/adicionar/', AdicionarLivroView.as_view(), name='adicionar-livro'),
    path('meus-livros/<int:pk>/', DetalhesLivroView.as_view(), name='detalhes-livro'),
    path('lista-desejos/', ListaDesejosView.as_view(), name='lista-desejos'),
]

