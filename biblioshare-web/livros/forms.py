from django import forms

from .models import ListaDesejo, Livro


class LivroForm(forms.ModelForm):
    modalidades = forms.MultipleChoiceField(
        label='Modalidades disponíveis',
        choices=Livro.Modalidades.choices,
        widget=forms.CheckboxSelectMultiple,
    )

    class Meta:
        model = Livro
        fields = (
            'isbn',
            'titulo',
            'autor',
            'editora',
            'ano_publicacao',
            'capa_url',
            'sinopse',
            'modalidades',
            'valor_aluguel_semanal',
            'prazo_emprestimo_dias',
            'disponivel',
        )
        widgets = {
            'sinopse': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['modalidades'].initial = self.instance.modalidades
        for nome, campo in self.fields.items():
            widget = campo.widget
            input_type = getattr(widget, 'input_type', None)
            if nome == 'modalidades' or input_type == 'checkbox':
                widget.attrs.setdefault('class', '')
            else:
                classes = widget.attrs.get('class', '')
                widget.attrs['class'] = f'{classes} form-control'.strip()

    def clean_modalidades(self):
        modalidades = self.cleaned_data.get('modalidades') or []
        if not modalidades:
            raise forms.ValidationError('Selecione ao menos uma modalidade.')
        return modalidades


class ListaDesejoForm(forms.ModelForm):
    class Meta:
        model = ListaDesejo
        fields = ('titulo', 'autor', 'isbn')
        widgets = {
            'titulo': forms.TextInput(attrs={'placeholder': 'Título desejado'}),
            'autor': forms.TextInput(attrs={'placeholder': 'Autor desejado'}),
            'isbn': forms.TextInput(attrs={'placeholder': 'ISBN opcional'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for campo in self.fields.values():
            classes = campo.widget.attrs.get('class', '')
            campo.widget.attrs['class'] = f'{classes} form-control'.strip()

