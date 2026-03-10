// Empty string means same-origin (Nginx proxies /api/ to backend).
// 'http://localhost:4000' is the dev fallback when no build arg is provided.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function authHeaders(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Credenciales incorrectas');
  return res.json() as Promise<{ access_token: string; user: { id: string; username: string; name: string; role: string } }>;
}

export async function fetchMe(token: string) {
  const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('No autenticado');
  return res.json();
}

// ─── Admin: Exams ─────────────────────────────────────────────────────────────

export async function adminCreateExam(token: string, data: object) {
  const res = await fetch(`${API_URL}/api/exams`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear examen');
  return res.json();
}

export async function adminUpdateExam(token: string, id: string, data: object) {
  const res = await fetch(`${API_URL}/api/exams/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar examen');
  return res.json();
}

export async function adminDeleteExam(token: string, id: string) {
  const res = await fetch(`${API_URL}/api/exams/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar examen');
}

// ─── Admin: Questions ─────────────────────────────────────────────────────────

export async function fetchExamQuestions(examId: string) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/questions`);
  if (!res.ok) throw new Error('Error al cargar preguntas');
  return res.json();
}

export async function adminCreateQuestion(token: string, data: object) {
  const res = await fetch(`${API_URL}/api/questions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear pregunta');
  return res.json();
}

export async function adminUpdateQuestion(token: string, id: string, data: object) {
  const res = await fetch(`${API_URL}/api/questions/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar pregunta');
  return res.json();
}

export async function adminDeleteQuestion(token: string, id: string) {
  const res = await fetch(`${API_URL}/api/questions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar pregunta');
}

// ─── Admin: Form Template ─────────────────────────────────────────────────────

export async function adminUpdateFormTemplate(token: string, examId: string, data: object) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/form-template`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar formulario');
  return res.json();
}

export async function fetchExams() {
  const res = await fetch(`${API_URL}/api/exams`);
  if (!res.ok) throw new Error('Error al cargar exámenes');
  return res.json();
}

export async function fetchExam(id: string) {
  const res = await fetch(`${API_URL}/api/exams/${id}`);
  if (!res.ok) throw new Error('Error al cargar examen');
  return res.json();
}

export async function startAttempt(examId: string) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Error al iniciar examen');
  return res.json();
}

export async function fetchAttempt(id: string) {
  const res = await fetch(`${API_URL}/api/attempts/${id}`);
  if (!res.ok) throw new Error('Error al cargar intento');
  return res.json();
}

export async function saveAnswer(attemptId: string, questionId: string, answerJson: unknown) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/answer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, answerJson }),
  });
  if (!res.ok) throw new Error('Error al guardar respuesta');
  return res.json();
}

export async function submitAttempt(attemptId: string) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Error al enviar examen');
  return res.json();
}

export async function fetchResult(attemptId: string) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/result`);
  if (!res.ok) throw new Error('Error al cargar resultados');
  return res.json();
}

export async function submitForm(attemptId: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/form-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error('Error al guardar formulario');
  return res.json();
}

export async function fetchFormTemplate(examId: string) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/form-template`);
  if (!res.ok) throw new Error('Error al cargar plantilla');
  return res.json();
}

export async function markForReview(attemptId: string, questionId: string, marked: boolean) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/mark-review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, marked }),
  });
  if (!res.ok) throw new Error('Error al marcar pregunta');
  return res.json();
}

export async function logSecurityEvent(attemptId: string, eventType: string, details?: Record<string, unknown>) {
  try {
    await fetch(`${API_URL}/api/attempts/${attemptId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, details }),
    });
  } catch { /* non-critical, fail silently */ }
}

export async function fetchAnalytics(token: string) {
  const res = await fetch(`${API_URL}/api/admin/analytics`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar analítica');
  return res.json();
}

export async function fetchQuestionStats(token: string) {
  const res = await fetch(`${API_URL}/api/admin/analytics/questions`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar estadísticas');
  return res.json();
}

export async function fetchExamSections(examId: string) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/sections`);
  if (!res.ok) throw new Error('Error al cargar secciones');
  return res.json();
}

export async function adminCreateSection(token: string, examId: string, data: object) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/sections`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear sección');
  return res.json();
}

export async function importQuestions(token: string, data: object[]) {
  const res = await fetch(`${API_URL}/api/questions/import`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al importar preguntas');
  return res.json();
}

// Admin: Dashboard
export async function fetchAdminDashboard(token: string) {
  const res = await fetch(`${API_URL}/api/admin/dashboard`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar dashboard');
  return res.json();
}

// Admin: All attempts list
export async function fetchAdminAttempts(token: string, skip = 0, limit = 50) {
  const res = await fetch(`${API_URL}/api/admin/attempts?skip=${skip}&limit=${limit}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar intentos');
  return res.json();
}

// Admin: Attempt detail
export async function fetchAdminAttemptDetail(token: string, attemptId: string) {
  const res = await fetch(`${API_URL}/api/admin/attempts/${attemptId}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar intento');
  return res.json();
}

// Admin: Duplicate exam
export async function adminDuplicateExam(token: string, examId: string) {
  const res = await fetch(`${API_URL}/api/exams/${examId}/duplicate`, {
    method: 'POST', headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error al duplicar examen');
  return res.json();
}

// Admin: Duplicate question
export async function adminDuplicateQuestion(token: string, questionId: string) {
  const res = await fetch(`${API_URL}/api/questions/${questionId}/duplicate`, {
    method: 'POST', headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error al duplicar pregunta');
  return res.json();
}

// Admin: Bank questions (exam_id=null)
export async function fetchBankQuestions(token: string) {
  const res = await fetch(`${API_URL}/api/questions?bank=true`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar banco');
  return res.json();
}

// Admin: All questions with filters
export async function fetchAdminQuestions(token: string, params?: { materia?: string; difficulty?: string; bank?: boolean }) {
  const q = new URLSearchParams();
  if (params?.materia) q.set('materia', params.materia);
  if (params?.difficulty) q.set('difficulty', params.difficulty);
  if (params?.bank) q.set('bank', 'true');
  const res = await fetch(`${API_URL}/api/questions?${q}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error al cargar preguntas');
  return res.json();
}

// Admin: Section update
export async function adminUpdateSection(token: string, sectionId: string, data: object) {
  const res = await fetch(`${API_URL}/api/exams/sections/${sectionId}`, {
    method: 'PUT', headers: authHeaders(token), body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar sección');
  return res.json();
}

// Admin: Section delete
export async function adminDeleteSection(token: string, sectionId: string) {
  const res = await fetch(`${API_URL}/api/exams/sections/${sectionId}`, {
    method: 'DELETE', headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error al eliminar sección');
}

// Auth: Register
export async function register(data: { username: string; password: string; name?: string; email?: string }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al registrarse');
  }
  return res.json() as Promise<{ access_token: string; user: { id: string; username: string; name: string; role: string } }>;
}

// User: My attempts (requires auth)
export async function fetchMyAttempts(token: string) {
  const res = await fetch(`${API_URL}/api/attempts/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar historial');
  return res.json();
}

// ── Admin: Users management ────────────────────────────────────────
export async function fetchAdminUsers(token: string, page = 1, pageSize = 20, search = '') {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set('search', search);
  const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error cargando usuarios');
  return res.json();
}

export async function adminResetUserPassword(token: string, userId: string, newPassword: string) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!res.ok) throw new Error('Error al resetear contraseña');
  return res.json();
}

export async function adminUpdateUserRole(token: string, userId: string, role: string) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Error al actualizar rol');
  return res.json();
}

export async function changeMyPassword(token: string, currentPassword: string, newPassword: string) {
  const res = await fetch(`${API_URL}/api/auth/me/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Error al cambiar contraseña');
  }
  return res.json();
}

export async function reorderQuestions(token: string, questions: { question_id: string; order_index: number }[]) {
  const res = await fetch(`${API_URL}/api/questions/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ questions }),
  });
  if (!res.ok) throw new Error('Error al reordenar');
  return res.json();
}
