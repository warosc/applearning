# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is the **EXHCOBA Simulator Platform** — a full-stack exam simulation app.

```
applearning/
├── backend-py/       # FastAPI + SQLAlchemy + Alembic (Python 3.12)
├── frontend/         # Next.js 14 App Router + Zustand + Tailwind
└── docker/           # docker-compose.yml (dev) + docker-compose.prod.yml (prod)
```

The `backend/` directory at the root is a legacy NestJS app — **do not touch it**. The active backend is `backend-py/`.

### Backend (`backend-py/`)

- **FastAPI** app in `app/main.py` — registers all routers under `/api/`
- **Models** (`app/models/`) — SQLAlchemy ORM: `User`, `Exam`, `ExamSection`, `Question`, `QuestionOption`, `ExamAttempt`, `Answer`, `ExamEvent`, `FormTemplate`, `FormSubmission`
- **Schemas** (`app/schemas/`) — Pydantic v2. All fields use **snake_case** — the API returns snake_case JSON, not camelCase
- **Routers** (`app/routers/`) — `auth`, `exams`, `questions`, `attempts`, `analytics`, `admin`, `dashboard`
- **Services** (`app/services/`) — `grading.py`, `exam_generator.py`, `question_import.py`
- **Migrations** (`alembic/versions/`) — `001_initial.py`, `002_add_option_weight.py`
- Alembic migrations run automatically at container startup (`alembic upgrade head`)

### Frontend (`frontend/src/`)

- **`app/`** — Next.js App Router pages: `/`, `/examen`, `/login`, `/register`, `/historial`, `/perfil`, `/ayuda`, `/admin/**`
- **`lib/api.ts`** — all HTTP calls to the backend. API returns snake_case; frontend must handle both `field_name` and `fieldName` with fallbacks (`x.field_name ?? x.fieldName`)
- **`store/`** — Zustand: `simulator-store.ts` (active exam state), `auth-store.ts` (JWT token + user)
- **`components/questions/`** — one renderer per question type, routed by `question-renderer.tsx`
- **`components/admin/`** — `exam-form.tsx`, `question-editor.tsx`, `form-template-editor.tsx`

### Critical snake_case rule

**The backend always returns snake_case.** The frontend must never assume camelCase from API responses. When reading API data always use dual fallbacks:
```ts
exam.is_published ?? exam.isPublished
exam.total_score ?? exam.totalScore
```
When **writing** to the backend (POST/PUT bodies), always send snake_case keys: `is_published`, `total_score`, `duration_minutes`, `exam_id`, `order_index`, `is_correct`, `metadata_json`.

### Exam flow (student)

1. `GET /api/exams` → find published exam → `POST /api/exams/{id}/start` → returns `{ attempt: {...}, exam: { questions: [...] } }`
2. `PATCH /api/attempts/{id}/answer` — autosaved on every answer
3. `POST /api/attempts/{id}/submit` — grades all answers, returns score
4. `GET /api/attempts/{id}/result` — full breakdown

### Question types

`single_choice`, `multiple_choice`, `numeric`, `algebraic`, `drag_drop`, `fill_blank`, `multi_answer_weighted`

`multi_answer_weighted` supports partial decimal scoring via `weight` field on each `QuestionOption`.

### Exam generator (no-repeat topics)

`exam_generator.py:generate_exam_from_config()` selects one question per `tema` using a shared `used_temas` set per materia, preventing topic repetition across sections.

---

## Commands

### Run everything (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
docker compose -f docker/docker-compose.yml logs -f
```

Frontend: http://localhost:3000 · API: http://localhost:4000/api · Health: `GET /api/config/public`

Default users after seed: `admin / admin123` (admin), `demo / demo123` (estudiante)

### Backend (without Docker)

```bash
cd backend-py
pip install -r requirements.txt
# Run migrations
alembic upgrade head
# Dev server
uvicorn app.main:app --reload --port 4000
```

### Backend tests

```bash
cd backend-py
pip install -r requirements-test.txt
python -m pytest tests/ -q
# Single test file
python -m pytest tests/test_grading.py -v
```

### Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npx tsc --noEmit   # TypeScript check
npx jest --passWithNoTests
```

### Database migrations

```bash
cd backend-py
# Create new migration
alembic revision -m "describe_change"
# Apply
alembic upgrade head
# Rollback one
alembic downgrade -1
```

### Production deploy

```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

Deploy is automated via GitHub Actions on push to `main` (runs tests → SSH to VPS → `docker compose up --build -d`).

---

## Environment variables

Defined in `.env` (copy from `.env.example`). Key vars:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/simulador_examen
JWT_SECRET=<random>
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=   # empty = same-origin proxy via Next.js rewrites
```
