import { Suspense } from 'react';
import { HomeClient } from './home-client';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </main>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
