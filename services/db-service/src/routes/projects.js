const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const { userId } = req.query;
  const where = userId ? { members: { some: { userId } } } : {};
  const projects = await prisma.project.findMany({
    where,
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
  });
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

router.post('/', async (req, res) => {
  const { name, description, version, status, createdById, memberIds } = req.body;
  const project = await prisma.project.create({
    data: {
      name,
      description,
      version,
      status: status || 'Active',
      createdById,
      members: {
        create: [createdById, ...(memberIds || []).filter((id) => id !== createdById)].map((userId) => ({ userId })),
      },
    },
    include: { members: true },
  });
  res.status(201).json(project);
});

router.patch('/:id', async (req, res) => {
  const { name, description, version, status } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { name, description, version, status },
  });
  res.json(project);
});

router.delete('/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post('/:id/members', async (req, res) => {
  const { userId } = req.body;
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: req.params.id, userId } },
    create: { projectId: req.params.id, userId },
    update: {},
  });
  res.status(201).json({ ok: true });
});

router.delete('/:id/members/:userId', async (req, res) => {
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  });
  res.status(204).end();
});

module.exports = router;
