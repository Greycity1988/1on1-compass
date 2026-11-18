import { beforeEach, describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import authHandler from '../api/auth';
import configHandler from '../api/config';
import membersHandler from '../api/members';
import { KEYS, RedisLike, __setRedisForTests } from '../api/_lib/server';

/** In-memory stand-in for the Upstash client (values are stored as structured clones, like JSON). */
class FakeRedis implements RedisLike {
  data = new Map<string, unknown>();
  hashes = new Map<string, Map<string, unknown>>();
  private clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  async get<T>(key: string) {
    return (this.data.has(key) ? this.clone(this.data.get(key)) : null) as T | null;
  }
  async set(key: string, value: unknown) {
    this.data.set(key, this.clone(value));
    return 'OK';
  }
  async del(...keys: string[]) {
    let n = 0;
    for (const k of keys) if (this.data.delete(k) || this.hashes.delete(k)) n++;
    return n;
  }
  async incr(key: string) {
    const n = Number(this.data.get(key) ?? 0) + 1;
    this.data.set(key, n);
    return n;
  }
  async expire() {
    return 1;
  }
  async hget<T>(key: string, field: string) {
    const v = this.hashes.get(key)?.get(field);
    return (v === undefined ? null : this.clone(v)) as T | null;
  }
  async hgetall<T extends Record<string, unknown>>(key: string) {
    const h = this.hashes.get(key);
    return (h && h.size ? this.clone(Object.fromEntries(h)) : null) as T | null;
  }
  async hset(key: string, kv: Record<string, unknown>) {
    const h = this.hashes.get(key) ?? new Map();
    for (const [f, v] of Object.entries(kv)) h.set(f, this.clone(v));
    this.hashes.set(key, h);
    return Object.keys(kv).length;
  }
  async hdel(key: string, ...fields: string[]) {
    let n = 0;
    for (const f of fields) if (this.hashes.get(key)?.delete(f)) n++;
    return n;
  }
}

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

async function call(
  handler: Handler,
  { method = 'GET', query = {}, body, token, ip = '1.1.1.1' }: { method?: string; query?: Record<string, string>; body?: unknown; token?: string; ip?: string } = {},
) {
  const out = { status: 200, body: undefined as any };
  const res = {
    setHeader: () => res,
    status(code: number) {
      out.status = code;
      return res;
    },
    json(payload: unknown) {
      out.body = payload;
      return res;
    },
    end() {
      return res;
    },
  };
  const req = {
    method,
    query,
    body,
    headers: { 'x-forwarded-for': ip, ...(token ? { authorization: `Bearer ${token}` } : {}) },
  };
  await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  return out;
}

const QUESTIONS = [{ id: 'q1', title: 'Q1', question: '?', placeholder: '', required: true, category: 'achievement' }];
const member = (id: string, token: string, extra: Record<string, unknown> = {}) => ({
  id,
  token,
  name: `Member ${id}`,
  department: '',
  role: '',
  status: 'pending',
  answers: {},
  ...extra,
});
const TOKEN_A = 'tk_' + 'a'.repeat(32);
const TOKEN_B = 'tk_' + 'b'.repeat(32);

let redis: FakeRedis;

async function login(pin = 'correct-horse') {
  const r = await call(authHandler, { method: 'POST', body: { action: 'login', pin } });
  expect(r.status).toBe(200);
  return r.body.token as string;
}

beforeEach(() => {
  redis = new FakeRedis();
  __setRedisForTests(redis);
  delete process.env.LEADER_PIN;
});

describe('legacy data from the old version', () => {
  beforeEach(async () => {
    await redis.set(KEYS.config, { leaderName: 'Leader', teamTitle: 'Team', pin: 'correct-horse', surveyQuestions: QUESTIONS });
    await redis.set(KEYS.membersLegacy, [
      member('m1', TOKEN_A, { answers: { q1: 'secret answer' }, status: 'submitted', interviewNotes: 'private note' }),
      member('m2', TOKEN_B),
    ]);
  });

  it('no longer exposes the password and moves it into a hash', async () => {
    const r = await call(configHandler);
    expect(r.body.storage).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain('correct-horse');
    expect((await redis.get<Record<string, unknown>>(KEYS.config))!.pin).toBeUndefined();
    expect(await login('correct-horse')).toBeTruthy();
  });

  it('migrates the old member list and keeps it private', async () => {
    expect((await call(membersHandler)).status).toBe(401);
    const token = await login();
    const r = await call(membersHandler, { token });
    expect(r.body.members.map((m: { id: string }) => m.id)).toEqual(['m1', 'm2']);
  });
});

describe('auth', () => {
  it('stays closed until a first password exists', async () => {
    expect((await call(configHandler)).body.setupRequired).toBe(true);
    expect((await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'x' } })).status).toBe(409);
  });

  it('takes the first password from LEADER_PIN and rejects wrong ones', async () => {
    process.env.LEADER_PIN = 'correct-horse';
    expect((await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'nope' } })).status).toBe(401);
    expect(await login()).toBeTruthy();
  });

  it('locks an address out after 10 failed attempts', async () => {
    process.env.LEADER_PIN = 'correct-horse';
    for (let i = 0; i < 10; i++) await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'nope' } });
    const r = await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'correct-horse' } });
    expect(r.status).toBe(429);
    expect((await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'correct-horse' }, ip: '2.2.2.2' })).status).toBe(200);
  });

  it('changing the password signs out old sessions and needs the current one', async () => {
    process.env.LEADER_PIN = 'correct-horse';
    const old = await login();
    const bad = await call(authHandler, { method: 'POST', token: old, body: { action: 'change', current: '1234', next: 'new-password' } });
    expect(bad.status).toBe(403);
    const weak = await call(authHandler, { method: 'POST', token: old, body: { action: 'change', current: 'correct-horse', next: 'short' } });
    expect(weak.status).toBe(400);
    const ok = await call(authHandler, { method: 'POST', token: old, body: { action: 'change', current: 'correct-horse', next: 'new-password' } });
    expect(ok.status).toBe(200);
    expect((await call(membersHandler, { token: old })).status).toBe(401);
    expect((await call(membersHandler, { token: ok.body.token })).status).toBe(200);
    expect((await call(authHandler, { method: 'POST', body: { action: 'login', pin: 'correct-horse' } })).status).toBe(401);
  });

  it('rejects forged session tokens', async () => {
    process.env.LEADER_PIN = 'correct-horse';
    await login();
    const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 1e9 })).toString('base64url') + '.abc';
    expect((await call(membersHandler, { token: forged })).status).toBe(401);
  });
});

describe('members', () => {
  let leader: string;
  beforeEach(async () => {
    process.env.LEADER_PIN = 'correct-horse';
    leader = await login();
    await call(membersHandler, { method: 'PUT', token: leader, body: { member: member('m1', TOKEN_A) } });
    await call(membersHandler, { method: 'PUT', token: leader, body: { member: member('m2', TOKEN_B) } });
  });

  it('a member link sees only that member, without leader notes', async () => {
    await call(membersHandler, {
      method: 'PUT',
      token: leader,
      body: { member: member('m1', TOKEN_A, { interviewNotes: 'private', evaluationGrade: 'A' }) },
    });
    const r = await call(membersHandler, { query: { token: TOKEN_A } });
    expect(r.body.member.id).toBe('m1');
    expect(r.body.member.interviewNotes).toBeUndefined();
    expect(r.body.member.evaluationGrade).toBeUndefined();
    expect((await call(membersHandler, { query: { token: 'm2' } })).status).toBe(404); // ids are not tokens
  });

  it("a submission changes only that member and survives the leader's stale save", async () => {
    const sub = await call(membersHandler, { method: 'POST', body: { token: TOKEN_A, answers: { q1: 'my answer' } } });
    expect(sub.status).toBe(200);
    // the leader's screen still has the pre-submission copy
    await call(membersHandler, { method: 'PUT', token: leader, body: { member: member('m1', TOKEN_A, { interviewNotes: 'note' }) } });
    const list = (await call(membersHandler, { token: leader })).body.members;
    const m1 = list.find((m: { id: string }) => m.id === 'm1');
    expect(m1.answers.q1).toBe('my answer');
    expect(m1.status).toBe('submitted');
    expect(m1.interviewNotes).toBe('note');
    expect(list).toHaveLength(2);
  });

  it('refuses edits once the interview started, and writes without a session', async () => {
    await call(membersHandler, { method: 'PUT', token: leader, body: { member: member('m1', TOKEN_A, { status: 'interviewing' }) } });
    expect((await call(membersHandler, { method: 'POST', body: { token: TOKEN_A, answers: { q1: 'x' } } })).status).toBe(409);
    expect((await call(membersHandler, { method: 'PUT', body: { member: member('m3', 'tk_' + 'c'.repeat(32)) } })).status).toBe(401);
    expect((await call(membersHandler, { method: 'DELETE', query: { id: 'm1' } })).status).toBe(401);
    expect((await call(configHandler, { method: 'PUT', body: { config: { surveyQuestions: QUESTIONS } } })).status).toBe(401);
  });

  it('deletes one member', async () => {
    expect((await call(membersHandler, { method: 'DELETE', token: leader, query: { id: 'm2' } })).status).toBe(200);
    const list = (await call(membersHandler, { token: leader })).body.members;
    expect(list.map((m: { id: string }) => m.id)).toEqual(['m1']);
  });

  it('rejects malformed input', async () => {
    const bad = await call(membersHandler, { method: 'POST', body: { token: TOKEN_A, answers: { q1: 123 } } });
    expect(bad.status).toBe(400);
    const badDisc = await call(membersHandler, { method: 'POST', body: { token: TOKEN_A, answers: {}, discResult: { primary: 'X' } } });
    expect(badDisc.status).toBe(400);
  });
});

describe('config', () => {
  it('the leader can save team settings; the password field is never stored', async () => {
    process.env.LEADER_PIN = 'correct-horse';
    const token = await login();
    const r = await call(configHandler, {
      method: 'PUT',
      token,
      body: { config: { leaderName: 'L', teamTitle: 'T', pin: 'leak', surveyQuestions: QUESTIONS } },
    });
    expect(r.status).toBe(200);
    expect((await redis.get<Record<string, unknown>>(KEYS.config))!.pin).toBeUndefined();
    expect((await call(configHandler)).body.config.leaderName).toBe('L');
  });
});
