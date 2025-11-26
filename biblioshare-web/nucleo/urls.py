from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from .views import HomeView


def saude(_):
    return JsonResponse({'status': 'ok', 'mensagem': 'API do BiblioShare operacional'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('saude/', saude, name='saude'),
    path('', HomeView.as_view(), name='home'),
    path('api/', include('usuarios.urls')),
    path('api/', include('livros.urls')),
    path('', include('usuarios.urls_web')),
    path('', include('livros.urls_web')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
