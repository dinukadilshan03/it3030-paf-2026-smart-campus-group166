import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendBase =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL;

    // 🔥 SAFETY CHECK
    if (!backendBase) {
      throw new Error("Backend API URL not configured");
    }

    
    const target = `${backendBase.replace(/\/$/, '')}/api/ai/recommendations`;

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const auth = req.headers.get('authorization');
    if (auth) forwardHeaders['authorization'] = auth;

    const cookie = req.headers.get('cookie');
    if (cookie) forwardHeaders['cookie'] = cookie;

    const resp = await fetch(target, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    const contentType =
      resp.headers.get('content-type') || 'application/json';

    return new Response(text, {
      status: resp.status,
      headers: { 'content-type': contentType },
    });

  } catch (err: any) {
    console.error('AI proxy error', err);

    return new Response(
      JSON.stringify({ message: err.message || 'Unknown error' }),
      { status: 502, headers: { 'content-type': 'application/json' } }
    );
  }
}