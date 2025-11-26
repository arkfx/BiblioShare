from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, FormView, ListView, UpdateView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import ListaDesejoForm, LivroForm
from .models import ListaDesejo, Livro
from .serializers import (
    ListaDesejoSerializer,
    LivroBuscarIsbnSerializer,
    LivroSerializer,
)
from .services import buscar_livro_por_isbn


class MeusLivrosListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = LivroSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Livro.objects.filter(dono=self.request.user).order_by('-criado_em')

    def perform_create(self, serializer):
        serializer.save(dono=self.request.user)


class LivroDetalheAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LivroSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Livro.objects.filter(dono=self.request.user)


class LivroBuscarIsbnAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LivroBuscarIsbnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = buscar_livro_por_isbn(serializer.validated_data['isbn'])
        if not dados:
            return Response(
                {'detalhe': 'Não encontramos informações para este ISBN.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(dados, status=status.HTTP_200_OK)


class ListaDesejosListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ListaDesejoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListaDesejo.objects.filter(usuario=self.request.user).order_by('-criado_em')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class ListaDesejoDestroyAPIView(generics.DestroyAPIView):
    serializer_class = ListaDesejoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListaDesejo.objects.filter(usuario=self.request.user)


class MeusLivrosView(LoginRequiredMixin, ListView):
    template_name = 'livros/meus_livros.html'
    context_object_name = 'livros'

    def get_queryset(self):
        return Livro.objects.filter(dono=self.request.user).order_by('-criado_em')

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        contexto['total_livros'] = contexto['livros'].count()
        return contexto


class AdicionarLivroView(LoginRequiredMixin, CreateView):
    form_class = LivroForm
    template_name = 'livros/adicionar_livro.html'
    success_url = reverse_lazy('livros_web:meus-livros')

    def form_valid(self, form):
        form.instance.dono = self.request.user
        messages.success(self.request, 'Livro cadastrado com sucesso.')
        return super().form_valid(form)


class DetalhesLivroView(LoginRequiredMixin, UpdateView):
    form_class = LivroForm
    template_name = 'livros/detalhes_livro.html'
    context_object_name = 'livro'

    def get_queryset(self):
        return Livro.objects.filter(dono=self.request.user)

    def get_success_url(self):
        return reverse_lazy('livros_web:detalhes-livro', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, 'Livro atualizado com sucesso.')
        return super().form_valid(form)

    def post(self, request, *args, **kwargs):
        if 'acao_excluir' in request.POST:
            self.object = self.get_object()
            self.object.delete()
            messages.success(self.request, 'Livro removido do inventário.')
            return redirect('livros_web:meus-livros')
        return super().post(request, *args, **kwargs)


class ListaDesejosView(LoginRequiredMixin, FormView):
    template_name = 'livros/lista_desejos.html'
    form_class = ListaDesejoForm
    success_url = reverse_lazy('livros_web:lista-desejos')

    def form_valid(self, form):
        item = form.save(commit=False)
        item.usuario = self.request.user
        item.save()
        messages.success(self.request, 'Livro adicionado à lista de desejos.')
        return super().form_valid(form)

    def post(self, request, *args, **kwargs):
        if 'remover_id' in request.POST:
            ListaDesejo.objects.filter(usuario=request.user, pk=request.POST['remover_id']).delete()
            messages.success(request, 'Item removido da lista de desejos.')
            return redirect(self.get_success_url())
        return super().post(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        contexto['itens'] = ListaDesejo.objects.filter(usuario=self.request.user).order_by('-criado_em')
        return contexto
