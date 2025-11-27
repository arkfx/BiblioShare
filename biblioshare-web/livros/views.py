from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Case, IntegerField, Value, When
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import CreateView, FormView, ListView, TemplateView, UpdateView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import LivroFiltro
from .forms import ListaDesejoForm, LivroForm
from .models import ListaDesejo, Livro
from .serializers import (
    ListaDesejoSerializer,
    LivroBuscarIsbnSerializer,
    LivroSerializer,
)
from .services import buscar_livro_por_isbn, isbn_valido, normalizar_isbn


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


class LivroBuscaAPIView(generics.ListAPIView):
    serializer_class = LivroSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = LivroFiltro

    def get_queryset(self):
        queryset = Livro.objects.filter(disponivel=True)
        if self.request.user.is_authenticated and self.request.user.cidade:
            cidade = self.request.user.cidade.strip()
            if cidade:
                queryset = queryset.annotate(
                    prioridade=Case(
                        When(dono__cidade__iexact=cidade, then=Value(0)),
                        default=Value(1),
                        output_field=IntegerField(),
                    )
                ).order_by('prioridade', '-criado_em')
                return queryset
        return queryset.order_by('-criado_em')


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

    def post(self, request, *args, **kwargs):
        self.object = None
        if 'acao_buscar_isbn' in request.POST:
            isbn_informado = (request.POST.get('isbn') or '').strip()
            isbn = normalizar_isbn(isbn_informado)
            if not isbn:
                messages.error(request, 'Informe um ISBN para buscar.')
                form = self.get_form()
                return self.render_to_response(self.get_context_data(form=form))
            if not isbn_valido(isbn):
                messages.error(
                    request,
                    'Informe um ISBN válido com 10 ou 13 dígitos. Traços e espaços são aceitos.',
                )
                form = self.get_form()
                return self.render_to_response(self.get_context_data(form=form))
            dados = buscar_livro_por_isbn(isbn)
            if not dados:
                messages.warning(request, 'Não encontramos informações para este ISBN.')
                form = self.get_form()
                return self.render_to_response(self.get_context_data(form=form))
            data = request.POST.copy()
            for campo in ['titulo', 'autor', 'editora', 'ano_publicacao', 'capa_url', 'sinopse']:
                valor = dados.get(campo)
                if valor:
                    data[campo] = valor
            form = self.form_class(data=data)
            messages.success(
                request,
                'Dados carregados do Google Books. Revise as informações antes de salvar.',
            )
            return self.render_to_response(self.get_context_data(form=form))
        return super().post(request, *args, **kwargs)

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


class BuscarLivrosView(ListView):
    template_name = 'livros/buscar.html'
    context_object_name = 'livros'
    paginate_by = 12

    def get_queryset(self):
        queryset = Livro.objects.filter(disponivel=True)
        self.filtro = LivroFiltro(self.request.GET or None, queryset=queryset)
        return self.filtro.qs

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        parametros = self.request.GET.copy()
        if 'page' in parametros:
            parametros.pop('page')
        contexto['filtro'] = self.filtro
        contexto['modalidades_opcoes'] = Livro.Modalidades.choices
        contexto['ordenacoes'] = LivroFiltro.ORDENACOES
        contexto['parametros_sem_pagina'] = parametros.urlencode()
        return contexto


class VitrineLivrosView(TemplateView):
    template_name = 'livros/vitrine.html'

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)
        base_queryset = Livro.objects.filter(disponivel=True)
        filtro = LivroFiltro(self.request.GET or None, queryset=base_queryset)
        livros_filtrados = filtro.qs
        cidade_usuario = ''
        if self.request.user.is_authenticated and self.request.user.cidade:
            cidade_usuario = self.request.user.cidade.strip()
        if cidade_usuario:
            livros_proximos = livros_filtrados.filter(dono__cidade__iexact=cidade_usuario)
            livros_outros = livros_filtrados.exclude(dono__cidade__iexact=cidade_usuario)
        else:
            livros_proximos = Livro.objects.none()
            livros_outros = livros_filtrados
        contexto['filtro'] = filtro
        contexto['modalidades_opcoes'] = Livro.Modalidades.choices
        contexto['ordenacoes'] = LivroFiltro.ORDENACOES
        contexto['livros_proximos'] = livros_proximos
        contexto['livros_outros'] = livros_outros
        contexto['cidade_usuario'] = cidade_usuario
        return contexto
