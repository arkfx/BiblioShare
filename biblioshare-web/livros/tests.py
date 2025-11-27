from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import ListaDesejo, Livro

User = get_user_model()


class LivrosBaseTestCase(TestCase):
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
        self.api_client = APIClient()
        self.api_client.force_authenticate(self.usuario)

    def criar_livro(self, dono=None, **kwargs):
        dados = {
            'dono': dono or self.usuario,
            'isbn': kwargs.pop('isbn', '1234567890'),
            'titulo': kwargs.pop('titulo', 'Livro de Teste'),
            'autor': kwargs.pop('autor', 'Autor'),
            'editora': kwargs.pop('editora', ''),
            'ano_publicacao': kwargs.pop('ano_publicacao', ''),
            'capa_url': kwargs.pop('capa_url', ''),
            'sinopse': kwargs.pop('sinopse', ''),
            'modalidades': kwargs.pop('modalidades', [Livro.Modalidades.DOACAO]),
            'valor_aluguel_semanal': kwargs.pop('valor_aluguel_semanal', None),
            'prazo_emprestimo_dias': kwargs.pop('prazo_emprestimo_dias', None),
            'disponivel': kwargs.pop('disponivel', True),
        }
        dados.update(kwargs)
        return Livro.objects.create(**dados)


class MeusLivrosListCreateAPITests(LivrosBaseTestCase):
    def test_list_returns_only_books_from_authenticated_user(self):
        self.criar_livro(titulo='Meu 1')
        self.criar_livro(titulo='Meu 2')
        self.criar_livro(dono=self.outro_usuario, titulo='Outro Livro')

        url = reverse('livros_api:livros-lista')
        resposta = self.api_client.get(url)

        self.assertEqual(resposta.status_code, 200)
        titulos = {item['titulo'] for item in resposta.data}
        self.assertEqual(titulos, {'Meu 1', 'Meu 2'})

    def test_create_assigns_owner_automatically(self):
        url = reverse('livros_api:livros-lista')
        payload = {
            'titulo': 'Novo Livro',
            'modalidades': [Livro.Modalidades.DOACAO],
        }

        resposta = self.api_client.post(url, payload, format='json')

        self.assertEqual(resposta.status_code, 201)
        self.assertTrue(Livro.objects.filter(titulo='Novo Livro', dono=self.usuario).exists())


class LivroDetalheAPITests(LivrosBaseTestCase):
    def test_owner_can_retrieve_livro(self):
        livro = self.criar_livro()

        resposta = self.api_client.get(reverse('livros_api:livros-detalhe', args=[livro.pk]))

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['id'], livro.id)

    def test_other_user_gets_404(self):
        livro = self.criar_livro(dono=self.outro_usuario)

        resposta = self.api_client.get(reverse('livros_api:livros-detalhe', args=[livro.pk]))

        self.assertEqual(resposta.status_code, 404)


class LivroBuscarIsbnAPITests(LivrosBaseTestCase):
    @patch('livros.views.buscar_livro_por_isbn', return_value={'titulo': 'Encontrado'})
    def test_returns_data_when_isbn_is_found(self, mock_busca):
        url = reverse('livros_api:livros-buscar-isbn')

        resposta = self.api_client.post(url, {'isbn': '9781234567897'}, format='json')

        self.assertEqual(resposta.status_code, 200)
        mock_busca.assert_called_once_with('9781234567897')
        self.assertEqual(resposta.data['titulo'], 'Encontrado')

    @patch('livros.views.buscar_livro_por_isbn', return_value=None)
    def test_returns_404_when_service_does_not_find_data(self, mock_busca):
        url = reverse('livros_api:livros-buscar-isbn')

        resposta = self.api_client.post(url, {'isbn': '000'}, format='json')

        self.assertEqual(resposta.status_code, 404)
        mock_busca.assert_called_once()


class ListaDesejosAPITests(LivrosBaseTestCase):
    def test_list_is_scoped_to_authenticated_user(self):
        ListaDesejo.objects.create(usuario=self.usuario, titulo='Desejado 1')
        ListaDesejo.objects.create(usuario=self.usuario, titulo='Desejado 2')
        ListaDesejo.objects.create(usuario=self.outro_usuario, titulo='Outro Desejo')

        resposta = self.api_client.get(reverse('livros_api:lista-desejos-lista'))

        self.assertEqual(resposta.status_code, 200)
        titulos = {item['titulo'] for item in resposta.data}
        self.assertEqual(titulos, {'Desejado 1', 'Desejado 2'})

    def test_create_binds_item_to_authenticated_user(self):
        url = reverse('livros_api:lista-desejos-lista')
        resposta = self.api_client.post(url, {'titulo': 'Novo desejo'}, format='json')

        self.assertEqual(resposta.status_code, 201)
        self.assertTrue(ListaDesejo.objects.filter(usuario=self.usuario, titulo='Novo desejo').exists())

    def test_destroy_allows_owner_to_remove_item(self):
        item = ListaDesejo.objects.create(usuario=self.usuario, titulo='Remover')

        resposta = self.api_client.delete(
            reverse('livros_api:lista-desejos-detalhe', args=[item.pk]),
        )

        self.assertEqual(resposta.status_code, 204)
        self.assertFalse(ListaDesejo.objects.filter(pk=item.pk).exists())


class LivrosViewsTests(LivrosBaseTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.usuario)

    def test_meus_livros_view_includes_total_count(self):
        self.criar_livro(titulo='Meu 1')
        self.criar_livro(titulo='Meu 2')
        self.criar_livro(dono=self.outro_usuario, titulo='Outro Livro')

        resposta = self.client.get(reverse('livros_web:meus-livros'))

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.context['total_livros'], 2)
        titulos = {livro.titulo for livro in resposta.context['livros']}
        self.assertEqual(titulos, {'Meu 1', 'Meu 2'})

    def test_adicionar_livro_prefills_data_from_isbn_lookup(self):
        url = reverse('livros_web:adicionar-livro')
        dados_google = {'titulo': 'Livro Google', 'autor': 'Autor Google', 'sinopse': 'Resumo'}
        with patch('livros.views.normalizar_isbn', return_value='9781234567') as normalizar, patch(
            'livros.views.isbn_valido', return_value=True
        ) as validar, patch('livros.views.buscar_livro_por_isbn', return_value=dados_google):
            resposta = self.client.post(
                url,
                {
                    'acao_buscar_isbn': '1',
                    'isbn': '978-1234567',
                },
            )

        self.assertEqual(resposta.status_code, 200)
        form = resposta.context['form']
        self.assertEqual(form.data['titulo'], 'Livro Google')
        self.assertEqual(form.data['autor'], 'Autor Google')
        mensagens = list(get_messages(resposta.wsgi_request))
        self.assertTrue(any('Dados carregados' in mensagem.message for mensagem in mensagens))
        normalizar.assert_called_once()
        validar.assert_called_once()

    def test_detalhes_livro_view_allows_owner_to_delete(self):
        livro = self.criar_livro()
        url = reverse('livros_web:detalhes-livro', args=[livro.pk])

        resposta = self.client.post(url, {'acao_excluir': '1'})

        self.assertRedirects(resposta, reverse('livros_web:meus-livros'))
        self.assertFalse(Livro.objects.filter(pk=livro.pk).exists())

    def test_lista_desejos_view_removes_item(self):
        item = ListaDesejo.objects.create(usuario=self.usuario, titulo='Remover')
        url = reverse('livros_web:lista-desejos')

        resposta = self.client.post(url, {'remover_id': str(item.pk)})

        self.assertRedirects(resposta, reverse('livros_web:lista-desejos'))
        self.assertFalse(ListaDesejo.objects.filter(pk=item.pk).exists())
