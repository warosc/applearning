'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

export default function ImportQuestionsPage() {
  const token = useAuthStore(s => s.token)!;
  const [mode, setMode] = useState<'json' | 'csv'>('json');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

  const JSON_EXAMPLE = JSON.stringify([
    {
      type: "single_choice",
      prompt: "¿Cuánto es 2 + 2?",
      materia: "Matemáticas",
      tema: "Aritmética",
      difficulty: "facil",
      score: 1,
      options: [
        { label: "A", value: "3", is_correct: false },
        { label: "B", value: "4", is_correct: true },
        { label: "C", value: "5", is_correct: false },
        { label: "D", value: "6", is_correct: false }
      ]
    }
  ], null, 2);

  const CSV_EXAMPLE = `type,prompt,materia,tema,difficulty,score,option_a,option_b,option_c,option_d,correct_option
single_choice,¿Cuánto es 2 + 2?,Matemáticas,Aritmética,facil,1,3,4,5,6,B
numeric,¿Cuánto es la raíz cuadrada de 16?,Matemáticas,Álgebra,medio,2,,,,4,D`;

  async function handleImport() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let body: string;
      let contentType: string;
      if (mode === 'json') {
        body = content;
        contentType = 'application/json';
      } else {
        body = JSON.stringify({ csv: content });
        contentType = 'application/json';
      }
      const res = await fetch(`${API_URL}/api/questions/import`, {
        method: 'POST',
        headers: { 'Content-Type': contentType, Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/questions" className="text-gray-500 hover:text-gray-700 text-sm">← Banco</Link>
        <h1 className="text-xl font-bold text-gray-900">Importar preguntas</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex gap-2">
          {(['json', 'csv'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setContent(''); }}
              className={`px-4 py-2 text-sm rounded-lg font-medium ${mode === m ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenido ({mode === 'json' ? 'array JSON' : 'CSV con encabezados'})
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder={mode === 'json' ? JSON_EXAMPLE : CSV_EXAMPLE}
            className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <details className="text-sm text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Ver formato de ejemplo</summary>
          <pre className="mt-2 bg-gray-50 rounded p-3 text-xs overflow-auto">
            {mode === 'json' ? JSON_EXAMPLE : CSV_EXAMPLE}
          </pre>
        </details>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {result && (
          <div className={`rounded-lg p-4 ${result.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className="font-medium text-sm">✓ {result.imported} pregunta{result.imported !== 1 ? 's' : ''} importada{result.imported !== 1 ? 's' : ''}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-amber-700 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}

        <button onClick={handleImport} disabled={loading || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm">
          {loading ? 'Importando...' : 'Importar preguntas'}
        </button>
      </div>
    </div>
  );
}
