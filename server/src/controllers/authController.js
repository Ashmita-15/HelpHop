import bcrypt from 'bcryptjs';
import User, { ROLES } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const { password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw httpError(400, 'Name, email, password and role are all required');
  }
  if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email address');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (!ROLES.includes(role)) throw httpError(400, 'Role must be volunteer or organization');

  if (await User.exists({ email })) {
    throw httpError(409, 'An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

export const login = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email });
  // Same message either way so we don't leak which emails are registered.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: user.toPublic() });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});
