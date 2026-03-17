'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchExam,
  fetchExamQuestions,
  adminUpdateExam,
  adminDeleteQuestion,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminUpdateFormTemplate,
  fetchFormTemplate,
} from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { ExamForm } from '@/components/admin/exam-form';
import { QuestionEditor } from '@/components/admin/question-editor';
import { FormTemplateEditor } from '@/components/admin/form-template-editor';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

// Backend returns snake_case fields
interface Exam {
  id: string;
  title: string;
  description: string;
  total_score: number;
  duration_minutes: number;
  is_published: boolean;
}

interface QuestionOption {
  id?: string;
  label: string;
  value: string;
  is_correct: boolean;
  order_index: number;
}

interface Question {
  id: string;
  type: string;
  prompt: string;
  score: number;
  order_index: number;
  metadata_json?: Record<string, unknown> | null;
  options: QuestionOption[];
}

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token)!;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingExam, setSavingExam] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [error, setError] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    Promise.all([fetchExam(id), fetchExamQuestions(id), fetchFormTemplate(id).catch(() => null)])
      .then(([e, q, tmpl]) => {
        setExam(e);
        setQuestions(q);
        setFormFields(tmpl?.schema_json?.fields ?? tmpl?.schemaJson?.fields ?? []);
      })
      .catch(() => setError('Error al cargar examen'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveExam(data: object) {
    setSavingExam(true);
    setError('');
    try {
      const updated = await adminUpdateExam(token, id, data);
      setExam(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingExam(false);
    }
  }

  async function handleDeleteQuestion(qid: string) {
    if (!confirm('¿Eliminar pregunta?')) return;
    await adminDeleteQuestion(token, qid);
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  }

  async function handleSaveFormTemplate(fields: FormField[]) {
    setSavingForm(true);
    setError('');
    try {
      await adminUpdateFormTemplate(token, id, { schema_json: { fields } });
      setFormFields(fields);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingForm(false);
    }
  }

  async function handleSaveQuestion(data: object & { id?: string }) {
    if (data.id) {
      const updated = await adminUpdateQuestion(token, data.id, data);
      setQuestions((prev) => prev.map((q) => (q.id === data.id ? updated : q)));
    } else {
      const created = await adminCreateQuestion(token, { ...data, exam_id: id });
      setQuestions((prev) => [...prev, created]);
    }
    setAddingQuestion(false);
    setEditingQuestion(null);
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!exam) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Exámenes
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
      </div>

      {/* Exam metadata */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Información del examen</h2>
        <ExamForm initialData={exam} onSave={handleSaveExam} saving={savingExam} />
      </section>

      {/* Form Template */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Formulario del examen</h2>
        <p className="text-sm text-gray-500 mb-4">
          Define los campos que el estudiante debe completar antes de entregar el examen.
        </p>
        <FormTemplateEditor
          initialFields={formFields}
          onSave={handleSaveFormTemplate}
          saving={savingForm}
        />
      </section>

      {/* Questions */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Preguntas ({questions.length})
          </h2>
          <button
            onClick={() => { setAddingQuestion(true); setEditingQuestion(null); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            + Agregar pregunta
          </button>
        </div>

        {questions.length === 0 && !addingQuestion && (
          <p className="text-gray-500 text-sm">No hay preguntas aún.</p>
        )}

        <div className="space-y-3">
          {questions
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((q, idx) => (
              <div key={q.id}>
                {editingQuestion?.id === q.id ? (
                  <QuestionEditor
                    examId={id}
                    initialData={q}
                    onSave={handleSaveQuestion}
                    onCancel={() => setEditingQuestion(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3 border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                    <span className="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-0.5 rounded mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium line-clamp-2">{q.prompt}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {q.type} · {q.score} pts
                        {q.options.length > 0 && ` · ${q.options.length} opciones`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingQuestion(q); setAddingQuestion(false); }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {addingQuestion && (
            <QuestionEditor
              examId={id}
              onSave={handleSaveQuestion}
              onCancel={() => setAddingQuestion(false)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
