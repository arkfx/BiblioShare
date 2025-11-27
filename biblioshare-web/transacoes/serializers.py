from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from livros.models import Livro
from usuarios.models import Usuario

from .models import Transacao
from .services import (
    ErroTransacao,
    LivroIndisponivelError,
    PermissaoNegadaError,
    criar_transacao_solicitacao,
)


class TransacaoUsuarioResumoSerializer(serializers.ModelSerializer):
    nome_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ('id', 'nome_completo', 'cidade', 'estado')
        read_only_fields = fields

    def get_nome_completo(self, obj: Usuario) -> str:
        return obj.get_full_name() or obj.username


class TransacaoLivroResumoSerializer(serializers.ModelSerializer):
    dono_nome = serializers.SerializerMethodField()
    dono_cidade = serializers.CharField(source='dono.cidade', read_only=True)
    dono_estado = serializers.CharField(source='dono.estado', read_only=True)

    class Meta:
        model = Livro
        fields = (
            'id',
            'titulo',
            'autor',
            'modalidades',
            'dono_nome',
            'dono_cidade',
            'dono_estado',
        )
        read_only_fields = fields

    def get_dono_nome(self, obj: Livro) -> str:
        return obj.dono.get_full_name() or obj.dono.username


class TransacaoSerializer(serializers.ModelSerializer):
    solicitante = TransacaoUsuarioResumoSerializer(read_only=True)
    dono = TransacaoUsuarioResumoSerializer(read_only=True)
    livro_principal = TransacaoLivroResumoSerializer(read_only=True)
    livros_oferecidos = TransacaoLivroResumoSerializer(many=True, read_only=True)
    livros_solicitados = TransacaoLivroResumoSerializer(many=True, read_only=True)

    class Meta:
        model = Transacao
        fields = (
            'id',
            'tipo',
            'status',
            'solicitante',
            'dono',
            'livro_principal',
            'livros_oferecidos',
            'livros_solicitados',
            'data_limite_devolucao',
            'criado_em',
            'atualizado_em',
        )
        read_only_fields = fields


class TransacaoCriarSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=Transacao.Tipo.choices)
    livro_principal = serializers.PrimaryKeyRelatedField(queryset=Livro.objects.all())
    livros_oferecidos_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )
    livros_solicitados_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )
    data_limite_devolucao = serializers.DateField(required=False, allow_null=True)

    def validate(self, attrs):
        tipo = attrs.get('tipo')
        solicitante = self.context['request'].user
        livro_principal: Livro = attrs['livro_principal']
        if livro_principal.dono_id == solicitante.id:
            raise serializers.ValidationError('Você não pode solicitar um livro do próprio inventário.')
        if tipo == Transacao.Tipo.TROCA and not attrs.get('livros_oferecidos_ids'):
            raise serializers.ValidationError('Selecione pelo menos um livro oferecido para a troca.')
        if tipo != Transacao.Tipo.TROCA:
            attrs['livros_oferecidos_ids'] = []
            attrs['livros_solicitados_ids'] = []
        return attrs

    def create(self, validated_data):
        solicitante = self.context['request'].user
        livro_principal: Livro = validated_data['livro_principal']
        tipo = validated_data['tipo']
        livros_oferecidos_ids = validated_data.get('livros_oferecidos_ids') or []
        livros_solicitados_ids = validated_data.get('livros_solicitados_ids') or []
        data_limite = validated_data.get('data_limite_devolucao')
        try:
            return criar_transacao_solicitacao(
                solicitante,
                livro_principal.id,
                tipo,
                livros_oferecidos_ids=livros_oferecidos_ids,
                livros_solicitados_ids=livros_solicitados_ids,
                data_limite=data_limite,
            )
        except PermissaoNegadaError as erro:
            raise PermissionDenied(str(erro)) from erro
        except LivroIndisponivelError as erro:
            raise serializers.ValidationError(str(erro)) from erro
        except ValidationError as erro:  # noqa: F821
            raise serializers.ValidationError(erro.message) from erro
        except ErroTransacao as erro:
            raise serializers.ValidationError(str(erro)) from erro

    def to_representation(self, instance):
        return TransacaoSerializer(instance, context=self.context).data

