from django.contrib.auth import get_user_model
from django.contrib.messages import get_messages
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Usuario


class UsuariosBaseTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.User = get_user_model()
        self.usuario = self.User.objects.create_user(
            username='usuario',
            email='usuario@example.com',
            password='SenhaSegura123!',
            first_name='Usu',
        )
        self.api_client = APIClient()


class UsuariosAPITests(UsuariosBaseTestCase):
    def test_registro_api_creates_user_and_returns_tokens(self):
        url = reverse('usuarios_api:auth-registro')
        payload = {
            'username': 'novo_usuario',
            'email': 'novo@example.com',
            'first_name': 'Novo',
            'last_name': 'Usuário',
            'senha': 'SenhaMuitoForte123!',
            'confirmar_senha': 'SenhaMuitoForte123!',
            'cidade': 'Palmas',
            'estado': 'TO',
        }

        resposta = self.api_client.post(url, payload, format='json')

        self.assertEqual(resposta.status_code, 201)
        self.assertTrue(self.User.objects.filter(email='novo@example.com').exists())
        self.assertIn('tokens', resposta.data)
        self.assertIn('access', resposta.data['tokens'])

    def test_login_api_returns_tokens_for_valid_credentials(self):
        url = reverse('usuarios_api:auth-login')
        payload = {
            'email': self.usuario.email,
            'senha': 'SenhaSegura123!',
        }

        resposta = self.api_client.post(url, payload, format='json')

        self.assertEqual(resposta.status_code, 200)
        self.assertIn('tokens', resposta.data)
        self.assertEqual(resposta.data['usuario']['email'], self.usuario.email)

    def test_perfil_api_allows_retrieve_and_update(self):
        url = reverse('usuarios_api:auth-perfil')
        self.api_client.force_authenticate(self.usuario)

        resposta_get = self.api_client.get(url)
        self.assertEqual(resposta_get.status_code, 200)
        self.assertEqual(resposta_get.data['email'], self.usuario.email)

        resposta_patch = self.api_client.patch(url, {'first_name': 'Atualizado'}, format='json')
        self.assertEqual(resposta_patch.status_code, 200)
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.first_name, 'Atualizado')


class UsuariosViewsTests(UsuariosBaseTestCase):
    def setUp(self):
        super().setUp()
        self.client.logout()

    def test_entrar_view_redirects_when_already_authenticated(self):
        self.client.force_login(self.usuario)

        resposta = self.client.get(reverse('usuarios_web:entrar'))

        self.assertRedirects(resposta, reverse('usuarios_web:perfil'))

    def test_entrar_view_logs_user_in(self):
        payload = {'email': self.usuario.email, 'senha': 'SenhaSegura123!'}

        resposta = self.client.post(reverse('usuarios_web:entrar'), payload)

        self.assertRedirects(resposta, reverse('usuarios_web:perfil'))
        self.assertEqual(int(self.client.session['_auth_user_id']), self.usuario.pk)

    def test_registrar_view_creates_user_and_logs_in(self):
        payload = {
            'username': 'webuser',
            'email': 'webuser@example.com',
            'first_name': 'Web',
            'last_name': 'User',
            'cidade': 'Palmas',
            'estado': 'TO',
            'password1': 'SenhaDeRegistro123!',
            'password2': 'SenhaDeRegistro123!',
        }

        resposta = self.client.post(reverse('usuarios_web:registrar'), payload)

        self.assertRedirects(resposta, reverse('usuarios_web:perfil'))
        self.assertTrue(Usuario.objects.filter(username='webuser').exists())
        novo_usuario = Usuario.objects.get(username='webuser')
        self.assertEqual(int(self.client.session['_auth_user_id']), novo_usuario.pk)

    def test_perfil_view_updates_user_and_shows_message(self):
        self.client.force_login(self.usuario)
        payload = {
            'first_name': 'Perfil',
            'last_name': 'Atualizado',
            'cidade': 'Palmas',
            'estado': 'TO',
        }

        resposta = self.client.post(reverse('usuarios_web:perfil'), payload)

        self.assertRedirects(resposta, reverse('usuarios_web:perfil'))
        self.usuario.refresh_from_db()
        self.assertEqual(self.usuario.first_name, 'Perfil')
        mensagens = list(get_messages(resposta.wsgi_request))
        self.assertTrue(any('Perfil atualizado' in mensagem.message for mensagem in mensagens))
