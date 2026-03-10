'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminCreateExam } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { ExamForm } from '@/components/admin/exam-form';

export default function NewExamPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token)!;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(data: object) {
    setSaving(true);
    setError('');
    try {
      const exam = await adminCreateExam(token, data);
      router.push(`/admin/exams/${exam.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nuevo examen</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <ExamForm onSave={handleSave} saving={saving} />
    </div>
  );
}
