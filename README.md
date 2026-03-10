# Simulador de Examen

Aplicación web completa para simulación de exámenes, con panel de administración, autenticación JWT, sistema de calificación automática y soporte Docker.

## Características

- **Panel de preguntas** con navegación, marcado para revisión y guardado automático
- **Temporizador** con expiración automática del intento
- **Tipos de pregunta**: opción única, múltiple, numérica, algebraica, arrastre (drag & drop)
- **Formulario configurable** por examen, editable desde el panel admin
- **Calculadora** integrada, habilitación/deshabilitación por examen
- **Calificación automática** con puntaje por pregunta
- **Panel de administración** para gestión de exámenes, preguntas y formularios
- **Autenticación JWT** con roles `admin` y `estudiante`
- **Rate limiting** en login (5 intentos/minuto)
- **Reverse proxy Nginx** incluido para producción

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | NestJS, Prisma ORM, Passport JWT |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker, Docker Compose, Nginx |

## Requisitos previos

- Docker 24+ y Docker Compose v2
- (Desarrollo sin Docker) Node.js 20+, npm

---

## Desarrollo local con Docker

```bash
# Desde la raíz del proyecto
docker compose -f docker/docker-compose.yml up -d

# Ver logs
docker compose -f docker/docker-compose.yml logs -f

# Frontend:  http://localhost:3000
# API REST:  http://localhost:4000/api
# Swagger:   http://localhost:4000/api
```

El seed corre automáticamente al primer arranque y crea:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `demo` | `demo123` | Estudiante |

El panel de administración está en: **http://localhost:3000/admin** (requiere login con `admin`).

---

## Desarrollo sin Docker

```bash
# 1. Levantar solo PostgreSQL
docker run -d --name pg-dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=simulador_examen \
  -p 5432:5432 postgres:16-alpine

# 2. Configurar entornos
cp backend/.env.example backend/.env

# 3. Migrar y seed
cd backend
npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run start:dev

# 4. En otra terminal
cd frontend
npm install
npm run dev
```

---

## Producción

### 1. Preparar variables de entorno

```bash
cp .env.example .env
# Editar .env: cambiar contraseñas, generar JWT_SECRET, configurar dominio
```

Variables mínimas requeridas en `.env`:

```env
POSTGRES_PASSWORD=<contraseña-segura>
JWT_SECRET=<secreto-aleatorio>        # openssl rand -hex 32
CORS_ORIGIN=https://tudominio.com
```

### 2. Construir y levantar

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

### Arquitectura de producción

```
Internet → Nginx (:80) → /api/*  → backend:4000 (NestJS)
                       → /*      → frontend:3000 (Next.js)
                                  ↕
                              postgres:5432
```

Todos los servicios están en una red Docker interna (`app`). Solo Nginx expone el puerto 80.

---

## API

Con el backend corriendo, Swagger está disponible en `http://localhost:4000/api`.

Endpoint de salud (sin autenticación): `GET /api/config/public`

### Autenticación

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'

# Responde con: { "access_token": "...", "user": { ... } }
```

---

## Estructura del proyecto

```
applearning/
├── frontend/          # Next.js 14 (App Router)
│   └── src/
│       ├── app/       # Páginas: /, /examen, /login, /admin
│       ├── components/
│       ├── lib/api.ts # Cliente HTTP
│       └── store/     # Zustand stores
├── backend/           # NestJS API
│   ├── prisma/        # Schema, migraciones, seed
│   └── src/           # Módulos: auth, exams, questions, attempts, forms, config
├── docker/
│   ├── docker-compose.yml       # Desarrollo
│   ├── docker-compose.prod.yml  # Producción (con Nginx)
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── .dockerignore
├── .env.example       # Plantilla de variables de entorno
└── README.md
```

---

## Tests

```bash
# Backend (Jest)
cd backend && npm test

# Frontend (sin configurar aún)
cd frontend && npm run test
```

---

## Licencia

Privado — Uso educativo
