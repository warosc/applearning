Quiero que construyas una aplicación web completa, profesional, moderna y dockerizada llamada “Simulador de Examen”, lista para desarrollo local y despliegue en servidor.

## Objetivo general
Desarrolla una app de simulación de examen con una interfaz visual muy parecida a una aplicación de referencia/screenshot que tengo, respetando estos apartados principales:
- panel de preguntas
- reloj o temporizador visible
- navegación por número de pregunta
- formulario
- calculadora
- área principal de respuesta
- indicador visual de progreso/estado de preguntas

Debe sentirse como una plataforma real de examen: rápida, limpia, responsiva, intuitiva y preparada para crecer.

## Requerimientos funcionales obligatorios

### 1) Flujo general del simulador
- La aplicación debe permitir presentar una simulación de examen.
- Debe existir una lista de preguntas numeradas.
- El usuario debe poder moverse entre preguntas:
  - siguiente
  - anterior
  - haciendo click directamente sobre el número de pregunta
- La navegación por preguntas debe ser rápida.
- Debe ser posible saltar, por ejemplo, de la pregunta 20 a la 40 con solo hacer click sobre el número correspondiente.
- Debe verse claramente cuál pregunta está activa.
- Debe verse cuáles preguntas ya fueron contestadas y cuáles están pendientes.

### 2) Temporizador / reloj
- Debe existir un reloj visible durante toda la simulación.
- Debe mostrar el tiempo restante del examen.
- Debe seguir corriendo aunque el usuario cambie de pregunta.
- Al finalizar el tiempo:
  - marcar el examen como finalizado
  - bloquear nuevas respuestas si se configura así
  - calcular y mostrar resultados

### 3) Tipos de preguntas / respuestas
Implementa estos 3 tipos de respuesta como mínimo:

#### A. Tipo arrastre (drag and drop)
- El usuario debe poder arrastrar opciones a zonas de respuesta.
- Debe validarse correctamente.
- Debe poder reordenarse si el usuario cambia de idea.
- Debe guardar el estado de la respuesta.

#### B. Tipo selección
- Preguntas de selección simple o múltiple según configuración.
- Deben mostrarse opciones claras.
- Debe guardarse la selección automáticamente.

#### C. Tipo escritura numérica / algebraica
- Campo para ingresar respuestas numéricas.
- Campo para escritura algebraica.
- Debe permitir validar formatos numéricos y algebraicos básicos.
- Debe tolerar espacios innecesarios y normalizar entradas antes de validar.
- Diseñar la estructura para que más adelante se pueda mejorar el motor de validación algebraica.

### 4) Formulario
- Debe existir un apartado de formulario.
- El formulario debe ser modular y editable después.
- Debe poder configurarse con varios apartados.
- Ejemplos: nombre, grado, curso, seccion, fecha, intento, observaciones, etc.
- El formulario debe estar desacoplado de las preguntas para poder modificarse luego sin romper la app.

### 5) Calculadora
- Debe existir un apartado de calculadora.
- Debe estar disponible durante el examen.
- Crear una calculadora integrada en la UI.
- Debe diseñarse de forma modular para que se puedan limitar o cambiar funciones después.
- Implementar una calculadora básica segura, sin uso de eval inseguro.
- La lógica debe estar encapsulada en un componente independiente.

### 6) Sistema de calificación
- El tipo de calificación del examen será por división del puntaje entre respuestas.
- Implementa una lógica de puntuación configurable:
  - examen con puntaje total configurable
  - cada pregunta recibe una fracción del total
  - o permitir puntaje individual por pregunta
- Debe calcular:
  - total obtenido
  - total posible
  - porcentaje
  - cantidad correctas
  - cantidad incorrectas
  - cantidad sin responder
- Preparar el sistema para que en el futuro soporte:
  - ponderación distinta por pregunta
  - penalización
  - parciales por sección

## Requerimientos de UX/UI
- Quiero una interfaz moderna y visualmente parecida a una app profesional de simulación de examen.
- Diseño limpio, académico y tecnológico.
- Distribución recomendada:
  - header superior con título, temporizador y acciones
  - panel lateral o superior con números de preguntas
  - área central para la pregunta activa
  - panel secundario para formulario y calculadora
- Los cuadros con número de pregunta deben tener estados visuales:
  - activa
  - respondida
  - pendiente
  - marcada para revisar
- Debe ser responsive:
  - desktop primero
  - tablet
  - móvil funcional
- Usar componentes reutilizables.
- Incluir modo claro por defecto.
- La experiencia debe sentirse fluida, sin recargas completas.

## Requerimientos técnicos
Quiero una solución profesional full stack, dockerizada y lista para escalar.

### Stack recomendado
Usa este stack salvo que exista una razón técnica mejor:
- Frontend: Next.js 14+ con TypeScript
- UI: Tailwind CSS + shadcn/ui
- Estado cliente: Zustand o Redux Toolkit
- Backend API: NestJS o FastAPI
- Base de datos: PostgreSQL
- ORM:
  - Prisma si usas Node
  - SQLAlchemy si usas Python
- Cache / sesiones opcional: Redis
- Drag and drop: dnd-kit
- Formularios: React Hook Form + Zod
- Validación: Zod
- Tests:
  - frontend: Vitest + Testing Library
  - backend: pytest o Jest
- Autenticación:
  - inicialmente simple (admin/docente/estudiante) o dejar preparada la base
- Documentación API: OpenAPI / Swagger

### Arquitectura
Construye el proyecto con separación clara:
- /frontend
- /backend
- /database o migraciones
- /docker
- /docs

### Modelo de datos mínimo
Diseña entidades mínimas:
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

### Campos recomendados
#### exams
- id
- title
- description
- total_score
- duration_minutes
- is_published
- created_at
- updated_at

#### questions
- id
- exam_id
- section_id nullable
- order_index
- type (drag_drop, single_choice, multiple_choice, numeric, algebraic)
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
- time_spent_seconds
- status (in_progress, submitted, expired)
- score_obtained
- percentage

#### answers
- id
- attempt_id
- question_id
- answer_json
- is_correct
- score_obtained
- answered_at

#### form_templates
- id
- exam_id
- title
- schema_json

#### form_submissions
- id
- attempt_id
- payload_json

## API mínima requerida
Crea endpoints REST bien estructurados:

### Exams
- GET /api/exams
- GET /api/exams/:id
- POST /api/exams
- PUT /api/exams/:id
- DELETE /api/exams/:id

### Questions
- GET /api/exams/:id/questions
- POST /api/questions
- PUT /api/questions/:id
- DELETE /api/questions/:id

### Attempts
- POST /api/exams/:id/start
- GET /api/attempts/:id
- PATCH /api/attempts/:id/answer
- POST /api/attempts/:id/submit
- GET /api/attempts/:id/result

### Forms
- GET /api/exams/:id/form-template
- PUT /api/exams/:id/form-template
- POST /api/attempts/:id/form-submit

## Comportamientos clave
- Guardado automático de respuestas.
- Persistencia de progreso.
- Si el usuario recarga la página, debe poder retomar el intento si sigue activo.
- Validación robusta del lado cliente y servidor.
- Manejo correcto del temporizador en frontend y backend.
- El backend debe ser la fuente de verdad del tiempo y resultados.
- No usar lógica crítica solo en frontend.

## Recomendaciones de seguridad
- No usar eval para calculadora ni validación algebraica.
- Sanitizar inputs.
- Validar payloads con esquemas estrictos.
- Preparar rate limiting en API.
- Configurar CORS por variables de entorno.
- No exponer secretos en el repositorio.
- Usar JWT o sesión segura si se habilita login.
- Preparar headers de seguridad.
- Manejo de errores consistente.

## Dockerización obligatoria
Quiero todo dockerizado para implementación.

### Debe incluir
- Dockerfile para frontend
- Dockerfile para backend
- docker-compose.yml para desarrollo
- docker-compose.prod.yml para producción
- servicio de postgres
- servicio opcional redis
- volúmenes persistentes
- variables de entorno mediante .env.example

### Requerimientos Docker
- Contenedores livianos
- usar multistage builds
- healthchecks
- restart unless-stopped
- red interna docker
- backend no debe depender de localhost
- usar nombres de servicio para conexión entre contenedores
- scripts de inicialización y migraciones

## DevOps / despliegue
Prepáralo para desplegarse detrás de Nginx o Traefik.
Incluir:
- ejemplo de reverse proxy
- variables de entorno para dominio
- soporte para HTTPS por proxy externo
- README claro con pasos de instalación
- comandos para levantar en desarrollo y producción

## Entregables que quiero del código
1. Proyecto completo frontend + backend
2. Dockerfiles
3. docker-compose.yml y docker-compose.prod.yml
4. README.md completo
5. .env.example para frontend y backend
6. scripts de migración y seed
7. datos de ejemplo con preguntas de los 3 tipos
8. UI funcional con navegación, reloj, formulario y calculadora
9. sistema de resultados y calificación
10. pruebas básicas unitarias y de integración

## Datos de prueba
Genera un examen demo con:
- al menos 10 preguntas
- mínimo 2 de selección
- mínimo 2 de arrastre
- mínimo 2 numéricas
- mínimo 2 algebraicas
- formulario demo
- duración de 60 minutos
- puntaje total 100

## Prioridades de implementación
Prioridad 1:
- UI de simulador
- navegación por preguntas
- temporizador
- selección y numérica
- persistencia de intento
- cálculo de resultados
- dockerización

Prioridad 2:
- drag and drop avanzado
- validación algebraica mejorada
- panel admin para crear exámenes
- formulario editable visual

Prioridad 3:
- reportes
- exportación PDF
- autenticación completa
- banco de preguntas
- secciones y estadísticas

## Calidad esperada
- Código limpio
- TypeScript estricto
- componentes reutilizables
- arquitectura mantenible
- comentarios donde agreguen valor
- README profesional
- nombres consistentes
- sin hacks
- sin dependencias innecesarias
- listo para continuar desarrollo

## Importante
Si falta detalle visual exacto del screenshot de referencia, crea una interfaz moderna inspirada en plataformas de examen profesionales.
Si alguna validación algebraica exacta no puede resolverse totalmente sin una librería especializada, deja una implementación inicial sólida y extensible.
Primero genera la estructura completa del proyecto, luego implementa módulos por fases.
No me des solo ejemplos: crea el proyecto real con archivos, carpetas y contenido funcional.