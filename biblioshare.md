# BiblioShare - Implementation Plan 📚

## Project Overview

**BiblioShare** is a decentralized peer-to-peer (P2P) literary collection management and exchange platform. Unlike traditional centralized libraries, BiblioShare transforms each user into a "micro-branch," enabling idle books on private shelves to circulate within a community (university campus or neighborhood) through loans, rentals, or definitive exchanges (barter).

### Ecosystem Architecture

The solution operates in a hybrid ecosystem:

| Platform | Stack | Role | Focus |
|----------|-------|------|-------|
| **Web** | Django + Bootstrap | "Control Tower" | Strategic exploration, bulk inventory management, complex negotiations |
| **Mobile** | Angular + Ionic | "Field Tool" | Logistics execution, code-based handshakes, geolocation, real-time validation |

### Target Users

- **Budget-conscious students**: Need expensive technical books for short periods
- **Book accumulators**: Have hundreds of idle books, want to free space or earn extra income
- **Rarity hunters**: Search for specific editions or advantageous trades

---

## Tech Stack

### Backend (Monolithic API)
- Python 3.11+
- Django 5.x
- Django REST Framework
- PostgreSQL (production) / SQLite (local fallback)

### Web Frontend
- Django Templates
- Bootstrap 5.x
- Leaflet.js (maps)
- HTMX (dynamic interactions)

### Mobile
- Angular 17+
- Ionic 7+
- Capacitor (native features: camera, GPS)

### Infrastructure
- Docker + Docker Compose
- Google Cloud Run (deployment target)

---

## General Guidelines

### Code Conventions
- ❌ Never write emojis in the codebase (except in `.md` files)
- ❌ No inline comments - document in dedicated `.md` files per phase
- ❌ NEVER manually write/modify the migrations file, except when explicitly asked by the user.
- ✅ Adhere to Django's DRY (Don't Repeat Yourself) philosophy
- ✅ Write all codebase variables, function names, URLs, and UIs in **Brazilian Portuguese**
- ✅ Use framework CLI commands for migrations, app setup, and scaffolding
- ✅ Use framework templates and ready UI components - don't worry about "the Bootstrap look"
- ✅ Keep codebase minimal but efficient
- ✅ Always use class-based views

### Backend Specifics
- Use environment variables for sensitive configs (database URL, secrets, etc.)
- Implement smart fallbacks for 100% local functionality without env vars
- Monolithic architecture exposing REST APIs for mobile consumption

### Mobile Specifics
- Hardcode API URL in a single, easy-to-access unified place (`src/environments/environment.ts`)

### Docker
- Maintain Dockerfile and docker-compose for local development
- Ensure easy deployment to Google Cloud Run
- Update Dockerfile whenever new dependencies are added

---

## Functional Requirements Coverage

| RF | Description | Phase |
|----|-------------|-------|
| RF01 | Hybrid Authentication | Phase 2 |
| RF02 | ISBN/Barcode Registration | Phase 3 |
| RF03 | Availability Modality Definition | Phase 3 |
| RF04 | Wishlist | Phase 3 |
| RF05 | Georeferenced Search | Phase 4 |
| RF06 | Virtual Showcase with Map | Phase 4 |
| RF07 | Solicitation Flow | Phase 5 |
| RF08 | Barter Proposal | Phase 5 |
| RF09 | Contextual Chat | Phase 6 |
| RF10 | Transaction Cancellation | Phase 5 |
| RF11 | Concurrent Request Handling | Phase 5 |
| RF12 | Digital Handshake | Phase 7 |
| RF13 | Arrival Check-in | Phase 7 |
| RF14 | Return Flow | Phase 8 |
| RF15 | Return Handshake | Phase 8 |
| RF16 | Notification System | Phase 9 |

---

## Phase 1: Project Setup & Infrastructure

### Objectives
- Initialize Django project with proper structure
- Initialize Angular/Ionic mobile project
- Configure Docker environment
- Establish development workflow

### 1.1 Django Backend Setup

```bash
# Create project directory
mkdir biblioshare
cd biblioshare

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install initial dependencies
pip install django djangorestframework django-cors-headers python-dotenv pillow

# Create Django project
django-admin startproject nucleo .

# Create initial apps
python manage.py startapp usuarios
python manage.py startapp livros
python manage.py startapp transacoes
python manage.py startapp notificacoes

# Generate requirements
pip freeze > requirements.txt
```

### 1.2 Project Structure (Backend)

```
biblioshare/
├── nucleo/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── usuarios/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── ...
├── livros/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── ...
├── transacoes/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── ...
├── notificacoes/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── ...
├── templates/
│   ├── base.html
│   └── ...
├── static/
│   └── ...
├── manage.py
├── requirements.txt
├── docker-compose.yml
└── .env.example
```

> Nota: o `Dockerfile` agora fica na raiz do repositório (`/Dockerfile`) e copia o conteúdo de `biblioshare-web/` durante o build para manter paridade entre os ambientes local (Docker Desktop) e produção (Cloud Run).

### 1.3 Settings Configuration

The `nucleo/settings.py` must implement smart fallbacks:

```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'chave-secreta-desenvolvimento-local-nao-usar-em-producao')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database with smart fallback
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

### 1.4 Angular/Ionic Mobile Setup

```bash
# Install Ionic CLI globally
npm install -g @ionic/cli @angular/cli

# Create Ionic Angular project
ionic start biblioshare-mobile blank --type=angular --capacitor

cd biblioshare-mobile

# Add required Capacitor plugins
npm install @capacitor/camera @capacitor/geolocation
npm install @capawesome/capacitor-mlkit-barcode-scanning
npx cap sync
```

### 1.5 Mobile Project Structure

```
biblioshare-mobile/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   └── api.service.ts
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   └── pipes/
│   │   ├── paginas/
│   │   │   ├── login/
│   │   │   ├── meus-livros/
│   │   │   ├── busca/
│   │   │   ├── transacoes/
│   │   │   └── perfil/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.module.ts
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── ...
├── capacitor.config.ts
├── ionic.config.json
├── package.json
└── ...
```

### 1.6 API URL Configuration (Mobile)

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

Create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://biblioshare-api.run.app/api'
};
```

### 1.7 Dockerfile

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY biblioshare-web/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY biblioshare-web/ .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "nucleo.wsgi:application"]
```

### 1.8 Docker Compose

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
      - DATABASE_URL=postgres://biblioshare:biblioshare@db:5432/biblioshare
    depends_on:
      - db
    volumes:
      - .:/app
    command: python manage.py runserver 0.0.0.0:8000

  db:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_DB=biblioshare
      - POSTGRES_USER=biblioshare
      - POSTGRES_PASSWORD=biblioshare
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 1.9 Environment Example File

Create `.env.example`:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (leave empty for SQLite fallback)
DATABASE_URL=

# Google Books API
GOOGLE_BOOKS_API_KEY=

# Email (leave empty for console backend)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

### 1.10 Initial Migrations

```bash
# Run initial migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser
```

### Phase 1 Deliverables
- [x] Django project initialized with 4 apps
- [x] Angular/Ionic project initialized
- [x] Docker and docker-compose configured
- [x] Environment variables with smart fallbacks
- [x] Basic project structure established
- [x] Documentation: `docs/FASE_01_SETUP.md`

---

## Phase 2: Authentication System (RF01)

### Objectives
- Implement custom user model
- Implement email/senha authentication (sem login social no MVP)
- Implement JWT authentication for mobile
- Create login/register views for web

### 2.1 Custom User Model

In `usuarios/models.py`:

- Extend `AbstractUser`
- Add fields: `foto_perfil`, `cidade`, `estado`, `vinculo_verificado`

### 2.2 Dependencies

Add to `requirements.txt`:

```
djangorestframework-simplejwt
```

### 2.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/registro/` | User registration |
| POST | `/api/auth/login/` | Email/password login |
| POST | `/api/auth/token/refresh/` | Refresh JWT token |
| GET | `/api/auth/perfil/` | Get current user profile |
| PATCH | `/api/auth/perfil/` | Update user profile |

### 2.4 Web Views

| URL | Template | Description |
|-----|----------|-------------|
| `/entrar/` | `usuarios/login.html` | Login page |
| `/registrar/` | `usuarios/registro.html` | Registration page |
| `/perfil/` | `usuarios/perfil.html` | Profile page |
| `/sair/` | - | Logout (redirect) |

### 2.5 Mobile Screens

- `LoginPage`: Email/password form (espaço reservado para futuros botões sociais)
- `RegistroPage`: Registration form
- `PerfilPage`: View/edit profile

### Phase 2 Deliverables
- [x] Custom user model with location fields
- [x] Email/senha + JWT authentication
- [x] Web login/register templates
- [x] Mobile auth screens
- [x] Documentation: `docs/FASE_02_AUTENTICACAO.md`

---

## Phase 3: Inventory Management (RF02, RF03, RF04)

### Objectives
- Implement book model with all modalities
- Integrate Google Books API for ISBN lookup
- Create wishlist functionality
- Build inventory management views

### 3.1 Book Model

In `livros/models.py`:

**Livro Model Fields:**
- `dono` (FK to Usuario)
- `isbn`, `titulo`, `autor`, `editora`, `ano_publicacao`
- `capa_url`, `sinopse`
- `modalidades` (JSONField or M2M): DOACAO, EMPRESTIMO, ALUGUEL, TROCA
- `valor_aluguel_semanal` (Decimal, nullable)
- `prazo_emprestimo_dias` (Integer, nullable)
- `disponivel` (Boolean)
- `criado_em`, `atualizado_em`

**ListaDesejo Model Fields:**
- `usuario` (FK to Usuario)
- `titulo`, `autor`, `isbn` (all optional, at least one required)
- `criado_em`

### 3.2 Google Books Integration

Create `livros/services.py`:

- Function `buscar_livro_por_isbn(isbn: str) -> dict | None`
- Handle API errors gracefully
- Return normalized book data

### 3.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/livros/` | List user's books |
| POST | `/api/livros/` | Create book manually |
| POST | `/api/livros/buscar-isbn/` | Search by ISBN (Google Books) |
| GET | `/api/livros/{id}/` | Get book details |
| PATCH | `/api/livros/{id}/` | Update book |
| DELETE | `/api/livros/{id}/` | Delete book |
| GET | `/api/lista-desejos/` | List user's wishlist |
| POST | `/api/lista-desejos/` | Add to wishlist |
| DELETE | `/api/lista-desejos/{id}/` | Remove from wishlist |

### 3.4 Web Views

| URL | Template | Description |
|-----|----------|-------------|
| `/meus-livros/` | `livros/meus_livros.html` | User's book inventory |
| `/meus-livros/adicionar/` | `livros/adicionar_livro.html` | Add book form |
| `/meus-livros/{id}/` | `livros/detalhes_livro.html` | Book details/edit |
| `/lista-desejos/` | `livros/lista_desejos.html` | User's wishlist |

### 3.5 Mobile Screens

- `MeusLivrosPage`: List with FAB to add
- `AdicionarLivroPage`: Camera scanner + manual form
- `DetalhesLivroPage`: View/edit book
- `ListaDesejosPage`: Wishlist management

### 3.6 Barcode Scanner (Mobile)

Use `@capawesome/capacitor-mlkit-barcode-scanning`:

```typescript
async escanearISBN(): Promise<string | null> {
  const { barcodes } = await BarcodeScanner.scan();
  return barcodes[0]?.rawValue || null;
}
```

### Phase 3 Deliverables
- [x] Book model with modalities
- [x] Wishlist model
- [x] Google Books API integration
- [x] ISBN barcode scanner (mobile)
- [x] Inventory CRUD (web + mobile)
- [x] Wishlist CRUD (web + mobile)
- [x] Documentation: `docs/FASE_03_INVENTARIO.md`

---

## Phase 4: Discovery & Geolocation (RF05, RF06)

### Objectives
- Implement georeferenced search
- Create interactive map with Leaflet.js
- Build search/filter functionality

### 4.1 Dependencies

Add to `requirements.txt`:

```
django-filter
```

No geospatial extensions are required in the MVP; usaremos filtros simples baseados em cidade.

### 4.2 Search Implementation

In `livros/filters.py`:

- Filter by `titulo`, `autor`, `categoria`
- Filter by `modalidade`
- Filter by simple location fields (e.g., `cidade`)
- Order by recency (e.g., `criado_em`) or alphabetically

### 4.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/livros/buscar/` | Search books with filters |
| GET | `/api/livros/mapa/` | Get books for map display |

Query parameters for `/api/livros/buscar/`:
- `q`: Search term (title/author)
- `modalidade`: DOACAO, EMPRESTIMO, ALUGUEL, TROCA
- `cidade`: City filter (optional)

### 4.4 Web Views

| URL | Template | Description |
|-----|----------|-------------|
| `/buscar/` | `livros/buscar.html` | Search page with filters |
| `/vitrine/` | `livros/vitrine.html` | Map view (Virtual Showcase) |

### 4.5 Map Integration (Web)

Use Leaflet.js with marker clustering:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
```

### 4.6 Mobile Screens

- `BuscaPage`: Search with filters + list results (sem mapa no MVP; mapa apenas no web)

### Phase 4 Deliverables
- [x] Search with basic location filters (cidade)
- [x] Filter by modality and search term
- [x] Interactive map with Leaflet.js (web)
- [x] Search screens (web + mobile)
- [x] Documentation: `docs/FASE_04_DESCOBERTA.md`

---

## Phase 5: Transactions Core (RF07, RF08, RF10, RF11)

### Objectives
- Implement transaction model with all states
- Create solicitation flow
- Build barter proposal system
- Handle cancellation and concurrency

### 5.1 Transaction Model

In `transacoes/models.py`:

**Transacao Model Fields:**
- `tipo`: DOACAO, EMPRESTIMO, ALUGUEL, TROCA
- `status`: PENDENTE, ACEITA, EM_POSSE, CONCLUIDA, CANCELADA
- `solicitante` (FK to Usuario)
- `dono` (FK to Usuario)
- `livro_solicitado` (FK to Livro)
- `data_limite_devolucao` (Date, nullable)
- `criado_em`, `atualizado_em`

**PropostaTroca Model Fields:**
- `transacao` (OneToOne to Transacao)
- `livros_oferecidos` (M2M to Livro)
- `livros_solicitados` (M2M to Livro)
- `status`: PENDENTE, ACEITA, RECUSADA

**HistoricoTransacao Model Fields:**
- `transacao` (FK to Transacao)
- `status_anterior`, `status_novo`
- `usuario` (FK to Usuario)
- `criado_em`

### 5.2 Concurrency Handling (RF11)

Use database-level locking with `select_for_update()`:

```python
from django.db import transaction

@transaction.atomic
def criar_solicitacao(livro_id, solicitante):
    livro = Livro.objects.select_for_update().get(id=livro_id)
    if not livro.disponivel:
        raise LivroIndisponivelError("Este livro não está mais disponível")
    livro.disponivel = False
    livro.save()
    # Create transaction...
```

### 5.3 Cancellation Logic (RF10)

- Allow cancellation only while transaction is in `PENDENTE` or `ACEITA` (antes do livro ficar `EM_POSSE`).
- For `ALUGUEL`, deny cancellation once status is `EM_POSSE`.
- When cancelling, set `livro.disponivel = True` if it had been reserved.
- Create in-app notification for the other party.

### 5.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transacoes/` | List user's transactions |
| POST | `/api/transacoes/solicitar/` | Create solicitation |
| POST | `/api/transacoes/{id}/aceitar/` | Accept solicitation |
| POST | `/api/transacoes/{id}/recusar/` | Reject solicitation |
| POST | `/api/transacoes/{id}/cancelar/` | Cancel transaction |
| GET | `/api/transacoes/{id}/` | Transaction details |
| POST | `/api/propostas-troca/` | Create barter proposal |
| POST | `/api/propostas-troca/{id}/aceitar/` | Accept proposal |
| POST | `/api/propostas-troca/{id}/recusar/` | Reject proposal |

### 5.5 Web Views

| URL | Template | Description |
|-----|----------|-------------|
| `/transacoes/` | `transacoes/lista.html` | All transactions |
| `/transacoes/{id}/` | `transacoes/detalhes.html` | Transaction details |
| `/transacoes/propor-troca/{livro_id}/` | `transacoes/propor_troca.html` | Barter proposal (drag & drop) |

### 5.6 Mobile Screens

- `TransacoesPage`: List all transactions by status
- `DetalhesTransacaoPage`: View details, actions
- `PropostaTrocaPage`: View proposal, accept/reject (no drag & drop)

### 5.7 Barter Proposal (RF08)

**Web (Full Feature):**
- Drag & drop interface
- View other user's wishlist
- Select multiple books from both sides

**Mobile (Simplified):**
- View received proposals
- Accept or reject
- Create simple 1-for-1 trades only

### Phase 5 Deliverables
- [x] Transaction model with status flow
- [x] Barter proposal model
- [x] Solicitation flow (all modalities)
- [x] Concurrency handling with DB locks
- [x] Cancellation logic (except rentals)
- [x] Barter proposal drag & drop (web)
- [x] Proposal view/accept/reject (mobile)
- [x] Documentation: `docs/FASE_05_TRANSACOES.md`

---

## Phase 6: Contextual Chat (RF09)

### Objectives
- Implement near real-time chat per transaction
- Use REST API endpoints with periodic polling (sem WebSockets/Channels)
- Create chat UI for web and mobile

### 6.1 Dependencies

No new dependencies are required; chat reuses Django REST Framework and the existing database.

### 6.2 Message Model

In `transacoes/models.py`:

**Mensagem Model Fields:**
- `transacao` (FK to Transacao)
- `remetente` (FK to Usuario)
- `conteudo` (TextField)
- `lida` (Boolean)
- `criado_em`

### 6.3 Chat API (REST + polling)

Create endpoints em `transacoes/views.py` que:

- Autenticam o usuário via JWT/sessão, como nas demais APIs
- Listam mensagens de uma transação (com paginação)
- Criam novas mensagens
- Marcam mensagens como lidas quando apropriado

### 6.4 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transacoes/{id}/mensagens/` | Get message history (used by polling) |
| POST | `/api/transacoes/{id}/mensagens/` | Send message |

### 6.5 Docker & Deployment

No Docker or ASGI changes are required for chat; the existing Gunicorn/`runserver` setup is suficiente, pois o chat usa apenas HTTP/REST.

### Phase 6 Deliverables
- [x] Message model
- [x] REST chat API with polling strategy
- [x] Chat UI integrated in transaction details (web)
- [x] Chat UI in transaction details (mobile)
- [x] Message history persistence
- [x] Documentation: `docs/FASE_06_CHAT.md`

---

## Phase 7: Handshake & Check-in (RF12, RF13)

### Objectives
- Implement numeric code generation for handshakes
- Create dual handshake flow for trades
- Implement arrival check-in

### 7.1 Dependencies

Nenhuma dependência externa adicional é necessária; o handshake usa apenas modelos e views Django com códigos numéricos.

### 7.2 Handshake Model

In `transacoes/models.py`:

**Handshake Model Fields:**
- `transacao` (FK to Transacao)
- `tipo`: ENTREGA, DEVOLUCAO, TROCA_A, TROCA_B
- `codigo` (código curto numérico/alfanumérico, unique)
- `gerador` (FK to Usuario)
- `escaneador` (FK to Usuario, nullable)
- `expira_em` (DateTime)
- `concluido` (Boolean)
- `criado_em`, `concluido_em`

### 7.3 Handshake Logic (Numeric Code)

- Generate a short random `codigo` for each handshake and store it no modelo.
- Set expiration to 5 minutes from generation.
- Mostrar o `codigo` na tela para quem gerou; a outra parte informa esse código manualmente em um formulário.
- Ao enviar o código, validar se ele pertence à mesma `transacao`, se não expirou e então marcar o handshake como concluído.

### 7.4 Trade Dual Handshake Flow

1. Transaction status: `ACEITA`.
2. User A generates a handshake code → User B inputs the code → Handshake A complete.
3. User B generates a handshake code → User A inputs the code → Handshake B complete.
4. When both are complete → Transaction status: `CONCLUIDA`.

### 7.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transacoes/{id}/gerar-handshake/` | Generate numeric handshake code |
| POST | `/api/transacoes/{id}/validar-handshake/` | Validate informed code |
| POST | `/api/transacoes/{id}/checkin/` | Send arrival check-in |

### 7.6 Mobile Screens

- `HandshakePage`: Mostrar código gerado e formulário para digitar o código da outra parte
- Nenhuma integração de câmera/QR necessária no MVP

### 7.7 Check-in (RF13)

Simple button "Cheguei no local" that:
- Captures current GPS coordinates
- Sends to server
- Notifies other party with location

### Phase 7 Deliverables
- [x] Handshake model with expiration
- [x] Numeric code generation
- [x] Code validation with expiration check
- [x] Dual handshake flow for trades
- [x] Arrival check-in with GPS
- [x] Handshake screens (mobile)
- [x] Documentation: `docs/FASE_07_HANDSHAKE.md`

---

## Phase 8: Return Flow (RF14, RF15)

### Objectives
- Implement return management for loans/rentals
- Create return handshake (inverse flow)
- Track return deadlines

### 8.1 Return Logic

**Status Flow for Loans/Rentals (simplified):**
1. `PENDENTE` → `ACEITA` quando o dono aceita a solicitação.
2. `ACEITA` → (handshake de ENTREGA concluído) → `EM_POSSE` (livro com o solicitante).
3. `EM_POSSE` → (handshake de DEVOLUCAO concluído) → `CONCLUIDA`.
4. Quando a transação passa para `CONCLUIDA` (em empréstimos/aluguéis), o livro volta para `disponivel = True`.

### 8.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transacoes/{id}/iniciar-devolucao/` | Start return process |
| POST | `/api/transacoes/{id}/gerar-handshake-devolucao/` | Generate return handshake code |
| POST | `/api/transacoes/{id}/validar-handshake-devolucao/` | Validate return code |

### 8.3 Return Handshake Flow

1. Borrower initiates return
2. Borrower generates handshake code of type `DEVOLUCAO`
3. Owner inputs this code to confirm return
4. Transaction marked as `CONCLUIDA` and book marked as available novamente

### 8.4 Deadline Display

- Show `data_limite_devolucao` in transaction details
- Calculate remaining days
- Visual indicator (green/yellow/red) based on proximity

### Phase 8 Deliverables
- [x] Return initiation flow
- [x] Return handshake (inverse)
- [x] Book availability restoration
- [x] Deadline display in UI
- [x] Documentation: `docs/FASE_08_DEVOLUCAO.md`

---

## Phase 9: Notification System (RF16)

### Objectives
- Implement in-app notifications (web + mobile)
- Create basic notification preferences

### 9.1 Dependencies

No new backend dependencies are required; notifications reuse Django and Django REST Framework.

### 9.2 Notification Model

In `notificacoes/models.py`:

**Notificacao Model Fields:**
- `usuario` (FK to Usuario)
- `tipo`: SOLICITACAO, PROPOSTA, MENSAGEM, CANCELAMENTO, etc.
- `titulo`, `mensagem`
- `dados` (JSONField for deep linking/navigation metadata)
- `lida` (Boolean)
- `criado_em`

**PreferenciasNotificacao Model Fields:**
- `usuario` (OneToOne to Usuario)
- `receber_notificacoes` (Boolean)

### 9.3 Notification Events

| Event | In-App |
|-------|--------|
| New solicitation received | ✅ |
| Barter proposal received | ✅ |
| Solicitation accepted/rejected | ✅ |
| New chat message | ✅ |
| Transaction cancelled | ✅ |

### 9.4 Notification Helpers

Create `notificacoes/services.py`:

- `criar_notificacao(usuario_id, tipo, titulo, mensagem, dados=None)`

These helpers are called synchronously inside the main business flows (solicitações, propostas, chat, cancelamentos).

### 9.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notificacoes/` | List notifications |
| POST | `/api/notificacoes/{id}/marcar-lida/` | Mark as read |
| POST | `/api/notificacoes/marcar-todas-lidas/` | Mark all as read |
| GET | `/api/notificacoes/preferencias/` | Get preferences |
| PATCH | `/api/notificacoes/preferencias/` | Update preferences |

### Phase 9 Deliverables
- [x] Notification model
- [x] In-app notification center (web + mobile)
- [x] Notification preferences
- [x] Synchronous notification helpers wired into main flows
- [x] Documentation: `docs/FASE_09_NOTIFICACOES.md`

---

## Phase 10: Final Integration & Polish

### Objectives
- Integration testing
- UI/UX polish
- Performance optimization
- Documentation completion

### 10.1 Tasks

- [ ] End-to-end testing of all flows
- [ ] Mobile deep linking for notifications
- [ ] Error handling improvements
- [ ] Loading states and empty states
- [ ] Final responsive adjustments
- [ ] Security review (CORS, CSRF, rate limiting)
- [ ] Production environment variables documentation

### 10.2 Final Documentation

- [ ] `docs/FASE_10_INTEGRACAO.md`
- [ ] `README.md` with setup instructions
- [ ] API documentation (can use DRF's built-in)
- [ ] Deployment guide for Google Cloud Run

### Phase 10 Deliverables
- [x] All RFs implemented and tested
- [x] Complete documentation set
- [x] Production-ready configuration
- [x] Deployment guide

---

## Summary: Phase-RF Mapping

| Phase | RFs Covered | Key Features |
|-------|-------------|--------------|
| 1 | - | Project setup, Docker, structure |
| 2 | RF01 | Authentication, email/senha, JWT |
| 3 | RF02, RF03, RF04 | Books, ISBN scanner, wishlist |
| 4 | RF05, RF06 | Search, geolocation, map |
| 5 | RF07, RF08, RF10, RF11 | Transactions, proposals, cancellation |
| 6 | RF09 | Chat (REST + polling) |
| 7 | RF12, RF13 | Numeric handshake, check-in |
| 8 | RF14, RF15 | Return flow |
| 9 | RF16 | Notifications |
| 10 | - | Integration, polish, deploy |

---

## Estimated Timeline

| Phase | Estimated Duration |
|-------|--------------------|
| Phase 1 | 1-2 days |
| Phase 2 | 2-3 days |
| Phase 3 | 3-4 days |
| Phase 4 | 2-3 days |
| Phase 5 | 4-5 days |
| Phase 6 | 2-3 days |
| Phase 7 | 2-3 days |
| Phase 8 | 1-2 days |
| Phase 9 | 3-4 days |
| Phase 10 | 2-3 days |
| **Total** | **~22-32 days** |

---

## Appendix: Final requirements.txt

```
Django>=5.0
djangorestframework>=3.14
django-cors-headers>=4.3
django-filter>=23.5
djangorestframework-simplejwt>=5.3
dj-database-url>=2.1
python-dotenv>=1.0
Pillow>=10.0
gunicorn>=21.0
psycopg2-binary>=2.9
requests>=2.31
```

---

*This implementation plan is a living document. Update it as the project evolves.* 📖