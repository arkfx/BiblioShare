from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path


def saude(_):
    return JsonResponse({'status': 'ok', 'mensagem': 'API do BiblioShare operacional'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', saude, name='saude'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
