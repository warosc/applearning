'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

interface Section { id: string; title: string; question_count: number; }
interface SectionConfig { section_id: string; materia: string; difficulty: string; count: number; }

const MATERIAS = ['Matemáticas', 'Español', 'Ciencias', 'Historia', 'Inglés', 'Geografía'];
const DIFFICULTIES = ['facil', 'medio', 'dificil', 'all'];

export default function GenerateExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore(s => s.token)!;
  const [sections, setSections] = useState<Section[]>([]);
  const [configs, setConfigs] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    fetch(`${API_URL}/api/exams/${id}/sections`)
      .then(r => r.json())
      .then((data: Section[]) => {
        setSections(data);
        setConfigs(data.map(s => ({ section_id: s.id, materia: 'Matemáticas', difficulty: 'all', count: s.question_count || 10 })));
      })
      .finally(() => setLoading(false));
  }, [id, API_URL]);

  function updateConfig(idx: number, patch: Partial<SectionConfig>) {
    setConfigs(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/questions/generate-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exam_id: id, sections: configs }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setResult(`Se asignaron ${data.assigned ?? 0} preguntas al examen.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <p className="text-gray-500">Cargando secciones...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/exams/${id}`} className="text-gray-500 hover:text-gray-700 text-sm">← Examen</Link>
        <h1 className="text-xl font-bold text-gray-900">Generar examen desde banco</h1>
      </div>

      {sections.length === 0 && (
        <p className="text-gray-500 text-sm">Este examen no tiene secciones. Agrega secciones primero.</p>
      )}

      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <div key={sec.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">{sec.title}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Materia</label>
                <select value={configs[idx]?.materia ?? ''} onChange={e => updateConfig(idx, { materia: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Dificultad</label>
                <select value={configs[idx]?.difficulty ?? 'all'} onChange={e => updateConfig(idx, { difficulty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d === 'all' ? 'Cualquiera' : d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Cantidad</label>
                <input type="number" min="1" max="50" value={configs[idx]?.count ?? 10}
                  onChange={e => updateConfig(idx, { count: parseInt(e.target.value) || 10 })}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{result}</p>}

      {sections.length > 0 && (
        <button onClick={handleGenerate} disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm">
          {generating ? 'Generando...' : 'Generar examen'}
        </button>
      )}
    </div>
  );
}
