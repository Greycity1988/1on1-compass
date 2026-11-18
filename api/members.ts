import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { TeamMember } from '../src/types/index.js';
import {
  KEYS,
  cycleForMember,
  fail,
  findMemberByToken,
  getRedis,
  isLeader,
  loadMembers,
  noStore,
  publicMember,
  readBody,
  sanitizeAnswers,
  sanitizeDisc,
  sanitizeMember,
  saveMember,
} from './_lib/server.js';

/**
 * GET    ?token=...                      -> { member, cycle }  the member's own survey and its round (public, by link)
 * POST   { token, answers, discResult }  -> { member }   the member submits answers (public, by link)
 * GET                                    -> { members }  leader only
 * PUT    { member }                      -> { member }   leader adds or edits one member
 * DELETE ?id=...                         -> { ok }       leader removes one member
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  const redis = getRedis();
  if (!redis) return fail(res, 503, 'storage_not_configured');

  try {
    if (req.method === 'GET') {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (token) {
        const member = await findMemberByToken(redis, token);
        if (!member) return fail(res, 404, 'not_found');
        return res.status(200).json({ member: publicMember(member), cycle: await cycleForMember(redis, member) });
      }
      if (!(await isLeader(req, redis))) return fail(res, 401, 'unauthorized');
      return res.status(200).json({ members: await loadMembers(redis) });
    }

    if (req.method === 'POST') {
      const body = readBody(req);
      const member = typeof body.token === 'string' ? await findMemberByToken(redis, body.token) : null;
      if (!member) return fail(res, 404, 'not_found');
      if (member.status === 'interviewing' || member.status === 'completed') return fail(res, 409, 'locked');
      if ((await cycleForMember(redis, member))?.closed) return fail(res, 409, 'locked');
      const answers = sanitizeAnswers(body.answers);
      const discResult = sanitizeDisc(body.discResult);
      if (answers === null || discResult === null) return fail(res, 400, 'invalid_answers');
      const updated: TeamMember = {
        ...member,
        answers,
        discResult: discResult ?? member.discResult,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      await saveMember(redis, updated);
      return res.status(200).json({ member: publicMember(updated) });
    }

    if (req.method === 'PUT') {
      if (!(await isLeader(req, redis))) return fail(res, 401, 'unauthorized');
      const incoming = sanitizeMember(readBody(req).member);
      if (!incoming) return fail(res, 400, 'invalid_member');
      const existing = await redis.hget<TeamMember>(KEYS.members, incoming.id);
      let saved: TeamMember;
      if (existing) {
        // The leader's screen may be older than a member's latest submission: keep what the
        // member owns (answers, DISC result, submission time) and never move a submitted
        // member back to "pending".
        saved = {
          ...incoming,
          token: existing.token,
          answers: existing.answers ?? {},
          discResult: existing.discResult ?? incoming.discResult,
          submittedAt: existing.submittedAt,
          status: incoming.status === 'pending' && existing.status !== 'pending' ? existing.status : incoming.status,
          createdAt: existing.createdAt ?? incoming.createdAt,
          // A record stays in its round and keeps its person link.
          cycleId: existing.cycleId ?? incoming.cycleId,
          personId: existing.personId ?? incoming.personId,
        };
      } else {
        saved = { ...incoming, answers: {}, submittedAt: undefined, status: 'pending', createdAt: Date.now() };
      }
      await saveMember(redis, saved);
      return res.status(200).json({ member: saved });
    }

    if (req.method === 'DELETE') {
      if (!(await isLeader(req, redis))) return fail(res, 401, 'unauthorized');
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      if (!id) return fail(res, 400, 'missing_id');
      await loadMembers(redis); // make sure the old list is migrated before deleting from the new one
      await redis.hdel(KEYS.members, id);
      return res.status(200).json({ ok: true });
    }

    return fail(res, 405, 'method_not_allowed');
  } catch (err) {
    console.error('members handler failed', err);
    return fail(res, 500, 'server_error');
  }
}
