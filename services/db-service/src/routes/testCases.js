const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const { projectId, priority, type, search, tag, page = '1', pageSize = '20' } = req.query;
  const where = {
    ...(projectId && { projectId }),
    ...(priority && { priority }),
    ...(type && { type }),
    ...(tag && { tags: { has: tag } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.testCase.findMany({
      where,
      include: { steps: { orderBy: { stepNo: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.testCase.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

router.get('/:id', async (req, res) => {
  const testCase = await prisma.testCase.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { stepNo: 'asc' } } },
  });
  if (!testCase) return res.status(404).json({ error: 'Not found' });
  res.json(testCase);
});

router.post('/', async (req, res) => {
  const {
    projectId, title, description, priority, type,
    preconditions, postconditions, tags, createdById, steps,
  } = req.body;
  const testCase = await prisma.testCase.create({
    data: {
      projectId, title, description, priority, type,
      preconditions, postconditions, tags: tags || [], createdById,
      steps: {
        create: (steps || []).map((s, i) => ({
          stepNo: i + 1, action: s.action, expectedResult: s.expectedResult,
        })),
      },
    },
    include: { steps: true },
  });
  res.status(201).json(testCase);
});

router.patch('/:id', async (req, res) => {
  const {
    title, description, priority, type, preconditions, postconditions, tags, steps,
  } = req.body;

  if (steps) {
    await prisma.testStep.deleteMany({ where: { testCaseId: req.params.id } });
  }

  const testCase = await prisma.testCase.update({
    where: { id: req.params.id },
    data: {
      title, description, priority, type, preconditions, postconditions, tags,
      ...(steps && {
        steps: {
          create: steps.map((s, i) => ({ stepNo: i + 1, action: s.action, expectedResult: s.expectedResult })),
        },
      }),
    },
    include: { steps: true },
  });
  res.json(testCase);
});

router.delete('/:id', async (req, res) => {
  await prisma.testCase.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  await prisma.testCase.deleteMany({ where: { id: { in: ids } } });
  res.status(204).end();
});

module.exports = router;
