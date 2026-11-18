import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KEYS, fail, getRedis, isDemoMode, isLeader, loadAuth, noStore, readBody, sanitizeConfig } from './_lib/server.js';

/**
 * GET  -> { storage, setupRequired, config }  public team settings, never the password
 *         { storage: false, demo }            no database (demo); demo = DEMO_MODE is on
 * PUT  { config } -> { config }               leader session required
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  const redis = getRedis();

  if (req.method === 'GET') {
    // `demo` tells an operator whether DEMO_MODE is on (the app treats both cases the same way).
    if (!redis) return res.status(200).json({ storage: false, demo: isDemoMode() });
    try {
      // Also moves a plain-text password left by older versions into a hash.
      const auth = await loadAuth(redis);
      const config = sanitizeConfig(await redis.get(KEYS.config));
      return res.status(200).json({ storage: true, setupRequired: !auth, config });
    } catch (err) {
      console.error('config GET failed', err);
      return fail(res, 500, 'server_error');
    }
  }

  if (req.method === 'PUT') {
    if (!redis) return fail(res, 503, 'storage_not_configured');
    try {
      if (!(await isLeader(req, redis))) return fail(res, 401, 'unauthorized');
      const config = sanitizeConfig(readBody(req).config);
      if (!config) return fail(res, 400, 'invalid_config');
      await redis.set(KEYS.config, config);
      return res.status(200).json({ config });
    } catch (err) {
      console.error('config PUT failed', err);
      return fail(res, 500, 'server_error');
    }
  }

  return fail(res, 405, 'method_not_allowed');
}
