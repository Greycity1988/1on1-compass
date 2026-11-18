import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DiscSubmissionResult, SurveyQuestion, TeamMember } from '../../src/types/index.js';

/** The subset of the Upstash client the API uses (lets tests swap in an in-memory store). */
export interface RedisLike {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  hget<T = unknown>(key: string, field: string): Promise<T | null>;
  hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null>;
  hset(key: string, kv: Record<string, unknown>): Promise<number>;
  hdel(key: string, ...fields: string[]): Promise<number>;
}

export const KEYS = {
  /** Old format: the whole member list as one array, overwritten by any client. Read once for migration. */
  membersLegacy: '1on1_compass_members_v2',
  /** Hash of member id -> member, so each save touches one member only. */
  members: '1on1_compass_members_v3',
  membersMigrated: '1on1_compass_members_v3_migrated',
  /** Public team settings (leader name, team title, questions). Never holds the password. */
  config: '1on1_compass_leader_config_v2',
  /** Password hash and session signing secret. Never sent to the browser. */
  auth: '1on1_compass_auth_v1',
  rateLimit: '1on1_compass_login_fail',
};

let redisOverride: RedisLike | null | undefined;
export const __setRedisForTests = (r: RedisLike | null | undefined) => {
  redisOverride = r;
};

/** DEMO_MODE=true keeps a public demo storage-free even if a database gets connected by mistake. */
export const isDemoMode = () => ['true', '1', 'yes', 'on'].includes((process.env.DEMO_MODE ?? '').trim().toLowerCase());

export function getRedis(): RedisLike | null {
  if (redisOverride !== undefined) return redisOverride;
  if (isDemoMode()) return null;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? (new Redis({ url, token }) as unknown as RedisLike) : null;
}

// ---------------------------------------------------------------- request helpers

export function readBody(req: VercelRequest): Record<string, unknown> {
  const b = req.body;
  if (b && typeof b === 'object') return b as Record<string, unknown>;
  if (typeof b === 'string') {
    try {
      const parsed = JSON.parse(b);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function fail(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ error });
}

export function noStore(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
}

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  const real = req.headers['x-real-ip'];
  return first || (Array.isArray(real) ? real[0] : real) || 'unknown';
}

// ---------------------------------------------------------------- password + sessions

export interface AuthRecord {
  pinHash: string;
  salt: string;
  /** HMAC key for session tokens. Rotated on every password change, which signs everyone out. */
  secret: string;
}

export const MIN_PIN_LENGTH = 8;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const hashPin = (pin: string, salt: string) => scryptSync(pin, salt, 32).toString('hex');

export function makeAuth(pin: string): AuthRecord {
  const salt = randomBytes(16).toString('hex');
  return { pinHash: hashPin(pin, salt), salt, secret: randomBytes(32).toString('hex') };
}

export function verifyPin(auth: AuthRecord, pin: string): boolean {
  const a = Buffer.from(hashPin(pin, auth.salt), 'hex');
  const b = Buffer.from(auth.pinHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');
const sign = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('base64url');

export function issueSession(auth: AuthRecord) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const body = b64url(JSON.stringify({ exp: expiresAt }));
  return { token: `${body}.${sign(auth.secret, body)}`, expiresAt };
}

export function verifySessionToken(auth: AuthRecord, token: string): boolean {
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = Buffer.from(sign(auth.secret, body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Returns the password record, creating it on first use. Older versions kept the password in
 * plain text inside the public settings; that value is moved into a hash here and removed, so it
 * stops being readable even before anyone signs in. A new install takes its first password from
 * the LEADER_PIN environment variable; with neither, sign-in stays closed (setup required).
 */
export async function loadAuth(redis: RedisLike): Promise<AuthRecord | null> {
  const [existing, config] = await Promise.all([
    redis.get<AuthRecord>(KEYS.auth),
    redis.get<Record<string, unknown>>(KEYS.config),
  ]);

  let legacyPin: string | null = null;
  if (config && typeof config === 'object' && ('pin' in config || 'apiKey' in config)) {
    if (typeof config.pin === 'string' && config.pin) legacyPin = config.pin;
    const { pin: _pin, apiKey: _apiKey, ...rest } = config;
    await redis.set(KEYS.config, rest);
  }

  if (existing && existing.pinHash && existing.salt && existing.secret) return existing;

  const initial = legacyPin ?? process.env.LEADER_PIN ?? null;
  if (!initial) return null;
  const record = makeAuth(initial);
  await redis.set(KEYS.auth, record);
  return record;
}

export async function isLeader(req: VercelRequest, redis: RedisLike): Promise<boolean> {
  const header = req.headers.authorization;
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const auth = await redis.get<AuthRecord>(KEYS.auth);
  return Boolean(auth && verifySessionToken(auth, token));
}

// Failed sign-ins: 10 per address and 100 overall per 15 minutes.
const RL_WINDOW_S = 15 * 60;
const RL_PER_IP = 10;
const RL_GLOBAL = 100;

export async function isLockedOut(redis: RedisLike, req: VercelRequest): Promise<boolean> {
  const [ip, all] = await Promise.all([
    redis.get<number>(`${KEYS.rateLimit}:ip:${clientIp(req)}`),
    redis.get<number>(`${KEYS.rateLimit}:all`),
  ]);
  return Number(ip ?? 0) >= RL_PER_IP || Number(all ?? 0) >= RL_GLOBAL;
}

export async function recordFailedLogin(redis: RedisLike, req: VercelRequest) {
  for (const key of [`${KEYS.rateLimit}:ip:${clientIp(req)}`, `${KEYS.rateLimit}:all`]) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, RL_WINDOW_S);
  }
}

export async function clearFailedLogins(redis: RedisLike, req: VercelRequest) {
  await redis.del(`${KEYS.rateLimit}:ip:${clientIp(req)}`);
}

// ---------------------------------------------------------------- validation

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const TOKEN_RE = /^tk_[0-9a-f]{16,64}$/;
const DISC = ['D', 'I', 'S', 'C'] as const;
const STATUSES = ['pending', 'submitted', 'interviewing', 'completed'] as const;
const GRADES = ['S', 'A', 'B', 'C', 'D', ''] as const;
const CATEGORIES = ['achievement', 'bottleneck', 'collaboration', 'growth', 'expectation', 'custom'] as const;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback;

export interface PublicConfig {
  leaderName: string;
  teamTitle: string;
  surveyQuestions: SurveyQuestion[];
}

export function sanitizeQuestions(v: unknown): SurveyQuestion[] | null {
  if (!Array.isArray(v) || v.length < 1 || v.length > 30) return null;
  const seen = new Set<string>();
  const out: SurveyQuestion[] = [];
  for (const q of v) {
    if (!q || typeof q !== 'object') return null;
    const id = (q as SurveyQuestion).id;
    if (typeof id !== 'string' || !ID_RE.test(id) || seen.has(id)) return null;
    seen.add(id);
    out.push({
      id,
      title: text((q as SurveyQuestion).title, 200),
      question: text((q as SurveyQuestion).question, 2000),
      placeholder: text((q as SurveyQuestion).placeholder, 1000),
      required: (q as SurveyQuestion).required === true,
      category: oneOf((q as SurveyQuestion).category, CATEGORIES, 'custom'),
    });
  }
  return out;
}

export function sanitizeConfig(v: unknown): PublicConfig | null {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  const surveyQuestions = sanitizeQuestions(c.surveyQuestions);
  if (!surveyQuestions) return null;
  return { leaderName: text(c.leaderName, 60), teamTitle: text(c.teamTitle, 120), surveyQuestions };
}

export function sanitizeAnswers(v: unknown): Record<string, string> | null {
  if (v === undefined) return {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length > 40) return null;
  const out: Record<string, string> = {};
  for (const [k, val] of entries) {
    if (!ID_RE.test(k) || typeof val !== 'string') return null;
    out[k] = val.slice(0, 5000);
  }
  return out;
}

/** undefined = not given, null = invalid. */
export function sanitizeDisc(v: unknown): DiscSubmissionResult | undefined | null {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'object') return null;
  const d = v as Record<string, unknown>;
  if (!DISC.includes(d.primary as (typeof DISC)[number])) return null;
  if (typeof d.code !== 'string' || !/^[DISC](\/[DISC])?$/.test(d.code)) return null;
  const out: DiscSubmissionResult = {
    primary: d.primary as DiscSubmissionResult['primary'],
    code: d.code,
    patternName: text(d.patternName, 40),
    source: d.source === 'test' ? 'test' : 'manual',
  };
  if (d.scores && typeof d.scores === 'object') {
    const s = d.scores as Record<string, unknown>;
    if (DISC.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k]))) {
      out.scores = { D: s.D as number, I: s.I as number, S: s.S as number, C: s.C as number };
    }
  }
  return out;
}

export function sanitizeMember(v: unknown): TeamMember | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (typeof m.id !== 'string' || !ID_RE.test(m.id)) return null;
  if (typeof m.token !== 'string' || !TOKEN_RE.test(m.token)) return null;
  const name = text(m.name, 60).trim();
  if (!name) return null;
  const answers = sanitizeAnswers(m.answers);
  const discResult = sanitizeDisc(m.discResult);
  if (answers === null || discResult === null) return null;
  const actionItems = Array.isArray(m.actionItems)
    ? m.actionItems.slice(0, 50).flatMap((a) =>
        a && typeof a === 'object' && typeof (a as { id?: unknown }).id === 'string'
          ? [{ id: text((a as { id: string }).id, 64), text: text((a as { text?: unknown }).text, 500), done: (a as { done?: unknown }).done === true }]
          : [],
      )
    : [];
  return {
    id: m.id,
    token: m.token,
    name,
    department: text(m.department, 60),
    role: text(m.role, 60),
    status: oneOf(m.status, STATUSES, 'pending'),
    answers,
    ...(discResult ? { discResult } : {}),
    submittedAt: text(m.submittedAt, 40) || undefined,
    interviewNotes: text(m.interviewNotes, 20000),
    actionItems,
    evaluationGrade: oneOf(m.evaluationGrade, GRADES, ''),
    evaluationComment: text(m.evaluationComment, 5000),
    interviewDate: text(m.interviewDate, 40) || undefined,
    createdAt: typeof m.createdAt === 'number' ? m.createdAt : undefined,
  };
}

/** What a member's own link may see: never the leader's notes, grade or comments. */
export function publicMember(m: TeamMember) {
  const { id, token, name, department, role, status, answers, discResult, submittedAt } = m;
  return { id, token, name, department, role, status, answers, discResult, submittedAt };
}

// ---------------------------------------------------------------- member storage

export async function loadMembers(redis: RedisLike): Promise<TeamMember[]> {
  let map = await redis.hgetall<Record<string, TeamMember>>(KEYS.members);
  if ((!map || Object.keys(map).length === 0) && !(await redis.get(KEYS.membersMigrated))) {
    const legacy = await redis.get<unknown>(KEYS.membersLegacy);
    const entries: Record<string, TeamMember> = {};
    if (Array.isArray(legacy)) {
      const now = Date.now();
      legacy.forEach((raw, i) => {
        const m = sanitizeMember(raw);
        if (m && !entries[m.id]) entries[m.id] = { ...m, createdAt: m.createdAt ?? now - i };
      });
    }
    if (Object.keys(entries).length) await redis.hset(KEYS.members, entries);
    await redis.set(KEYS.membersMigrated, 1);
    map = entries;
  }
  return Object.values(map ?? {}).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function findMemberByToken(redis: RedisLike, token: string): Promise<TeamMember | null> {
  if (!TOKEN_RE.test(token)) return null;
  return (await loadMembers(redis)).find((m) => m.token === token) ?? null;
}

export async function saveMember(redis: RedisLike, m: TeamMember) {
  await redis.hset(KEYS.members, { [m.id]: m });
}
