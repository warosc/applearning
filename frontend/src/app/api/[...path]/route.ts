import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

type RouteContext = {
  params: {
    path: string[];
  };
};

async function proxy(request: NextRequest, context: RouteContext) {
  const incomingUrl = new URL(request.url);
  const path = context.params.path.join('/');
  const trailingSlash = incomingUrl.pathname.endsWith('/') ? '/' : '';
  const targetUrl = new URL(`/api/${path}${trailingSlash}`, BACKEND_URL);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('expect');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.arrayBuffer(),
    redirect: 'manual',
  });

  const responseHeaders = new Headers(response.headers);
  const location = responseHeaders.get('location');
  if (location) {
    const rewritten = location.replace(BACKEND_URL, '');
    responseHeaders.set('location', rewritten.startsWith('/api') ? rewritten : location);
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
