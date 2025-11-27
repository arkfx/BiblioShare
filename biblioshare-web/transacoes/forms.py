from django import forms

from livros.models import Livro


class ProporTrocaForm(forms.Form):
    livros_oferecidos = forms.ModelMultipleChoiceField(
        queryset=Livro.objects.none(),
        label='Livros oferecidos',
        required=True,
        widget=forms.SelectMultiple(attrs={'class': 'form-select', 'size': 8}),
    )
    livros_solicitados = forms.ModelMultipleChoiceField(
        queryset=Livro.objects.none(),
        label='Livros adicionais desejados',
        required=False,
        widget=forms.SelectMultiple(attrs={'class': 'form-select', 'size': 8}),
    )

    def __init__(self, *args, usuario=None, livro_principal=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.usuario = usuario
        self.livro_principal = livro_principal
        if usuario:
            self.fields['livros_oferecidos'].queryset = (
                Livro.objects.filter(dono=usuario, disponivel=True).order_by('titulo')
            )
        if livro_principal:
            queryset = (
                Livro.objects.filter(dono=livro_principal.dono, disponivel=True)
                .exclude(pk=livro_principal.pk)
                .order_by('titulo')
            )
            self.fields['livros_solicitados'].queryset = queryset

