import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.REPORTING_SERVICE_URL ?? 'http://127.0.0.1:4008';

async function forward(req: NextRequest, path: string[]): Promise<Response> {
  const target = `${BASE}/reports/${path.join('/')}`;
  return fetch(target, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
    // @ts-expect-error -- Node 18 fetch accepts duplex
    duplex: req.method !== 'GET' && req.method !== 'DELETE' ? 'half' : undefined,
    cache: 'no-store',
    signal: req.signal,
  });
}

async function jsonOrBlob(upstream: Response): Promise<NextResponse> {
  const ct = upstream.headers.get('content-type') ?? '';
  if (ct.includes('application/pdf') || ct.includes('text/csv')) {
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: upstream.status,
      headers: {
        'Content-Type': ct,
        'Content-Disposition': upstream.headers.get('content-disposition') ?? 'attachment',
        'Cache-Control': 'no-store',
      },
    });
  }
  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return jsonOrBlob(await forward(req, path));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return jsonOrBlob(await forward(req, path));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstream = await forward(req, path);
  return new NextResponse(null, { status: upstream.status });
}
