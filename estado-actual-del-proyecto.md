# Estado actual del proyecto — Simulador EXHCOBA

> Última actualización: commit `1c86ae0` — rama `main`
> Repositorio: https://github.com/warosc/applearning.git

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI 0.115 + Python 3.12 |
| ORM | SQLAlchemy 2.0 + Alembic (migraciones) |
| Base de datos | PostgreSQL 16 |
| Cache | Redis 7 (en stack, pendiente de integrar en lógica) |
| Auth | JWT via `python-jose` + `passlib/bcrypt 3.2.2` |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS + lucide-react |
| Estado | Zustand (auth-store, simulator-store) |
| Formularios | react-hook-form + zod |
| Tablas admin | TanStack Table v8 |
| Gráficas | Recharts |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Tests backend | pytest 7.4 + SQLite in-memory |
| Tests frontend | Jest + @testing-library/react |
| E2E | Playwright (configurado, requiere `npx playwright install`) |
| Contenedores | Docker + docker-compose |

---

## Arquitectura del proyecto

```
applearning/
├── backend-py/              # API FastAPI
│   ├── app/
│   │   ├── routers/         # Endpoints REST
│   │   │   ├── auth.py      # Login, register, me, change-password
│   │   │   ├── exams.py     # CRUD exámenes + duplicate + start
│   │   │   ├── questions.py # CRUD preguntas + reorder + bank
│   │   │   ├── attempts.py  # Flujo de intento (start→answer→submit)
│   │   │   ├── admin.py     # Dashboard + usuarios + analytics
│   │   │   ├── analytics.py # Stats por pregunta, intentos admin
│   │   │   └── dashboard.py # Métricas panel admin
│   │   ├── models/          # SQLAlchemy ORM
│   │   ├── schemas/         # Pydantic v2
│   │   ├── services/
│   │   │   ├── grading.py   # Calificación automática
│   │   │   ├── exam_generator.py
│   │   │   └── question_import.py
│   │   └── core/
│   │       ├── security.py  # JWT + hash
│   │       └── deps.py      # get_db, get_current_user
│   ├── alembic/             # Migraciones DB
│   ├── tests/               # 26 tests pytest
│   ├── seed.py              # Datos demo (idempotente)
│   ├── requirements.txt
│   └── requirements-test.txt
│
├── frontend/                # Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Home
│   │   │   ├── login/page.tsx       # Login
│   │   │   ├── register/page.tsx    # Registro
│   │   │   ├── perfil/page.tsx      # Cambiar contraseña propia
│   │   │   ├── historial/page.tsx   # Historial de intentos
│   │   │   ├── examen/              # Simulador principal
│   │   │   └── admin/               # Panel administrativo
│   │   │       ├── page.tsx         # Dashboard
│   │   │       ├── exams/           # CRUD exámenes
│   │   │       ├── questions/       # CRUD + reordenar preguntas
│   │   │       ├── attempts/        # Listado + detalle intentos
│   │   │       ├── users/page.tsx   # Gestión de usuarios
│   │   │       ├── analytics/       # Estadísticas
│   │   │       └── config/          # Configuración (localStorage)
│   │   ├── components/
│   │   │   ├── exam/                # fullscreen-prompt, review-modal
│   │   │   ├── questions/           # Renderers por tipo de pregunta
│   │   │   ├── timer.tsx
│   │   │   ├── calculator.tsx
│   │   │   ├── results-view.tsx
│   │   │   └── security-warning.tsx
│   │   ├── hooks/
│   │   │   └── use-exam-security.ts # Proctoring: tabs, copy/paste, fullscreen
│   │   ├── lib/api.ts               # Todos los fetch al backend
│   │   └── store/
│   │       ├── auth-store.ts        # Zustand + localStorage persist
│   │       └── simulator-store.ts   # Estado del examen en curso
│   ├── e2e/smoke.spec.ts            # Tests Playwright
│   └── playwright.config.ts
│
└── docker/
    ├── docker-compose.yml           # Dev: postgres + redis + backend + frontend
    ├── docker-compose.prod.yml      # Prod: + nginx reverse proxy
    ├── Dockerfile.backend-py
    ├── Dockerfile.frontend
    └── nginx.conf
```

---

## Funcionalidades implementadas

### Simulador de examen (estudiante)

| Feature | Estado |
|---------|--------|
| Flujo completo: start → answer → submit → resultado | ✅ |
| Timer con advertencia visual (5 min ámbar, 1 min rojo + pulso) | ✅ |
| Layout 3 paneles: nav lateral + pregunta + herramientas | ✅ |
| Panel de preguntas numeradas con estados visuales | ✅ |
| Estados: actual / respondida / marcada / pendiente | ✅ |
| Guardar respuesta automático en cada cambio | ✅ |
| Marcar pregunta para revisar (flag ámbar) | ✅ |
| Modal de revisión antes de enviar | ✅ |
| Prompt de pantalla completa al inicio | ✅ |
| Calculadora integrada (panel derecho) | ✅ |
| Reanudación de intento incompleto | ✅ |
| Expiración automática por tiempo | ✅ |
| Seguridad: bloqueo copy/paste, detección cambio de pestaña | ✅ |
| Log de eventos de seguridad en backend | ✅ |
| Responsive (mobile drawer, desktop 3 cols) | ✅ |

### Tipos de pregunta

| Tipo | Estado |
|------|--------|
| Opción única (single_choice) — tarjetas A/B/C/D | ✅ |
| Opción múltiple (multiple_choice) — checkboxes estilo card | ✅ |
| Numérica (numeric) — input con validación | ✅ |
| Algebraica (algebraic) — input texto + normalización inteligente | ✅ |
| Arrastre (drag_drop) | ✅ |

### Calificación automática

| Feature | Estado |
|---------|--------|
| single/multiple choice exacto | ✅ |
| Numérico con tolerancia float | ✅ |
| Algebraico case-insensitive + normalización espacios + `^` vs `**` | ✅ |
| Comutatividad aditiva (`x+1 == 1+x`) | ✅ |
| Penalización por omisión (0 puntos) | ✅ |

### Resultados

| Feature | Estado |
|---------|--------|
| Ring SVG de porcentaje (verde/ámbar/rojo) | ✅ |
| Cards: puntaje, tiempo, correctas, incorrectas, omitidas | ✅ |
| Desglose por pregunta con ✓/✗/— | ✅ |
| Mensaje motivacional contextual | ✅ |
| Botón "Imprimir / PDF" (`window.print()`) | ✅ |

### Autenticación y usuarios

| Feature | Estado |
|---------|--------|
| Login con JWT | ✅ |
| Registro público (rol: estudiante) | ✅ |
| Cambiar propia contraseña (`/perfil`) | ✅ |
| Admin: resetear contraseña de cualquier usuario | ✅ |
| Admin: cambiar rol de usuario | ✅ |
| Persistencia token en localStorage (Zustand persist) | ✅ |
| Recuperación de contraseña por email | ❌ (no planificado) |
| OAuth / SSO Google | ❌ (no planificado) |

### Roles

| Rol | Permisos |
|-----|---------|
| `admin` | Todo: exámenes, preguntas, intentos, usuarios, config, estadísticas |
| `editor` | Exámenes, preguntas, intentos, estadísticas (sin usuarios ni config) |
| `estudiante` | Tomar exámenes, ver historial propio, cambiar contraseña |

### Panel administrador

| Sección | Feature | Estado |
|---------|---------|--------|
| Dashboard | Métricas globales, gráfica de intentos (14 días), distribución de puntajes | ✅ |
| Simuladores | Listado TanStack, filtros, publish/unpublish, duplicate, delete | ✅ |
| Simuladores | Edición de secciones y preguntas por examen | ✅ |
| Banco de preguntas | CRUD completo con filtros materia/dificultad/tipo + búsqueda global | ✅ |
| Banco de preguntas | Drag & drop reorder nativo (HTML5) | ✅ |
| Banco de preguntas | Import por CSV/JSON | ✅ |
| Intentos | Listado paginado con estado, tiempo, puntaje | ✅ |
| Intentos | Detalle por intento: resumen + tabla pregunta a pregunta | ✅ |
| Estadísticas | Gráfica % aciertos por pregunta, top falladas/acertadas | ✅ |
| Usuarios | Listado paginado con búsqueda, cambio de rol, reset contraseña | ✅ |
| Configuración | Valores predeterminados para nuevos simuladores (localStorage) | ✅ |

---

## API REST — Endpoints implementados

### Auth (`/api/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/login` | Login, devuelve JWT + user |
| POST | `/register` | Registro público, rol=estudiante |
| GET | `/me` | Perfil del usuario autenticado |
| PATCH | `/me/password` | Cambiar contraseña propia (requiere actual) |

### Exams (`/api/exams`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista exámenes (paginación opcional `?page&page_size`) |
| POST | `/` | Crear examen |
| GET | `/{id}` | Detalle examen |
| PATCH | `/{id}` | Actualizar examen |
| DELETE | `/{id}` | Eliminar examen |
| POST | `/{id}/publish` | Publicar |
| POST | `/{id}/unpublish` | Despublicar |
| POST | `/{id}/duplicate` | Duplicar (con secciones y preguntas) |
| POST | `/{id}/start` | Iniciar intento |
| GET | `/{id}/form-template` | Formulario asociado |

### Questions (`/api/questions`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista (paginación opcional) |
| POST | `/` | Crear pregunta |
| GET | `/{id}` | Detalle |
| PATCH | `/{id}` | Actualizar |
| DELETE | `/{id}` | Eliminar |
| POST | `/{id}/duplicate` | Duplicar al banco |
| PUT | `/reorder` | Reordenar bulk (antes de `/{id}`) |

### Attempts (`/api/attempts`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/my` | Intentos del usuario actual (antes de `/{id}`) |
| GET | `/{id}` | Detalle intento |
| GET | `/{id}/resume` | Reanudar intento |
| PATCH | `/{id}/answer` | Guardar respuesta |
| PATCH | `/{id}/mark-review` | Marcar/desmarcar para revisar |
| POST | `/{id}/submit` | Enviar examen |
| GET | `/{id}/result` | Resultado detallado |
| POST | `/{id}/events` | Log de evento de seguridad |
| POST | `/{id}/form-submit` | Enviar formulario asociado |

### Admin (`/api/admin`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard` | Métricas combinadas (7+ agregaciones) |
| GET | `/attempts` | Intentos paginados con usuario y examen |
| GET | `/attempts/{id}` | Detalle intento para admin |
| GET | `/question-stats` | % aciertos por pregunta |
| GET | `/analytics` | Stats globales (avg score, completion rate) |
| GET | `/users` | Lista usuarios paginada con búsqueda |
| PATCH | `/users/{id}/password` | Admin resetea contraseña |
| PATCH | `/users/{id}/role` | Admin cambia rol |

### Utilidades
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/config/public` | Config pública del sistema |
| GET | `/health` | Health check |

---

## Tests

### Backend — 26 tests (pytest)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `test_auth.py` | 8 | login, register, /me, duplicado, contraseña corta |
| `test_grading.py` | 9 | single/multiple choice, numeric, algebraic, None |
| `test_attempt_flow.py` | 9 | start, answer, mark-review, submit, result, /my |

Ejecutar: `cd backend-py && python -m pytest tests/ -v`

### Frontend — 9 tests (Jest)

| Archivo | Tests |
|---------|-------|
| `src/app/__tests__/utils.test.ts` | `formatTime` (5) + `calcPct` (4) |

Ejecutar: `cd frontend && npx jest`

### E2E — Playwright (configurado)

| Archivo | Tests |
|---------|-------|
| `e2e/smoke.spec.ts` | Home carga, login form, register form, admin → redirect |

Ejecutar:
```bash
cd frontend
npx playwright install   # solo primera vez (descarga browsers)
npm run e2e
```

---

## Docker

### Levantar todo (desarrollo)

```bash
cd docker
docker compose up --build
```

Servicios:
- `postgres` → `localhost:5432`
- `redis` → `localhost:6379`
- `backend` → `http://localhost:4000`
- `frontend` → `http://localhost:3000`
- Swagger UI → `http://localhost:4000/api/docs`

### Variables de entorno

Crear `docker/.env` (o usar valores por defecto de dev):

```env
JWT_SECRET=cambia-esto-en-produccion
POSTGRES_PASSWORD=postgres
```

### Credenciales demo (seed automático)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | admin |
| `demo` | `demo123` | estudiante |

---

## URLs del frontend

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Home con lista de simuladores | Público |
| `/login` | Login | Público |
| `/register` | Registro de cuenta | Público |
| `/examen` | Simulador de examen | Autenticado |
| `/historial` | Mis intentos anteriores | Autenticado |
| `/perfil` | Cambiar contraseña | Autenticado |
| `/admin` | Dashboard admin | Admin / Editor |
| `/admin/exams` | Gestión de simuladores | Admin / Editor |
| `/admin/questions` | Banco de preguntas | Admin / Editor |
| `/admin/attempts` | Intentos de todos los usuarios | Admin / Editor |
| `/admin/analytics` | Estadísticas | Admin / Editor |
| `/admin/users` | Gestión de usuarios | Admin |
| `/admin/config` | Configuración del sistema | Admin |

---

## Pendiente / fuera de scope actual

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Redis integrado en lógica (cache de exámenes, rate-limit persistente) | Media | Redis está en el stack pero el rate-limit usa dict en memoria |
| Recuperación de contraseña por email | Media | Requiere SMTP / servicio de email |
| Paginación en UI admin (exámenes/preguntas) | Media | Backend ya soporta `?page&page_size`, falta UI |
| Exportar resultados a PDF con formato rico | Baja | Actualmente `window.print()` básico |
| Validación algebraica avanzada (SymPy / nerdamer) | Baja | Actualmente normalización de strings |
| OAuth / SSO Google | Muy baja | — |
| E2E tests completos (login real, flujo de examen) | Baja | Solo smoke tests configurados |

---

## Commits del proyecto

| Hash | Descripción |
|------|-------------|
| `1c86ae0` | feat: password reset, user management, drag-drop reorder, PDF, E2E |
| `d74918c` | feat(frontend): professional exam UI overhaul |
| `57bec25` | feat: EXHCOBA Simulator Platform — full stack implementation |
