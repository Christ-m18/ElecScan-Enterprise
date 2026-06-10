// Standalone IAM serverless handler for Vercel — no NestJS, no workspace deps.
import { randomUUID, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { SignJWT } from 'jose';

// ─── Config ───────────────────────────────────────────────────────────
const ACCESS_SECRET  = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET  || 'dev-only-access-secret-please-rotate-me!');
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-please-rotate-me!');

// ─── In-memory user store ─────────────────────────────────────────────
const users = new Map();

// ─── Seed users on cold start ─────────────────────────────────────────
const DEMO_TENANT = '11111111-1111-4111-8111-111111111111';
const SEED_USERS = [
  { email: 'demo@elecscan.local', password: 'demo-password-12345' },
  { email: 'christopherjesusrosario@gmail.com', password: 'MI550PQA' },
];

let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  for (const u of SEED_USERS) {
    const k = u.email.toLowerCase();
    if (!users.has(k)) {
      const hash = await argon2.hash(u.password, { type: argon2.argon2id });
      users.set(k, {
        id: randomUUID(),
        tenantId: DEMO_TENANT,
        email: k,
        passwordHash: hash,
        status: 'active',
        mfaEnrolled: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  seeded = true;
}

// ─── Token helpers ────────────────────────────────────────────────────
async function issueTokens(user) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = await new SignJWT({ tid: user.tenantId, eml: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime(now + 15 * 60)
    .setIssuer('elecscan-iam')
    .setAudience('elecscan-api')
    .sign(ACCESS_SECRET);
  const refreshToken = await new SignJWT({ tid: user.tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setExpirationTime(now + 30 * 24 * 3600)
    .setIssuer('elecscan-iam')
    .setAudience('elecscan-refresh')
    .sign(REFRESH_SECRET);
  return { accessToken, refreshToken };
}

// ─── JSON helpers ─────────────────────────────────────────────────────
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { return null; }
}

// ─── Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }

  await ensureSeeded();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // Health
  if (path === '/iam/health' && req.method === 'GET') {
    return json(res, 200, { status: 'ok', service: 'iam-service' });
  }
  if (path === '/iam/ready' && req.method === 'GET') {
    return json(res, 200, { status: 'ready', service: 'iam-service' });
  }

  // Signup
  if (path === '/iam/auth/signup' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body?.email || !body?.password || !body?.tenantId) {
      return json(res, 400, { error: 'tenantId, email, and password required' });
    }
    if (body.password.length < 12) {
      return json(res, 400, { error: 'password must be at least 12 characters' });
    }
    const k = body.email.toLowerCase();
    if (users.has(k)) {
      return json(res, 409, { error: 'email already registered' });
    }
    const hash = await argon2.hash(body.password, { type: argon2.argon2id });
    const user = {
      id: randomUUID(),
      tenantId: body.tenantId,
      email: k,
      passwordHash: hash,
      status: 'active',
      mfaEnrolled: false,
      createdAt: new Date().toISOString(),
    };
    users.set(k, user);
    return json(res, 201, { userId: user.id });
  }

  // Login
  if (path === '/iam/auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body?.email || !body?.password) {
      return json(res, 400, { error: 'email and password required' });
    }
    const user = users.get(body.email.toLowerCase());
    if (!user) return json(res, 401, { error: 'invalid credentials' });
    const ok = await argon2.verify(user.passwordHash, body.password);
    if (!ok) return json(res, 401, { error: 'invalid credentials' });
    if (user.status !== 'active') return json(res, 401, { error: 'user not active' });
    const tokens = await issueTokens(user);
    return json(res, 200, tokens);
  }

  // Root / catch-all
  if (path === '/' || path === '/iam') {
    return json(res, 200, { service: 'elecscan-iam', status: 'running' });
  }

  return json(res, 404, { error: 'not found' });
}
