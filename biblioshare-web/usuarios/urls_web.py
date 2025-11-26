from django.urls import path

from .views import EntrarView, PerfilView, RegistrarView, SairView

app_name = 'usuarios_web'

urlpatterns = [
    path('entrar/', EntrarView.as_view(), name='entrar'),
    path('registrar/', RegistrarView.as_view(), name='registrar'),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('sair/', SairView.as_view(), name='sair'),
]

