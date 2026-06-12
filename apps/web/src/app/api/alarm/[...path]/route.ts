import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.ALARM_SERVICE_URL ?? 'http://127.0.0.1:4007';

async function forward(req: NextRequest, path: string[]): Promise<Response> {
  const target = `${BASE}/alarms/${path.join('/')}`;
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = await forward(req, path);
  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = await forward(req, path);
  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = await forward(req, path);
  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const upstream = await forward(req, path);
  return new NextResponse(null, { status: upstream.status });
}
