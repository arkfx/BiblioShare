from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import Usuario


class BootstrapFormMixin:
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            classes = field.widget.attrs.get('class', '')
            field.widget.attrs['class'] = f'{classes} form-control'.strip()


class EntrarForm(BootstrapFormMixin, forms.Form):
    email = forms.EmailField(label='E-mail')
    senha = forms.CharField(label='Senha', widget=forms.PasswordInput)

    def clean(self):
        cleaned = super().clean()
        email = cleaned.get('email')
        senha = cleaned.get('senha')
        if email and senha:
            try:
                usuario = Usuario.objects.get(email__iexact=email)
            except Usuario.DoesNotExist as exc:
                raise forms.ValidationError('E-mail ou senha inválidos.') from exc

            if not usuario.check_password(senha):
                raise forms.ValidationError('E-mail ou senha inválidos.')

            if not usuario.is_active:
                raise forms.ValidationError('Sua conta está inativa.')

            cleaned['usuario'] = usuario
        return cleaned


class RegistrarUsuarioForm(BootstrapFormMixin, UserCreationForm):
    email = forms.EmailField(label='E-mail')

    class Meta(UserCreationForm.Meta):
        model = Usuario
        fields = (
            'username',
            'email',
            'first_name',
            'last_name',
            'cidade',
            'estado',
        )

    def clean_email(self):
        email = self.cleaned_data['email']
        if Usuario.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('Já existe um usuário registrado com este e-mail.')
        return email


class PerfilForm(BootstrapFormMixin, forms.ModelForm):
    class Meta:
        model = Usuario
        fields = (
            'first_name',
            'last_name',
            'foto_perfil',
            'cidade',
            'estado',
        )

