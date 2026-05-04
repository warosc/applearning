import { Suspense } from 'react';
import { ExamenClient } from './examen-client';

// Este archivo es un Server Component. ExamenClient es un Client Component.
// No se necesita cambiar nada aquí, ya que ExamenClient es el que manejará la lógica.
// Solo se asegura que el fallback sea adecuado.

export default function ExamenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600 text-lg font-medium">
            Cargando simulador...
          </p>
        </div>
      }
    >
      <ExamenClient />
    </Suspense>
  );
}
