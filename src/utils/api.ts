import { DiscSubmissionResult, LeaderConfig, TeamMember } from '../types';
import type { UiStrings } from '../i18n/ui';

/** Team settings the server shares with everyone (never the password). */
export type PublicConfig = Pick<LeaderConfig, 'leaderName' | 'teamTitle' | 'surveyQuestions'>;

export type Backend =
  | { mode: 'cloud'; setupRequired: boolean; config: PublicConfig | null }
  | { mode: 'local' };

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

const SESSION_KEY = '1on1_compass_session';

export const leaderSession = {
  get: () => sessionStorage.getItem(SESSION_KEY),
  set: (token: string) => sessionStorage.setItem(SESSION_KEY, token),
  clear: () => sessionStorage.removeItem(SESSION_KEY),
};

async function call<T>(path: string, init: RequestInit = {}, asLeader = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = leaderSession.get();
  if (asLeader && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? `http_${res.status}`);
  }
  return data as T;
}

/**
 * Server mode needs the /api functions and a connected Redis store. Without them (plain
 * `npm run dev`, or a deploy with no storage) the app runs as a local demo in this browser.
 */
export async function detectBackend(): Promise<Backend> {
  try {
    const res = await fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return { mode: 'local' };
    const data = await res.json();
    if (data?.storage === true) {
      return { mode: 'cloud', setupRequired: Boolean(data.setupRequired), config: data.config ?? null };
    }
  } catch {
    // offline or no API
  }
  return { mode: 'local' };
}

const json = (body: unknown) => JSON.stringify(body);

export const cloud = {
  async login(pin: string) {
    const { token } = await call<{ token: string }>('/api/auth', { method: 'POST', body: json({ action: 'login', pin }) });
    leaderSession.set(token);
  },
  async changePin(current: string, next: string) {
    const { token } = await call<{ token: string }>(
      '/api/auth',
      { method: 'POST', body: json({ action: 'change', current, next }) },
      true,
    );
    leaderSession.set(token);
  },
  listMembers: () => call<{ members: TeamMember[] }>('/api/members', {}, true).then((d) => d.members),
  getMemberByToken: (token: string) =>
    call<{ member: TeamMember }>(`/api/members?token=${encodeURIComponent(token)}`).then((d) => d.member),
  submitAnswers: (token: string, answers: Record<string, string>, discResult?: DiscSubmissionResult) =>
    call<{ member: TeamMember }>('/api/members', { method: 'POST', body: json({ token, answers, discResult }) }).then(
      (d) => d.member,
    ),
  upsertMember: (member: TeamMember) =>
    call<{ member: TeamMember }>('/api/members', { method: 'PUT', body: json({ member }) }, true).then((d) => d.member),
  deleteMember: (id: string) =>
    call<{ ok: true }>(`/api/members?id=${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
  saveConfig: (config: PublicConfig) =>
    call<{ config: PublicConfig }>('/api/config', { method: 'PUT', body: json({ config }) }, true).then((d) => d.config),
};

/** User-facing message for an API failure, in the current language. */
export function describeError(err: unknown, t: UiStrings): string {
  const code = err instanceof ApiError ? err.code : '';
  switch (code) {
    case 'wrong_pin':
      return t.errors.wrongPin;
    case 'too_many_attempts':
      return t.errors.tooMany;
    case 'weak_pin':
      return t.errors.weakPin(8);
    case 'setup_required':
      return t.errors.setupRequired;
    case 'unauthorized':
      return t.errors.expired;
    case 'locked':
      return t.errors.locked;
    case 'not_found':
      return t.errors.notFound;
    default:
      return t.errors.network;
  }
}
