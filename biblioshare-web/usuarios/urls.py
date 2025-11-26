from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginAPIView, PerfilAPIView, RegistroAPIView

app_name = 'usuarios_api'

urlpatterns = [
    path('auth/registro/', RegistroAPIView.as_view(), name='auth-registro'),
    path('auth/login/', LoginAPIView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/perfil/', PerfilAPIView.as_view(), name='auth-perfil'),
]

