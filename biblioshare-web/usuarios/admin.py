from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'cidade',
        'estado',
        'vinculo_verificado',
        'is_staff',
    )
    search_fields = (
        'username',
        'email',
        'first_name',
        'last_name',
        'cidade',
        'estado',
    )
    list_filter = (
        'vinculo_verificado',
        'is_staff',
        'is_superuser',
        'estado',
    )
    ordering = ('username',)
    fieldsets = UserAdmin.fieldsets + (
        (
            'Informacoes adicionais',
            {
                'fields': (
                    'foto_perfil',
                    'cidade',
                    'estado',
                    'vinculo_verificado',
                ),
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            'Informacoes adicionais',
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'cidade',
                    'estado',
                    'vinculo_verificado',
                ),
            },
        ),
    )
