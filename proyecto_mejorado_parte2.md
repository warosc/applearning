Quiero que construyas una aplicación web completa, moderna, profesional y dockerizada llamada “Simulador de Examen”, lista para desarrollo local y despliegue en servidor.

La app debe estar orientada a simulaciones de examen reales, con interfaz limpia, rápida, intuitiva, responsiva y preparada para escalar.

## Objetivo principal
Desarrolla una plataforma de simulación de examen inspirada visualmente en una app de referencia que tengo, respetando estos apartados funcionales y visuales:

- panel de preguntas numeradas
- temporizador / reloj visible
- navegación rápida por número de pregunta
- formulario previo o asociado al intento
- calculadora integrada
- área principal de resolución
- estados visuales de avance
- resultados finales con calificación automática

La experiencia debe sentirse como una plataforma real de examen, estable, fluida y profesional.

---

## Requerimientos funcionales obligatorios

### 1. Flujo general del simulador
- La aplicación debe permitir presentar una simulación completa de examen.
- Debe existir una lista de preguntas numeradas.
- El usuario debe poder navegar:
  - a la siguiente pregunta
  - a la anterior pregunta
  - directamente haciendo click sobre cualquier número de pregunta
- Debe poder saltar, por ejemplo, de la pregunta 20 a la 40 sin pasar por las intermedias.
- Debe verse claramente cuál pregunta está activa.
- Debe mostrarse el estado de cada pregunta:
  - activa
  - respondida
  - pendiente
  - marcada para revisar
- Debe existir una opción para “Marcar para revisar”.
- El examen debe poder finalizar manualmente antes de que termine el tiempo.
- Antes de enviar definitivamente, debe mostrarse una confirmación final con resumen:
  - respondidas
  - pendientes
  - marcadas para revisar

### 2. Temporizador / reloj
- Debe existir un temporizador visible en todo momento.
- Debe mostrar el tiempo restante del examen.
- Debe continuar funcionando al cambiar de pregunta.
- Debe persistir correctamente aunque el usuario recargue la página.
- El backend debe ser la fuente de verdad del tiempo restante.
- Al finalizar el tiempo:
  - el examen debe pasar automáticamente a estado finalizado
  - se deben bloquear nuevas respuestas si así está configurado
  - se deben calcular y mostrar los resultados automáticamente
- Debe contemplar diferencias entre reloj del cliente y del servidor.

### 3. Tipos de preguntas / respuestas
Implementa como mínimo los siguientes tipos de respuesta:

#### A. Arrastre (drag and drop)
- El usuario debe poder arrastrar elementos hacia zonas objetivo.
- Debe poder reordenar o corregir su respuesta.
- Debe guardarse automáticamente el estado.
- Debe soportar validación correcta.
- La arquitectura debe quedar lista para futuros ejercicios de relación, ordenamiento o clasificación.

#### B. Selección
- Debe soportar:
  - selección simple
  - selección múltiple
- Debe guardar automáticamente la respuesta al seleccionar.
- Debe reflejar visualmente el estado elegido.
- Debe ser fácil configurar el tipo desde backend o metadata de la pregunta.

#### C. Escritura numérica / algebraica
- Debe permitir respuestas numéricas.
- Debe permitir respuestas algebraicas.
- Debe normalizar entradas:
  - espacios extra
  - formatos equivalentes sencillos
  - mayúsculas / minúsculas si aplica
- Debe existir una validación inicial funcional.
- Debe quedar preparada la arquitectura para integrar validación algebraica avanzada después.
- No usar lógica insegura para evaluar expresiones.

### 4. Formulario asociado al examen
- Debe existir un formulario modular asociado al intento.
- Debe poder incluir campos como:
  - nombre
  - correo
  - grado
  - curso
  - sección
  - fecha
  - observaciones
  - número de intento
- El formulario debe estar desacoplado del motor de preguntas.
- Debe poder editarse posteriormente sin romper el resto del sistema.
- Debe soportar definición por esquema JSON.
- Debe existir persistencia del formulario enviado.

### 5. Calculadora integrada
- Debe existir un módulo de calculadora accesible durante el examen.
- Debe estar integrada en la interfaz.
- Debe implementarse como componente aislado y reutilizable.
- Debe ser segura.
- No usar eval inseguro.
- Debe soportar operaciones básicas al inicio.
- Debe quedar preparada para restricciones futuras por tipo de examen.
- Debe permitir habilitarse o deshabilitarse por examen.

### 6. Sistema de guardado automático
- Todas las respuestas deben guardarse automáticamente.
- Debe haber autosave al:
  - responder
  - cambiar de pregunta
  - marcar para revisar
  - interactuar con drag and drop
- Debe existir retroalimentación visual discreta del guardado:
  - guardando
  - guardado
  - error de guardado
- Si el usuario recarga la página, debe recuperar el intento activo y el estado exacto.
- Si la conexión falla momentáneamente, debe manejar reintentos controlados.

### 7. Reanudación del examen
- Si el usuario cierra el navegador o refresca, debe poder retomar el intento si sigue vigente.
- Debe restaurarse:
  - pregunta activa
  - tiempo restante
  - respuestas dadas
  - preguntas marcadas para revisar
  - datos del formulario
- Debe contemplar expiración del intento si ya venció el tiempo.

### 8. Sistema de calificación
La lógica de calificación debe ser configurable y robusta.

Implementar:
- puntaje total configurable por examen
- puntaje por pregunta
- posibilidad de distribuir el puntaje total entre respuestas
- cálculo automático de:
  - total obtenido
  - total posible
  - porcentaje
  - correctas
  - incorrectas
  - sin responder
- Debe soportar preguntas con puntaje individual.
- Preparar la arquitectura para soportar luego:
  - ponderación por sección
  - penalización por error
  - parciales
  - reglas especiales

### 9. Resultados finales
La vista de resultados debe mostrar como mínimo:
- nota final
- porcentaje
- cantidad de respuestas correctas
- cantidad de respuestas incorrectas
- cantidad de omitidas
- tiempo utilizado
- tiempo total
- resumen por tipo de pregunta o sección si existe

Preparar la arquitectura para soportar en el futuro:
- revisión detallada por pregunta
- retroalimentación
- exportación PDF
- historial de intentos
- estadísticas comparativas

---

## Requerimientos UX/UI

### 10. Diseño e interfaz
Quiero una interfaz moderna, académica, limpia y profesional.

La estructura sugerida:
- header superior con:
  - nombre del examen
  - temporizador
  - estado de guardado
  - botón de finalizar
- panel lateral o superior con números de preguntas
- área central para mostrar la pregunta activa
- panel secundario para calculadora y datos del examen
- resumen visual de progreso

### 11. Estados visuales
Cada número de pregunta debe tener estados visuales diferenciados:
- activa
- respondida
- pendiente
- marcada para revisar
- vencida o bloqueada si aplica

### 12. Responsive
La app debe ser responsive y usable en:
- desktop
- tablet
- móvil

Prioridad visual:
- desktop first
- tablet usable
- móvil funcional sin romper navegación

### 13. Experiencia de usuario
- Sin recargas completas de página
- Fluida y rápida
- Navegación inmediata
- Componentes reutilizables
- Interfaz consistente
- Accesible y clara
- Mensajes de error amigables
- Confirmaciones adecuadas
- No saturar con modales innecesarios

---

## Requerimientos técnicos

### 14. Stack recomendado
Usa preferiblemente este stack:

#### Frontend
- Next.js 14+ con TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand para estado cliente
- React Hook Form
- Zod
- dnd-kit

#### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

#### Base de datos
- PostgreSQL

#### Opcional / recomendable
- Redis para cache o sesiones
- math.js para validaciones iniciales controladas
- futura integración con SymPy para validación algebraica avanzada

### 15. Arquitectura del proyecto
Organiza el proyecto así:

- /frontend
- /backend
- /docker
- /docs
- /scripts

Separar claramente:
- UI
- lógica de negocio
- acceso a datos
- validación
- configuración
- utilidades

### 16. Modelo de datos mínimo
Diseña como mínimo estas entidades:

- users
- exams
- exam_sections
- questions
- question_options
- exam_attempts
- answers
- form_templates
- form_submissions
- calculator_settings

### 17. Campos sugeridos
#### exams
- id
- title
- description
- total_score
- duration_minutes
- allow_review_mark
- calculator_enabled
- is_published
- created_at
- updated_at

#### questions
- id
- exam_id
- section_id nullable
- order_index
- type
- prompt
- score
- metadata_json
- created_at
- updated_at

#### question_options
- id
- question_id
- label
- value
- is_correct
- order_index
- metadata_json

#### exam_attempts
- id
- exam_id
- user_id nullable
- started_at
- submitted_at
- expires_at
- time_spent_seconds
- status
- score_obtained
- percentage
- current_question_index

#### answers
- id
- attempt_id
- question_id
- answer_json
- is_correct
- score_obtained
- is_marked_for_review
- answered_at
- updated_at

#### form_templates
- id
- exam_id
- title
- schema_json

#### form_submissions
- id
- attempt_id
- payload_json
- created_at

#### calculator_settings
- id
- exam_id
- enabled
- config_json

---

## API mínima requerida

### 18. Endpoints REST
Implementa endpoints bien estructurados:

#### Exams
- GET /api/exams
- GET /api/exams/{id}
- POST /api/exams
- PUT /api/exams/{id}
- DELETE /api/exams/{id}

#### Questions
- GET /api/exams/{id}/questions
- POST /api/questions
- PUT /api/questions/{id}
- DELETE /api/questions/{id}

#### Attempts
- POST /api/exams/{id}/start
- GET /api/attempts/{id}
- PATCH /api/attempts/{id}/answer
- PATCH /api/attempts/{id}/mark-review
- POST /api/attempts/{id}/submit
- GET /api/attempts/{id}/result
- GET /api/attempts/{id}/resume

#### Forms
- GET /api/exams/{id}/form-template
- PUT /api/exams/{id}/form-template
- POST /api/attempts/{id}/form-submit

#### Utility
- GET /health
- GET /api/config/public

---

## Comportamientos clave

### 19. Fuente de verdad
- El backend debe ser la fuente de verdad para:
  - tiempo restante
  - estado del intento
  - respuestas
  - calificación
  - entrega final
- No depender únicamente del frontend para lógica crítica.

### 20. Validación
- Validar en frontend y backend.
- Usar esquemas estrictos.
- Sanitizar entradas.
- Validar tipos de respuesta por metadata.
- Manejar errores de forma consistente.

### 21. Logs y observabilidad
Agregar:
- endpoint /health
- logs claros de arranque
- logs básicos de errores
- estructura preparada para observabilidad
- manejo centralizado de excepciones

---

## Seguridad

### 22. Recomendaciones de seguridad obligatorias
- No usar eval para calculadora ni álgebra.
- Sanitizar inputs.
- Validar payloads con esquemas estrictos.
- Configurar CORS por variables de entorno.
- No exponer secretos en repositorio.
- Preparar rate limiting.
- Usar headers de seguridad.
- Manejar errores sin filtrar información sensible.
- Preparar autenticación segura aunque inicialmente sea básica.

---

## Dockerización obligatoria

### 23. Todo debe quedar dockerizado
Debes crear:

- Dockerfile para frontend
- Dockerfile para backend
- docker-compose.yml para desarrollo
- docker-compose.prod.yml para producción
- .env.example para frontend
- .env.example para backend

### 24. Requisitos Docker
- multistage builds
- imágenes livianas
- healthchecks
- restart unless-stopped
- volúmenes persistentes
- red interna docker
- usar nombres de servicio entre contenedores
- no usar localhost entre contenedores
- scripts para migraciones
- scripts para seed
- backend esperando a postgres correctamente
- configuración preparada para reverse proxy

### 25. Servicios mínimos
- frontend
- backend
- postgres
- redis opcional
- nginx opcional para producción

---

## DevOps y despliegue

### 26. Preparación para producción
Debe quedar listo para desplegar detrás de:
- Nginx
- Traefik

Incluir:
- ejemplo de reverse proxy
- soporte para HTTPS por proxy externo
- variables de entorno por dominio
- documentación clara para levantar desarrollo y producción

---

## Panel administrador preparado

### 27. Preparar base para administración
Aunque no quede completo, deja la arquitectura lista para un panel admin que permita:
- crear examen
- editar examen
- agregar preguntas
- configurar duración
- definir puntajes
- activar o desactivar calculadora
- editar formulario
- publicar o despublicar examen

Si da tiempo, crear una versión básica funcional de este panel.

---

## Seeds y datos demo

### 28. Datos de ejemplo obligatorios
Genera un examen demo con:
- 10 preguntas mínimo
- 2 de selección simple
- 2 de selección múltiple
- 2 de arrastre
- 2 numéricas
- 2 algebraicas
- formulario demo
- duración de 60 minutos
- puntaje total 100

Los seeds deben permitir probar la plataforma apenas se levante con Docker.

---

## Testing y calidad

### 29. Pruebas mínimas
Incluir pruebas básicas:
- frontend: componentes críticos y navegación principal
- backend: cálculo de resultados, guardado de respuestas, expiración del tiempo, healthcheck
- pruebas de integración mínimas para flujo de intento

### 30. Calidad esperada
- código limpio
- TypeScript estricto
- arquitectura mantenible
- componentes reutilizables
- nombres consistentes
- comentarios útiles
- README profesional
- sin hacks
- sin dependencias innecesarias
- proyecto listo para continuar creciendo

---

## Prioridades de implementación

### Prioridad 1
- UI del simulador
- navegación por preguntas
- temporizador persistente
- guardado automático
- selección simple/múltiple
- respuestas numéricas
- reanudación de intento
- cálculo de resultados
- Docker funcional

### Prioridad 2
- drag and drop avanzado
- validación algebraica mejorada
- marcar para revisar
- formulario configurable
- panel admin básico

### Prioridad 3
- reportes
- exportación PDF
- autenticación completa
- historial de intentos
- banco de preguntas
- estadísticas

---

## Entregables esperados
Quiero que generes el proyecto real, no solo ejemplos. Debes crear:

1. Proyecto completo frontend + backend
2. Dockerfiles
3. docker-compose.yml y docker-compose.prod.yml
4. README.md completo
5. .env.example
6. migraciones
7. seed de datos demo
8. UI funcional
9. temporizador funcional
10. sistema de respuestas
11. sistema de resultados
12. healthcheck
13. pruebas básicas
14. estructura lista para seguir creciendo

---

## Importante
- Si no tienes todos los detalles visuales exactos de la app de referencia, crea una interfaz moderna inspirada en plataformas profesionales de examen.
- Si alguna validación algebraica avanzada no queda perfecta en la primera fase, deja una base robusta y extensible.
- Primero crea la estructura completa del proyecto.
- Luego implementa por módulos.
- No me des solo una guía: crea el código real y funcional.
- Quiero que el resultado quede listo para levantar con Docker y comenzar a probar inmediatamente.

---

---

# Estado de implementación actual

> Última actualización: Marzo 2026
> Todo lo que sigue documenta lo que fue efectivamente construido, las decisiones de arquitectura tomadas y lo que queda pendiente para fases futuras.

---

## Stack implementado (diferencias con el spec original)

El spec original proponía FastAPI + SQLAlchemy + Alembic para el backend. Se optó por un stack Node.js completo por coherencia con el frontend y mayor velocidad de desarrollo:

| Capa | Especificado | Implementado |
|------|-------------|--------------|
| Frontend | Next.js 14 + TS + Tailwind + Zustand | ✅ Igual |
| Backend | FastAPI + SQLAlchemy + Alembic | NestJS + Prisma ORM |
| Base de datos | PostgreSQL | ✅ PostgreSQL |
| Validación backend | Pydantic | class-validator + Zod |
| Migraciones | Alembic | Prisma Migrate |
| Auth | Básica | JWT + bcrypt + Guards globales |
| Cache | Redis (opcional) | No implementado (pendiente) |
| Álgebra avanzada | SymPy | Comparación normalizada (extensible) |

---

## Módulos implementados

### ✅ Simulador de examen (Prioridad 1 — completo)

| Funcionalidad | Estado | Notas |
|--------------|--------|-------|
| Navegación por número de pregunta | ✅ | Panel lateral con click directo |
| Saltar entre preguntas | ✅ | Sin restricción de orden |
| Estado visual por pregunta | ✅ | Activa / Respondida / Pendiente / Marcada |
| Marcar para revisar | ✅ | Toggle por pregunta |
| Confirmación antes de enviar | ✅ | Modal con resumen (respondidas / pendientes / marcadas) |
| Temporizador visible | ✅ | Cuenta regresiva en header |
| Persistencia del temporizador | ✅ | Backend es fuente de verdad; recarga restaura tiempo |
| Auto-expiración al vencer tiempo | ✅ | Backend marca `expired` y bloquea respuestas |
| Finalizar manualmente | ✅ | Botón "Finalizar" con confirmación |
| Guardado automático de respuestas | ✅ | Al responder y al cambiar de pregunta |
| Feedback visual de guardado | ✅ | Indicador "Guardando..." / "Guardado" / error |
| Reanudación de intento | ✅ | Restaura pregunta activa, respuestas, tiempo, marcadas |

### ✅ Tipos de pregunta (todos implementados)

| Tipo | Estado | Notas |
|------|--------|-------|
| Selección simple (radio) | ✅ | Auto-save al seleccionar |
| Selección múltiple (checkbox) | ✅ | Auto-save al seleccionar |
| Numérica | ✅ | Normaliza espacios; validación exacta |
| Algebraica | ✅ | Normaliza mayúsculas/minúsculas; extensible |
| Arrastre / ordenamiento (drag & drop) | ✅ | dnd-kit; guarda orden correcto |

### ✅ Formulario asociado

| Funcionalidad | Estado |
|--------------|--------|
| Formulario configurable por esquema JSON | ✅ |
| Campos: nombre, grado, curso, sección, fecha, intento | ✅ |
| Persistencia de formulario enviado | ✅ |
| Editable sin romper motor de preguntas | ✅ |

### ✅ Calculadora

| Funcionalidad | Estado |
|--------------|--------|
| Calculadora integrada en UI del examen | ✅ |
| Operaciones básicas (+, -, ×, ÷, %) | ✅ |
| Sin eval inseguro | ✅ |
| Componente aislado y reutilizable | ✅ |
| Habilitación por examen (config futura) | Arquitectura preparada |

### ✅ Sistema de calificación

| Funcionalidad | Estado |
|--------------|--------|
| Puntaje por pregunta configurable | ✅ |
| Cálculo automático de total, porcentaje, correctas/incorrectas | ✅ |
| Preguntas sin responder contadas | ✅ |
| Desglose por pregunta en resultados | ✅ |
| Ponderación por sección / penalización | Arquitectura preparada |

### ✅ Vista de resultados

| Dato mostrado | Estado |
|--------------|--------|
| Nota final y porcentaje | ✅ |
| Respuestas correctas / incorrectas / omitidas | ✅ |
| Tiempo utilizado | ✅ |
| Desglose por pregunta (✓/✗) | ✅ |
| Anillo SVG de puntaje visual | ✅ |

### ✅ Autenticación y panel admin (Fase 2)

| Funcionalidad | Estado |
|--------------|--------|
| Login con usuario y contraseña | ✅ |
| JWT con expiración de 8h | ✅ |
| Guards globales (`JwtAuthGuard` + `RolesGuard`) | ✅ |
| Rutas públicas con `@Public()` | ✅ |
| Rutas admin protegidas con `@Roles('admin')` | ✅ |
| Usuarios demo en seed | ✅ |
| Panel admin — lista de exámenes | ✅ |
| Panel admin — toggle publicado/borrador | ✅ |
| Panel admin — crear examen | ✅ |
| Panel admin — editar examen | ✅ |
| Panel admin — eliminar examen | ✅ |
| Panel admin — crear/editar/eliminar preguntas | ✅ |
| Barra de sesión en home | ✅ |
| Persistencia de sesión (localStorage) | ✅ |

### ✅ Docker y despliegue

| Elemento | Estado |
|---------|--------|
| Dockerfile backend (multistage, Alpine) | ✅ |
| Dockerfile frontend (multistage, standalone) | ✅ |
| docker-compose.yml (desarrollo) | ✅ |
| Healthcheck en PostgreSQL | ✅ |
| Migraciones automáticas al iniciar | ✅ |
| Seed automático si la base está vacía | ✅ |
| OpenSSL incluido en Alpine | ✅ |
| Volúmenes persistentes | ✅ |

### ✅ Calidad y pruebas

| Elemento | Estado |
|---------|--------|
| TypeScript estricto | ✅ |
| Tests backend: GradingService | ✅ |
| Tests frontend: componentes y utils | ✅ |
| Swagger / OpenAPI documentado | ✅ |
| Endpoint `/health` | ✅ |
| Manejo centralizado de excepciones | ✅ |
| CORS por variable de entorno | ✅ |

---

## Credenciales demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `demo` | `demo123` | Estudiante |

---

## Acceso rápido

```bash
# Levantar todo con Docker
cd applearning
docker compose -f docker/docker-compose.yml up -d

# Seed manual (solo si la BD ya tenía datos antes)
docker exec docker-backend-1 sh -c \
  'TS_NODE_COMPILER_OPTIONS="{\"module\":\"commonjs\"}" npx ts-node prisma/seed.ts'
```

| URL | Descripción |
|-----|------------|
| http://localhost:3000 | Aplicación frontend |
| http://localhost:3000/login | Login (admin / admin123) |
| http://localhost:3000/admin | Panel administrador |
| http://localhost:4000/api | Swagger / documentación API |

---

## Arquitectura del proyecto implementado

```
applearning/
├── frontend/                    # Next.js 14 + TypeScript
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Home (Suspense + HomeClient)
│       │   ├── home-client.tsx   # Lista de exámenes + barra de sesión
│       │   ├── login/            # Página de login
│       │   ├── admin/            # Panel administrador
│       │   │   ├── layout.tsx    # Guard de autenticación admin
│       │   │   ├── page.tsx      # Lista de exámenes
│       │   │   └── exams/
│       │   │       ├── new/      # Crear examen
│       │   │       └── [id]/     # Editar examen + preguntas
│       │   └── examen/           # Simulador (Suspense + ExamenClient)
│       ├── components/
│       │   ├── admin/            # ExamForm, QuestionEditor
│       │   ├── questions/        # Renderers por tipo de pregunta
│       │   ├── results-view.tsx  # Vista de resultados con SVG ring
│       │   ├── question-panel.tsx
│       │   ├── calculator.tsx
│       │   ├── timer.tsx
│       │   └── exam-form.tsx
│       ├── store/
│       │   ├── simulator-store.ts  # Estado del examen activo
│       │   └── auth-store.ts       # Auth (token, user, persisted)
│       └── lib/
│           └── api.ts              # Todas las llamadas al backend
│
├── backend/                     # NestJS + Prisma
│   └── src/
│       ├── auth/                 # JWT, guards, decoradores
│       ├── users/                # UsersService + UsersModule
│       ├── exams/                # CRUD de exámenes
│       ├── questions/            # CRUD de preguntas
│       ├── attempts/             # Intento, respuestas, calificación
│       ├── forms/                # Plantilla + submission
│       └── prisma/               # PrismaService
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/
│
└── docker/
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── docker-compose.yml
```

---

## Modelo de datos implementado

```prisma
User          id, username, passwordHash, name, role
Exam          id, title, description, totalScore, durationMinutes, isPublished
ExamSection   id, examId, title, orderIndex
Question      id, examId, sectionId, type, prompt, score, metadataJson, orderIndex
QuestionOption id, questionId, label, value, isCorrect, orderIndex
ExamAttempt   id, examId, userId, startedAt, submittedAt, expiresAt, status,
              scoreObtained, percentage, timeSpentSeconds
Answer        id, attemptId, questionId, answerJson, isCorrect, scoreObtained
FormTemplate  id, examId, title, schemaJson
FormSubmission id, attemptId, payloadJson
CalculatorSetting id, examId, enabled, allowedOps
```

---

## Endpoints API implementados

```
POST   /api/auth/login                    # Login → JWT
GET    /api/auth/me                       # Usuario actual

GET    /api/exams                         # Listar exámenes
GET    /api/exams/:id                     # Obtener examen
POST   /api/exams               [admin]   # Crear examen
PUT    /api/exams/:id           [admin]   # Actualizar examen
DELETE /api/exams/:id           [admin]   # Eliminar examen

GET    /api/exams/:id/questions           # Preguntas de un examen
POST   /api/questions           [admin]   # Crear pregunta
PUT    /api/questions/:id       [admin]   # Actualizar pregunta
DELETE /api/questions/:id       [admin]   # Eliminar pregunta

POST   /api/exams/:id/start               # Iniciar intento
GET    /api/attempts/:id                  # Estado del intento
PATCH  /api/attempts/:id/answer           # Guardar respuesta
POST   /api/attempts/:id/submit           # Entregar examen
GET    /api/attempts/:id/result           # Resultados

GET    /api/exams/:id/form-template       # Plantilla de formulario
PUT    /api/exams/:id/form-template [admin]  # Actualizar plantilla
POST   /api/attempts/:id/form-submit      # Enviar formulario

GET    /health                            # Healthcheck
```

---

## Pendiente para fases futuras

### Fase 3 — Funcionalidad avanzada

| Tarea | Prioridad |
|-------|----------|
| `PATCH /api/attempts/:id/mark-review` — endpoint dedicado para marcar preguntas | Alta |
| `GET /api/attempts/:id/resume` — endpoint de reanudación explícita | Alta |
| Restricción de calculadora por examen (campo `calculator_enabled` en Exam) | Media |
| Panel admin — editar formulario (schema JSON visual) | Media |
| Panel admin — gestión de secciones por examen | Media |
| Panel admin — reordenar preguntas con drag & drop | Media |
| Historial de intentos por usuario | Media |
| `GET /api/config/public` — configuración pública del sistema | Baja |

### Fase 3 — Calidad y pruebas

| Tarea | Prioridad |
|-------|----------|
| Tests de integración: flujo completo de intento (start → answer → submit → result) | Alta |
| Tests frontend: ExamenClient, QuestionPanel, ResultsView | Media |
| Tests backend: AttemptsService, FormsService | Media |
| E2E con Playwright o Cypress | Baja |

### Fase 4 — Escala y producción

| Tarea | Prioridad |
|-------|----------|
| docker-compose.prod.yml con Nginx reverse proxy | Alta |
| Variables de entorno separadas por entorno | Alta |
| JWT_SECRET obligatorio (error en arranque si no está definido) | Alta |
| Rate limiting por IP y por usuario en rutas de auth | Alta |
| Redis para sesiones / cache de exámenes | Media |
| Paginación en listas de exámenes | Media |
| Exportación de resultados a PDF | Baja |
| Estadísticas comparativas por examen | Baja |
| Validación algebraica avanzada con math.js o nerdamer | Baja |
| Integración futura con SymPy via microservicio Python | Muy baja |

### Fase 4 — Auth y usuarios

| Tarea | Prioridad |
|-------|----------|
| Registro de nuevos usuarios | Media |
| Recuperación de contraseña | Media |
| Roles granulares (editor, revisor, estudiante) | Baja |
| OAuth (Google / SSO institucional) | Muy baja |

---

## Decisiones de arquitectura documentadas

### 1. NestJS sobre FastAPI
Se eligió NestJS para mantener el stack en Node.js/TypeScript de punta a punta, reducir la fricción de tipos compartidos y acelerar el desarrollo. La arquitectura modular de NestJS (módulos, controladores, servicios) es directamente equivalente a FastAPI en legibilidad y mantenibilidad.

### 2. Prisma sobre SQLAlchemy
Prisma ofrece type-safety nativa con TypeScript, generación automática de cliente y migraciones declarativas sin necesidad de escribir SQL manualmente. El schema es la fuente de verdad única del modelo de datos.

### 3. Guards globales con opt-out (@Public)
Todas las rutas del backend están protegidas por JWT por defecto. Las rutas públicas se marcan explícitamente con `@Public()`. Esto es más seguro que opt-in y previene rutas protegidas olvidadas.

### 4. Backend como fuente de verdad del tiempo
El tiempo restante se calcula en el backend comparando `startedAt + durationMinutes` con la hora actual. El frontend sincroniza al cargar el intento y al reanudar. Esto evita manipulación del temporizador desde el cliente.

### 5. Seed idempotente con check
El script de inicio de Docker ejecuta el seed solo si no existen exámenes en la base de datos. Esto permite recrear usuarios demo sin ejecutar comandos manuales en entornos limpios.

### 6. Auth store persistida en localStorage
El token JWT y los datos del usuario se almacenan en localStorage vía Zustand `persist`. El admin layout valida el rol en cada render y redirige a `/login` si no hay sesión válida. No se usa middleware de Next.js para simplificar el despliegue estático/standalone.