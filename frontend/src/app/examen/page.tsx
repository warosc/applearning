import { Suspense } from 'react';
import { ExamenClient } from './examen-client';

export default function ExamenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando examen...</p>
        </div>
      }
    >
      <ExamenClient />
    </Suspense>
  );
}
