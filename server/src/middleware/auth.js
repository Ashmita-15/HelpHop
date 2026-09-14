import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** Rejects the request unless a valid Bearer token is present. */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

/** Use after requireAuth: requireRole('organization') */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Only a ${roles.join(' or ')} can do that` });
    }
    next();
  };
}

/** Attaches req.user when a token is present, but never blocks the request. */
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub);
  } catch {
    /* ignore — anonymous browsing is allowed */
  }
  next();
}
