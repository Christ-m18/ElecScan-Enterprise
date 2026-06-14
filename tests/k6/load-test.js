/**
 * ElecScan Enterprise — k6 Load Test
 * Target: 200 simulated MI-550 devices, p99 < 200 ms
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginLatency = new Trend('login_latency', true);
const snapshotLatency = new Trend('snapshot_latency', true);
const historianLatency = new Trend('historian_latency', true);
const alarmLatency = new Trend('alarm_latency', true);
const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const DEVICE_COUNT = parseInt(__ENV.DEVICES || '200', 10);
const TEST_DURATION = __ENV.DURATION || '5m';

export const options = {
  scenarios: {
    device_polling: {
      executor: 'constant-vus',
      vus: DEVICE_COUNT,
      duration: TEST_DURATION,
      exec: 'devicePolling',
    },
    dashboard_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      exec: 'dashboardUser',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<150', 'p(99)<200'],
    snapshot_latency: ['p(99)<200'],
    historian_latency: ['p(99)<200'],
    alarm_latency: ['p(99)<200'],
    errors: ['rate<0.01'],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/iam/auth/login`,
    JSON.stringify({ email: 'admin@elecscan.io', password: 'Admin1234!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, { 'login succeeded': (r) => r.status === 200 });
  const body = JSON.parse(loginRes.body);
  return { token: body.accessToken || body.access_token };
}

function authHeaders(data) {
  return {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };
}

function randomDeviceId(vuId) {
  const hex = vuId.toString(16).padStart(12, '0');
  return `d0000000-0000-4000-8000-${hex}`;
}

export function devicePolling(data) {
  const deviceId = randomDeviceId(__VU);
  group('device_snapshot', () => {
    const snapshot = {
      deviceId,
      timestamp: new Date().toISOString(),
      values: {
        voltage_a: 220 + Math.random() * 10,
        voltage_b: 220 + Math.random() * 10,
        voltage_c: 220 + Math.random() * 10,
        current_a: 5 + Math.random() * 2,
        current_b: 5 + Math.random() * 2,
        current_c: 5 + Math.random() * 2,
        power_factor: 0.85 + Math.random() * 0.15,
        frequency: 59.9 + Math.random() * 0.2,
        thd_v: Math.random() * 5,
      },
    };
    const res = http.post(
      `${BASE_URL}/ingest/snapshots`,
      JSON.stringify(snapshot),
      authHeaders(data),
    );
    snapshotLatency.add(res.timings.duration);
    errorRate.add(res.status >= 400);
    check(res, { 'snapshot accepted': (r) => r.status === 200 || r.status === 201 || r.status === 202 });
  });
  sleep(5);
}

export function dashboardUser(data) {
  group('login', () => {
    const res = http.post(
      `${BASE_URL}/iam/auth/login`,
      JSON.stringify({ email: 'admin@elecscan.io', password: 'Admin1234!' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginLatency.add(res.timings.duration);
    errorRate.add(res.status >= 400);
    check(res, { 'login ok': (r) => r.status === 200 });
  });
  group('historian_query', () => {
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;
    const res = http.get(`${BASE_URL}/historian/query?from=${oneHourAgo}&to=${now}&bucket=1m&aliases=voltage_a,voltage_b,voltage_c`, authHeaders(data));
    historianLatency.add(res.timings.duration);
    errorRate.add(res.status >= 400);
    check(res, { 'historian ok': (r) => r.status === 200 });
  });
  group('active_alarms', () => {
    const res = http.get(`${BASE_URL}/alarms/active`, authHeaders(data));
    alarmLatency.add(res.timings.duration);
    errorRate.add(res.status >= 400);
    check(res, { 'alarms ok': (r) => r.status === 200 });
  });
  group('device_list', () => {
    const res = http.get(`${BASE_URL}/devices`, authHeaders(data));
    errorRate.add(res.status >= 400);
    check(res, { 'devices ok': (r) => r.status === 200 });
  });
  group('events_active', () => {
    const res = http.get(`${BASE_URL}/events/active`, authHeaders(data));
    errorRate.add(res.status >= 400);
    check(res, { 'events ok': (r) => r.status === 200 });
  });
  sleep(Math.random() * 5 + 2);
    }
