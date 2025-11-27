from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Transacao(models.Model):
    class Tipo(models.TextChoices):
        DOACAO = 'DOACAO', 'Doação'
        EMPRESTIMO = 'EMPRESTIMO', 'Empréstimo'
        ALUGUEL = 'ALUGUEL', 'Aluguel'
        TROCA = 'TROCA', 'Troca'

    class Status(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        ACEITA = 'ACEITA', 'Aceita'
        EM_POSSE = 'EM_POSSE', 'Em posse'
        CONCLUIDA = 'CONCLUIDA', 'Concluída'
        CANCELADA = 'CANCELADA', 'Cancelada'

    tipo = models.CharField('tipo', max_length=20, choices=Tipo.choices)
    status = models.CharField('status', max_length=20, choices=Status.choices, default=Status.PENDENTE)
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transacoes_solicitadas',
        verbose_name='solicitante',
    )
    dono = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transacoes_recebidas',
        verbose_name='dono',
    )
    livro_principal = models.ForeignKey(
        'livros.Livro',
        on_delete=models.CASCADE,
        related_name='transacoes_principais',
        verbose_name='livro principal',
    )
    livros_oferecidos = models.ManyToManyField(
        'livros.Livro',
        related_name='transacoes_oferecidas',
        verbose_name='livros oferecidos',
        blank=True,
    )
    livros_solicitados = models.ManyToManyField(
        'livros.Livro',
        related_name='transacoes_solicitadas_livros',
        verbose_name='livros solicitados',
        blank=True,
    )
    data_limite_devolucao = models.DateField('data limite de devolução', null=True, blank=True)
    criado_em = models.DateTimeField('criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('atualizado em', auto_now=True)

    class Meta:
        ordering = ('-criado_em',)
        verbose_name = 'Transação'
        verbose_name_plural = 'Transações'

    def __str__(self):
        return f'{self.get_tipo_display()} · {self.livro_principal.titulo} · {self.get_status_display()}'

    def clean(self):
        super().clean()
        if self.solicitante_id and self.dono_id and self.solicitante_id == self.dono_id:
            raise ValidationError('Uma transação não pode ocorrer com o mesmo usuário.')
        if self.tipo in (self.Tipo.EMPRESTIMO, self.Tipo.ALUGUEL) and not self.data_limite_devolucao:
            raise ValidationError({'data_limite_devolucao': 'Informe a data limite de devolução.'})
        if self.tipo == self.Tipo.TROCA and self.pk:
            if not self.livros_oferecidos.exists():
                raise ValidationError('Selecione pelo menos um livro oferecido na troca.')
            if not self.livros_solicitados.exists():
                raise ValidationError('Selecione pelo menos um livro solicitado na troca.')


class HistoricoTransacao(models.Model):
    transacao = models.ForeignKey(
        Transacao,
        on_delete=models.CASCADE,
        related_name='historicos',
        verbose_name='transação',
    )
    status_anterior = models.CharField('status anterior', max_length=20, choices=Transacao.Status.choices)
    status_novo = models.CharField('status novo', max_length=20, choices=Transacao.Status.choices)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='historicos_transacoes',
        verbose_name='usuário',
    )
    criado_em = models.DateTimeField('criado em', auto_now_add=True)

    class Meta:
        ordering = ('-criado_em',)
        verbose_name = 'Histórico de transação'
        verbose_name_plural = 'Históricos de transação'

    def __str__(self):
        return f'{self.transacao_id} · {self.get_status_anterior_display()} → {self.get_status_novo_display()}'
