from django.contrib.auth import password_validation
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Usuario


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'foto_perfil',
            'cidade',
            'estado',
            'vinculo_verificado',
        )
        read_only_fields = (
            'id',
            'username',
            'email',
            'vinculo_verificado',
        )


class RegistroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirmar_senha = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Usuario
        fields = (
            'username',
            'email',
            'first_name',
            'last_name',
            'senha',
            'confirmar_senha',
            'cidade',
            'estado',
        )

    def validate_email(self, value: str) -> str:
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_('Já existe um usuário registrado com este e-mail.'))
        return value

    def validate(self, attrs):
        senha = attrs.get('senha')
        confirmar = attrs.pop('confirmar_senha', None)
        if senha != confirmar:
            raise serializers.ValidationError(_('As senhas não conferem.'))
        password_validation.validate_password(
            senha,
            user=Usuario(
                username=attrs.get('username'),
                email=attrs.get('email'),
            ),
        )
        return attrs

    def create(self, validated_data):
        senha = validated_data.pop('senha')
        usuario = Usuario.objects.create_user(
            password=senha,
            **validated_data,
        )
        return usuario


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        email = attrs.get('email')
        senha = attrs.get('senha')
        try:
            usuario = Usuario.objects.get(email__iexact=email)
        except Usuario.DoesNotExist as exc:
            raise serializers.ValidationError(_('E-mail ou senha inválidos.')) from exc

        if not usuario.check_password(senha):
            raise serializers.ValidationError(_('E-mail ou senha inválidos.'))

        if not usuario.is_active:
            raise serializers.ValidationError(_('Sua conta está desativada.'))

        attrs['usuario'] = usuario
        return attrs

