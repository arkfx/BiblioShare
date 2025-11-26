from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import FormView, UpdateView
from django.contrib.auth.views import LogoutView

from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .forms import EntrarForm, PerfilForm, RegistrarUsuarioForm
from .models import Usuario
from .serializers import LoginSerializer, RegistroSerializer, UsuarioPerfilSerializer


class RegistroAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        refresh = RefreshToken.for_user(usuario)
        perfil = UsuarioPerfilSerializer(usuario, context={'request': request})
        return Response(
            {
                'usuario': perfil.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data['usuario']
        refresh = RefreshToken.for_user(usuario)
        perfil = UsuarioPerfilSerializer(usuario, context={'request': request})
        return Response(
            {
                'usuario': perfil.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


class PerfilAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioPerfilSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user


class EntrarView(FormView):
    template_name = 'usuarios/login.html'
    form_class = EntrarForm
    success_url = reverse_lazy('usuarios_web:perfil')

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(self.get_success_url())
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        usuario = form.cleaned_data['usuario']
        login(self.request, usuario)
        messages.success(self.request, 'Bem-vindo(a) de volta!')
        return super().form_valid(form)


class RegistrarView(FormView):
    template_name = 'usuarios/registro.html'
    form_class = RegistrarUsuarioForm
    success_url = reverse_lazy('usuarios_web:perfil')

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect(self.get_success_url())
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        usuario = form.save()
        login(self.request, usuario)
        messages.success(self.request, 'Cadastro realizado com sucesso!')
        return super().form_valid(form)


class PerfilView(LoginRequiredMixin, UpdateView):
    template_name = 'usuarios/perfil.html'
    model = Usuario
    form_class = PerfilForm
    success_url = reverse_lazy('usuarios_web:perfil')

    def get_object(self):
        return self.request.user

    def form_valid(self, form):
        messages.success(self.request, 'Perfil atualizado com sucesso!')
        return super().form_valid(form)


class SairView(LogoutView):
    next_page = reverse_lazy('usuarios_web:entrar')
