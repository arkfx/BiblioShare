from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    email = models.EmailField('email', unique=True)
    foto_perfil = models.ImageField(
        'foto de perfil',
        upload_to='usuarios/fotos',
        blank=True,
        null=True,
    )
    cidade = models.CharField(
        'cidade',
        max_length=100,
        blank=True,
    )
    estado = models.CharField(
        'estado',
        max_length=50,
        blank=True,
    )
    vinculo_verificado = models.BooleanField(
        'vínculo verificado',
        default=False,
    )

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
