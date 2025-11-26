from typing import List

from rest_framework import serializers

from .models import ListaDesejo, Livro


class LivroSerializer(serializers.ModelSerializer):
    modalidades = serializers.ListField(
        child=serializers.ChoiceField(choices=Livro.Modalidades.choices),
        allow_empty=False,
    )
    dono_cidade = serializers.CharField(
        source='dono.cidade',
        read_only=True,
    )
    dono_estado = serializers.CharField(
        source='dono.estado',
        read_only=True,
    )

    class Meta:
        model = Livro
        fields = (
            'id',
            'dono',
             'dono_cidade',
             'dono_estado',
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
            'criado_em',
            'atualizado_em',
        )
        read_only_fields = (
            'id',
            'dono',
            'dono_cidade',
            'dono_estado',
            'criado_em',
            'atualizado_em',
        )

    def validate(self, attrs):
        modalidades: List[str] = attrs.get('modalidades', [])
        if Livro.Modalidades.ALUGUEL in modalidades and not attrs.get('valor_aluguel_semanal'):
            raise serializers.ValidationError(
                {'valor_aluguel_semanal': 'Informe o valor semanal para livros em aluguel.'}
            )
        if Livro.Modalidades.EMPRESTIMO in modalidades and not attrs.get('prazo_emprestimo_dias'):
            raise serializers.ValidationError(
                {'prazo_emprestimo_dias': 'Informe o prazo do empréstimo em dias.'}
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['dono'] = request.user
        return super().create(validated_data)


class ListaDesejoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListaDesejo
        fields = ('id', 'usuario', 'titulo', 'autor', 'isbn', 'criado_em')
        read_only_fields = ('id', 'usuario', 'criado_em')

    def validate(self, attrs):
        if not any([attrs.get('titulo'), attrs.get('autor'), attrs.get('isbn')]):
            raise serializers.ValidationError(
                'Informe pelo menos título, autor ou ISBN para adicionar à lista.'
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['usuario'] = request.user
        return super().create(validated_data)


class LivroBuscarIsbnSerializer(serializers.Serializer):
    isbn = serializers.CharField()

