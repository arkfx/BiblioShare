from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


class Livro(models.Model):
    class Modalidades(models.TextChoices):
        DOACAO = 'DOACAO', 'Doação'
        EMPRESTIMO = 'EMPRESTIMO', 'Empréstimo'
        ALUGUEL = 'ALUGUEL', 'Aluguel'
        TROCA = 'TROCA', 'Troca'

    dono = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='livros',
        verbose_name='dono',
    )
    isbn = models.CharField(
        'ISBN',
        max_length=20,
        blank=True,
        db_index=True,
    )
    titulo = models.CharField('título', max_length=255)
    autor = models.CharField('autor', max_length=255, blank=True)
    editora = models.CharField('editora', max_length=255, blank=True)
    ano_publicacao = models.CharField('ano de publicação', max_length=4, blank=True)
    capa_url = models.URLField('URL da capa', blank=True)
    sinopse = models.TextField('sinopse', blank=True)
    modalidades = models.JSONField('modalidades', default=list)
    valor_aluguel_semanal = models.DecimalField(
        'valor semanal do aluguel',
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    prazo_emprestimo_dias = models.PositiveIntegerField(
        'prazo do empréstimo (dias)',
        null=True,
        blank=True,
    )
    disponivel = models.BooleanField('disponível', default=True)
    criado_em = models.DateTimeField('criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('atualizado em', auto_now=True)

    class Meta:
        ordering = ('-criado_em',)
        verbose_name = 'Livro'
        verbose_name_plural = 'Livros'

    def __str__(self) -> str:
        return f'{self.titulo} ({self.dono.get_full_name() or self.dono.username})'

    def clean(self):
        super().clean()
        modalidades = self.modalidades or []
        if not isinstance(modalidades, list):
            raise ValidationError({'modalidades': _('Formato inválido para modalidades.')})
        modalidades_invalidas = [
            modalidade for modalidade in modalidades if modalidade not in self.Modalidades.values
        ]
        if modalidades_invalidas:
            raise ValidationError({'modalidades': _('Modalidade desconhecida informada.')})
        if not modalidades:
            raise ValidationError({'modalidades': _('Selecione ao menos uma modalidade.')})
        if self.Modalidades.ALUGUEL in modalidades and self.valor_aluguel_semanal is None:
            raise ValidationError(
                {'valor_aluguel_semanal': _('Informe o valor semanal para livros em aluguel.')}
            )
        if self.Modalidades.EMPRESTIMO in modalidades and self.prazo_emprestimo_dias is None:
            raise ValidationError(
                {'prazo_emprestimo_dias': _('Informe o prazo do empréstimo em dias.')}
            )


class ListaDesejo(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listas_desejo',
        verbose_name='usuário',
    )
    titulo = models.CharField('título desejado', max_length=255, blank=True)
    autor = models.CharField('autor desejado', max_length=255, blank=True)
    isbn = models.CharField('ISBN desejado', max_length=20, blank=True)
    criado_em = models.DateTimeField('criado em', auto_now_add=True)

    class Meta:
        ordering = ('-criado_em',)
        verbose_name = 'Item da lista de desejos'
        verbose_name_plural = 'Lista de desejos'

    def __str__(self) -> str:
        return self.titulo or self.autor or self.isbn or f'Lista de {self.usuario}'

    def clean(self):
        super().clean()
        if not any([self.titulo.strip(), self.autor.strip(), self.isbn.strip()]):
            raise ValidationError(
                _('Informe pelo menos título, autor ou ISBN para um item da lista de desejos.')
            )
