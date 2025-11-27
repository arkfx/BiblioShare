from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from livros.models import Livro
from .models import Mensagem, Transacao
from .services import PermissaoNegadaError

User = get_user_model()


class TransacoesBaseTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.usuario = User.objects.create_user(
            username='usuario',
            email='usuario@example.com',
            password='SenhaSegura123',
        )
        self.outro_usuario = User.objects.create_user(
            username='outro',
            email='outro@example.com',
            password='SenhaSegura123',
        )
        self.terceiro_usuario = User.objects.create_user(
            username='terceiro',
            email='terceiro@example.com',
            password='SenhaSegura123',
        )
        self.api_client = APIClient()
        self.api_client.force_authenticate(self.usuario)

    def criar_livro(self, dono=None, **kwargs):
        dados = {
            'dono': dono or self.outro_usuario,
            'isbn': kwargs.pop('isbn', '1234567890'),
            'titulo': kwargs.pop('titulo', 'Livro Transacao'),
            'autor': kwargs.pop('autor', 'Autor'),
            'modalidades': kwargs.pop('modalidades', [Livro.Modalidades.DOACAO]),
            'disponivel': kwargs.pop('disponivel', True),
        }
        dados.update(kwargs)
        return Livro.objects.create(**dados)

    def criar_transacao(
        self,
        solicitante=None,
        dono=None,
        livro=None,
        tipo=Transacao.Tipo.DOACAO,
        status=Transacao.Status.PENDENTE,
    ):
        livro_final = livro or self.criar_livro(dono=dono)
        dono_final = dono or livro_final.dono
        solicitante_final = solicitante or self.usuario
        transacao = Transacao.objects.create(
            tipo=tipo,
            status=status,
            solicitante=solicitante_final,
            dono=dono_final,
            livro_principal=livro_final,
        )
        transacao.livros_solicitados.add(livro_final)
        return transacao


class TransacaoListCreateAPITests(TransacoesBaseTestCase):
    def test_list_returns_only_transactions_where_user_is_participant(self):
        participante = self.criar_transacao()
        como_dono = self.criar_transacao(
            solicitante=self.outro_usuario,
            dono=self.usuario,
            livro=self.criar_livro(dono=self.usuario, titulo='Livro do Dono'),
        )
        self.criar_transacao(
            solicitante=self.outro_usuario,
            dono=self.terceiro_usuario,
            livro=self.criar_livro(dono=self.terceiro_usuario, titulo='Outro Livro'),
        )

        resposta = self.api_client.get(reverse('transacoes_api:transacoes-lista'))

        self.assertEqual(resposta.status_code, 200)
        ids_retornados = {item['id'] for item in resposta.data}
        self.assertEqual(ids_retornados, {participante.id, como_dono.id})

    def test_create_uses_service_and_returns_serialized_payload(self):
        livro = self.criar_livro(dono=self.outro_usuario, titulo='Livro Alvo')
        existente = self.criar_transacao(
            solicitante=self.usuario,
            dono=self.outro_usuario,
            livro=livro,
        )
        url = reverse('transacoes_api:transacoes-lista')
        payload = {
            'tipo': Transacao.Tipo.DOACAO,
            'livro_principal': livro.pk,
        }

        with patch('transacoes.serializers.criar_transacao_solicitacao', return_value=existente) as mock_criar:
            resposta = self.api_client.post(url, payload, format='json')

        self.assertEqual(resposta.status_code, 201)
        mock_criar.assert_called_once()
        self.assertEqual(resposta.data['id'], existente.id)


class TransacaoAcoesAPITests(TransacoesBaseTestCase):
    def setUp(self):
        super().setUp()
        self.transacao = self.criar_transacao()

    def test_aceitar_transacao_returns_updated_payload(self):
        with patch('transacoes.views.aceitar_solicitacao', return_value=self.transacao) as mock_aceitar:
            resposta = self.api_client.post(
                reverse('transacoes_api:transacoes-aceitar', args=[self.transacao.pk])
            )

        self.assertEqual(resposta.status_code, 200)
        mock_aceitar.assert_called_once()

    def test_aceitar_transacao_handles_permission_error(self):
        with patch(
            'transacoes.views.aceitar_solicitacao',
            side_effect=PermissaoNegadaError('Não autorizado'),
        ):
            resposta = self.api_client.post(
                reverse('transacoes_api:transacoes-aceitar', args=[self.transacao.pk])
            )

        self.assertEqual(resposta.status_code, 403)

    def test_recusar_transacao_calls_service(self):
        with patch('transacoes.views.recusar_solicitacao', return_value=self.transacao) as mock_recusar:
            resposta = self.api_client.post(
                reverse('transacoes_api:transacoes-recusar', args=[self.transacao.pk])
            )

        self.assertEqual(resposta.status_code, 200)
        mock_recusar.assert_called_once()

    def test_cancelar_transacao_calls_service(self):
        with patch('transacoes.views.cancelar_transacao', return_value=self.transacao) as mock_cancelar:
            resposta = self.api_client.post(
                reverse('transacoes_api:transacoes-cancelar', args=[self.transacao.pk])
            )

        self.assertEqual(resposta.status_code, 200)
        mock_cancelar.assert_called_once()


class MensagensTransacaoAPITests(TransacoesBaseTestCase):
    def setUp(self):
        super().setUp()
        self.transacao = self.criar_transacao()
        self.url = reverse('transacoes_api:transacoes-mensagens', args=[self.transacao.pk])

    def test_list_marks_messages_from_other_user_as_read(self):
        mensagem_outro = Mensagem.objects.create(
            transacao=self.transacao,
            remetente=self.outro_usuario,
            conteudo='Olá',
            lida=False,
        )
        mensagem_propria = Mensagem.objects.create(
            transacao=self.transacao,
            remetente=self.usuario,
            conteudo='Oi',
            lida=False,
        )

        resposta = self.api_client.get(self.url)

        self.assertEqual(resposta.status_code, 200)
        mensagem_outro.refresh_from_db()
        mensagem_propria.refresh_from_db()
        self.assertTrue(mensagem_outro.lida)
        self.assertFalse(mensagem_propria.lida)

    def test_list_supports_depois_de_filter(self):
        primeira = Mensagem.objects.create(
            transacao=self.transacao,
            remetente=self.outro_usuario,
            conteudo='Primeira',
            lida=False,
        )
        segunda = Mensagem.objects.create(
            transacao=self.transacao,
            remetente=self.outro_usuario,
            conteudo='Segunda',
            lida=False,
        )

        resposta = self.api_client.get(f'{self.url}?depois_de={primeira.id}')

        self.assertEqual(resposta.status_code, 200)
        ids = [item['id'] for item in resposta.data['results']]
        self.assertEqual(ids, [segunda.id])

    def test_create_assigns_authenticated_user(self):
        resposta = self.api_client.post(self.url, {'conteudo': 'Mensagem nova'}, format='json')

        self.assertEqual(resposta.status_code, 201)
        mensagem = Mensagem.objects.get(conteudo='Mensagem nova')
        self.assertEqual(mensagem.remetente, self.usuario)
        self.assertEqual(mensagem.transacao, self.transacao)


class TransacoesViewsTests(TransacoesBaseTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.usuario)

    def test_criar_transacao_simples_success_redirects_to_details(self):
        livro = self.criar_livro(dono=self.outro_usuario, titulo='Livro Público')
        transacao = self.criar_transacao(
            solicitante=self.usuario,
            dono=self.outro_usuario,
            livro=livro,
        )
        url = reverse('transacoes_web:criar-simples', kwargs={'tipo': 'doacao', 'livro_id': livro.pk})

        with patch('transacoes.views.criar_transacao_solicitacao', return_value=transacao) as mock_criar:
            resposta = self.client.post(url)

        self.assertRedirects(resposta, reverse('transacoes_web:detalhes', args=[transacao.pk]))
        mock_criar.assert_called_once_with(
            self.usuario,
            livro.id,
            Transacao.Tipo.DOACAO,
            livros_oferecidos_ids=[],
            livros_solicitados_ids=[],
            data_limite=None,
        )

    def test_criar_transacao_simples_invalid_tipo_sets_message(self):
        livro = self.criar_livro(dono=self.outro_usuario)
        url = reverse('transacoes_web:criar-simples', kwargs={'tipo': 'invalid', 'livro_id': livro.pk})

        resposta = self.client.post(url)

        self.assertRedirects(resposta, reverse('livros_web:oferta-livro', args=[livro.pk]))
        mensagens = list(get_messages(resposta.wsgi_request))
        self.assertTrue(any('Modalidade de transação inválida' in m.message for m in mensagens))

    def test_criar_transacao_simples_invalid_date_shows_error(self):
        livro = self.criar_livro(dono=self.outro_usuario)
        url = reverse('transacoes_web:criar-simples', kwargs={'tipo': 'emprestimo', 'livro_id': livro.pk})

        with patch('transacoes.views.parse_date', return_value=None):
            resposta = self.client.post(url, {'data_limite': '2023-15-99'})

        self.assertRedirects(resposta, reverse('livros_web:oferta-livro', args=[livro.pk]))
        mensagens = list(get_messages(resposta.wsgi_request))
        self.assertTrue(any('Informe uma data válida' in m.message for m in mensagens))

    def test_transacoes_lista_view_filters_by_status(self):
        self.criar_transacao(status=Transacao.Status.PENDENTE)
        transacao_aceita = self.criar_transacao(status=Transacao.Status.ACEITA)

        resposta = self.client.get(
            f"{reverse('transacoes_web:lista')}?status={Transacao.Status.ACEITA}"
        )

        self.assertEqual(resposta.status_code, 200)
        transacoes = list(resposta.context['transacoes'])
        self.assertEqual(len(transacoes), 1)
        self.assertEqual(transacoes[0].id, transacao_aceita.id)

    def test_transacao_detalhes_view_calls_services_based_on_action(self):
        livro = self.criar_livro(dono=self.usuario, titulo='Livro do Dono')
        transacao = self.criar_transacao(
            solicitante=self.outro_usuario,
            dono=self.usuario,
            livro=livro,
        )
        url = reverse('transacoes_web:detalhes', args=[transacao.pk])

        with patch('transacoes.views.aceitar_solicitacao') as mock_aceitar:
            mock_aceitar.return_value = transacao
            resposta = self.client.post(url, {'acao': 'aceitar'})

        self.assertRedirects(resposta, url)
        mock_aceitar.assert_called_once_with(transacao, self.usuario)
