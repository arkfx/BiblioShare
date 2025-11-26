from django.db.models import Q
import django_filters

from .models import Livro


class LivroFiltro(django_filters.FilterSet):
    ORDENACOES = (
        ('recentes', 'Mais recentes'),
        ('titulo', 'Título A-Z'),
        ('cidade', 'Cidade'),
    )

    q = django_filters.CharFilter(method='filtrar_q')
    modalidade = django_filters.ChoiceFilter(
        choices=Livro.Modalidades.choices,
        method='filtrar_modalidade',
    )
    cidade = django_filters.CharFilter(
        field_name='dono__cidade',
        lookup_expr='icontains',
    )
    ordenacao = django_filters.ChoiceFilter(
        choices=ORDENACOES,
        method='ordenar',
    )

    class Meta:
        model = Livro
        fields = ['cidade']

    def filtrar_q(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(titulo__icontains=value) | Q(autor__icontains=value) | Q(isbn__icontains=value)
        )

    def filtrar_modalidade(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(modalidades__contains=[value])

    def ordenar(self, queryset, name, value):
        if value == 'titulo':
            return queryset.order_by('titulo')
        if value == 'cidade':
            return queryset.order_by('dono__cidade', '-criado_em')
        return queryset.order_by('-criado_em')

