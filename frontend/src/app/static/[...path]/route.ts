import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

type RouteContext = {
  params: {
    path: string[];
  };
};

async function proxy(request: NextRequest, context: RouteContext) {
  const path = context.params.path.join('/');
  const targetUrl = new URL(`/static/${path}`, BACKEND_URL);

  const response = await fetch(targetUrl, { method: 'GET' });

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) responseHeaders.set('content-type', contentType);
  const cacheControl = response.headers.get('cache-control');
  if (cacheControl) responseHeaders.set('cache-control', cacheControl);

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
