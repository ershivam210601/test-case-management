const express = require('express');
const { z } = require('zod');
const dbClient = require('../dbClient');
const { signToken, verifyToken } = require('../jwt');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { email, password, name } = parsed.data;

    const existing = await dbClient.get(`/internal/users/by-email/${encodeURIComponent(email)}`).catch((e) => {
      if (e.response && e.response.status === 404) return null;
      throw e;
    });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const { data: user } = await dbClient.post('/internal/users', {
      email, password, name, role: 'tester',
    });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const { email, password } = parsed.data;

    const { data: user } = await dbClient.post('/internal/users/verify-password', { email, password })
      .catch((e) => {
        if (e.response && (e.response.status === 404 || e.response.status === 401)) {
          return { data: null };
        }
        throw e;
      });

    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.get('/me', (req, res) => {
  const authHeader = req.header('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = verifyToken(token);
    res.json({ id: payload.sub, email: payload.email, name: payload.name, role: payload.role });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
