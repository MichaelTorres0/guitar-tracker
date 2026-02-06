import { createSession, validateSession } from './lib/auth.js';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body || {};
    if (!password || password !== process.env.APP_PASSWORD) {
      return res.status(401).json({ error: 'Wrong password' });
    }
    const session = createSession();
    res.setHeader('Set-Cookie',
      `gt_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`
    );
    return res.status(200).json({ authenticated: true });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: validateSession(req) });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie',
      'gt_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    );
    return res.status(200).json({ authenticated: false });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
