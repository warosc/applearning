# EXHCOBA Simulator Platform

Plataforma web completa para simulación del examen de admisión EXHCOBA: panel de administración, autenticación JWT, calificación automática con puntaje parcial, y soporte Docker.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, dnd-kit |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2, Alembic, Pydantic v2 |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker, Docker Compose, Nginx (producción) |

## Características

- **7 tipos de pregunta**: opción única, múltiple, numérica, algebraica, drag & drop, completar oración (`fill_blank`), multi-respuesta ponderada (`multi_answer_weighted`)
- **Calificación parcial decimal** — `multi_answer_weighted` usa `weight` por opción
- **Generador de exámenes** sin repetición de temas dentro de la misma materia
- **Temporizador** con expiración automática y autoguardado de respuestas
- **Panel admin** para crear/publicar exámenes, gestionar preguntas, importar desde JSON/CSV
- **Autenticación JWT** con roles `admin` y `estudiante`
- **Calculadora** integrada, habilitación por examen
- **Página de ayuda** en `/ayuda` — manual del estudiante

---

## Desarrollo local (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml logs -f
```

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Frontend (estudiante y admin) |
| http://localhost:4000/api | API REST |
| http://localhost:4000/docs | Swagger UI |

### Usuarios por defecto (seed automático)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `demo` | `demo123` | Estudiante |

Panel de administración: **http://localhost:3000/admin**

---

## Desarrollo sin Docker

```bash
# 1. Levantar PostgreSQL
docker run -d --name pg-dev \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=simulador_examen \
  -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend-py
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 4000

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

---

## Tests

```bash
# Backend
cd backend-py
pip install -r requirements-test.txt
python -m pytest tests/ -q

# Frontend
cd frontend
npx tsc --noEmit
npx jest --passWithNoTests
```

---

## Producción

```bash
cp .env.example .env
# Editar: POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN
docker compose -f docker/docker-compose.prod.yml up -d --build
```

Variables mínimas requeridas:

```env
POSTGRES_PASSWORD=<contraseña-segura>
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGIN=https://tudominio.com
```

Arquitectura de producción:
```
Internet → Nginx (:80) → /api/* → backend:4000 (FastAPI)
                       → /*     → frontend:3000 (Next.js)
                                     ↕
                                postgres:5432
```

El deploy a VPS se ejecuta automáticamente vía GitHub Actions al hacer push a `main`.

---

## Importar preguntas al banco

```bash
curl -X POST http://localhost:4000/api/questions/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "single_choice",
      "prompt": "¿Cuál es sinónimo de veloz?",
      "materia": "Español",
      "tema": "Sinónimos",
      "difficulty": "facil",
      "score": 1.0,
      "options": [
        {"label": "Rápido", "value": "rapido", "is_correct": true},
        {"label": "Lento",  "value": "lento",  "is_correct": false}
      ]
    }
  ]'
```

También se puede importar por CSV: `type,prompt,materia,tema,difficulty,score,option_a,option_b,option_c,option_d,correct_option`

---

## Licencia

Privado — Uso educativo
