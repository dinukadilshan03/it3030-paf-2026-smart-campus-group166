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

    // Fetch current resource categories and locations so AI has up-to-date choices
    const categoriesUrl = `${backendBase.replace(/\/$/, '')}/api/v1/resource-categories`;
    const locationsUrl = `${backendBase.replace(/\/$/, '')}/api/v1/locations`;

    let categories: any[] = [];
    let locations: any[] = [];

    try {
      const [cRes, lRes] = await Promise.all([
        fetch(categoriesUrl, { headers: forwardHeaders }),
        fetch(locationsUrl, { headers: forwardHeaders }),
      ]);

      if (cRes && cRes.ok) categories = await cRes.json();
      if (lRes && lRes.ok) locations = await lRes.json();
    } catch (err) {
      // If fetching fails, continue without blocking AI request — log for debugging
      console.warn('Failed to fetch categories/locations for AI prompt', err);
    }

    const forwardedBody: any = { ...body };
    if (!('availableResourceCategories' in forwardedBody)) forwardedBody.availableResourceCategories = categories;
    if (!('availableLocations' in forwardedBody)) forwardedBody.availableLocations = locations;

    const resp = await fetch(target, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(forwardedBody),
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