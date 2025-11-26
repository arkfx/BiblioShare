from django.urls import path

from .views import (
    LivroBuscaAPIView,
    ListaDesejoDestroyAPIView,
    ListaDesejosListCreateAPIView,
    LivroBuscarIsbnAPIView,
    LivroDetalheAPIView,
    MeusLivrosListCreateAPIView,
)

app_name = 'livros_api'

urlpatterns = [
    path('livros/', MeusLivrosListCreateAPIView.as_view(), name='livros-lista'),
    path('livros/buscar/', LivroBuscaAPIView.as_view(), name='livros-busca'),
    path('livros/buscar-isbn/', LivroBuscarIsbnAPIView.as_view(), name='livros-buscar-isbn'),
    path('livros/<int:pk>/', LivroDetalheAPIView.as_view(), name='livros-detalhe'),
    path('lista-desejos/', ListaDesejosListCreateAPIView.as_view(), name='lista-desejos-lista'),
    path('lista-desejos/<int:pk>/', ListaDesejoDestroyAPIView.as_view(), name='lista-desejos-detalhe'),
]

