import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_ENDPOINT = 'https://www.googleapis.com/books/v1/volumes'


def buscar_livro_por_isbn(isbn: str) -> Optional[Dict[str, Any]]:
    isbn = (isbn or '').strip()
    if not isbn:
        return None

    params = {
        'q': f'isbn:{isbn}',
        'maxResults': 1,
    }

    api_key = getattr(settings, 'GOOGLE_BOOKS_API_KEY', None)
    if api_key:
        params['key'] = api_key

    try:
        resposta = requests.get(GOOGLE_BOOKS_ENDPOINT, params=params, timeout=5)
        resposta.raise_for_status()
    except requests.RequestException as erro:
        logger.warning('Falha ao consultar Google Books para ISBN %s: %s', isbn, erro)
        return None

    payload = resposta.json()
    itens = payload.get('items')
    if not itens:
        return None

    volume_info = itens[0].get('volumeInfo', {})
    dados = {
        'isbn': isbn,
        'titulo': volume_info.get('title', '').strip(),
        'autor': ', '.join(volume_info.get('authors', [])),
        'editora': volume_info.get('publisher', '').strip(),
        'ano_publicacao': (volume_info.get('publishedDate') or '')[:4],
        'capa_url': _extrair_capa(volume_info.get('imageLinks', {})),
        'sinopse': volume_info.get('description', '').strip(),
    }
    return dados


def _extrair_capa(image_links: Dict[str, Any]) -> str:
    if not image_links:
        return ''
    return (
        image_links.get('thumbnail')
        or image_links.get('smallThumbnail')
        or image_links.get('medium')
        or image_links.get('large')
        or ''
    )

