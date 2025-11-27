from django import forms

from livros.models import Livro


class ProporTrocaForm(forms.Form):
    livros_oferecidos = forms.ModelMultipleChoiceField(
        queryset=Livro.objects.none(),
        label='Livros oferecidos',
        required=True,
        widget=forms.SelectMultiple(attrs={'class': 'form-select', 'size': 8}),
    )

    def __init__(self, *args, usuario=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.usuario = usuario
        if usuario:
            self.fields['livros_oferecidos'].queryset = (
                Livro.objects.filter(dono=usuario, disponivel=True).order_by('titulo')
            )

