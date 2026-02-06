import crypto from 'crypto';

// Create a signed session cookie value
export function createSession() {
  const expires = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET)
    .update(String(expires)).digest('hex');
  return `${expires}.${sig}`;
}

// Validate session cookie - returns true/false
export function validateSession(req) {
  const cookie = (req.headers.cookie || '');
  const match = cookie.match(/gt_session=([^;]+)/);
  if (!match) return false;

  const [expires, sig] = match[1].split('.');
  if (!expires || !sig) return false;
  if (Date.now() > parseInt(expires)) return false;

  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET)
    .update(expires).digest('hex');

  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// Auth guard - returns 401 if not authenticated
export function requireAuth(req, res) {
  if (!validateSession(req)) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}
