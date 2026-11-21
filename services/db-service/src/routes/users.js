const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.get('/by-email/:email', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.params.email } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.post('/', async (req, res) => {
  const { email, password, name, role } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: role || 'tester' },
  });
  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.post('/verify-password', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.patch('/:id', async (req, res) => {
  const { name, role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, role },
  });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.delete('/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;
