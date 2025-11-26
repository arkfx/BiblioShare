from django.contrib import admin

from .models import ListaDesejo, Livro


@admin.register(Livro)
class LivroAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'dono', 'listar_modalidades', 'disponivel', 'criado_em')
    list_filter = ('disponivel',)
    search_fields = ('titulo', 'autor', 'isbn', 'dono__username', 'dono__first_name', 'dono__last_name')
    autocomplete_fields = ('dono',)
    date_hierarchy = 'criado_em'

    @staticmethod
    def listar_modalidades(obj: Livro) -> str:
        return ', '.join(obj.modalidades or [])

    listar_modalidades.short_description = 'Modalidades'


@admin.register(ListaDesejo)
class ListaDesejoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'titulo', 'autor', 'isbn', 'criado_em')
    search_fields = ('titulo', 'autor', 'isbn', 'usuario__username', 'usuario__first_name', 'usuario__last_name')
    autocomplete_fields = ('usuario',)
    date_hierarchy = 'criado_em'
