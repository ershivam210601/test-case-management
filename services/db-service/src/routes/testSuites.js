const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const { projectId } = req.query;
  const suites = await prisma.testSuite.findMany({
    where: projectId ? { projectId } : {},
    include: { cases: { include: { testCase: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(suites);
});

router.get('/:id', async (req, res) => {
  const suite = await prisma.testSuite.findUnique({
    where: { id: req.params.id },
    include: { cases: { include: { testCase: { include: { steps: true } } } } },
  });
  if (!suite) return res.status(404).json({ error: 'Not found' });
  res.json(suite);
});

router.post('/', async (req, res) => {
  const { projectId, name, description, testCaseIds } = req.body;
  const suite = await prisma.testSuite.create({
    data: {
      projectId, name, description,
      cases: { create: (testCaseIds || []).map((testCaseId) => ({ testCaseId })) },
    },
    include: { cases: true },
  });
  res.status(201).json(suite);
});

router.patch('/:id', async (req, res) => {
  const { name, description } = req.body;
  const suite = await prisma.testSuite.update({ where: { id: req.params.id }, data: { name, description } });
  res.json(suite);
});

router.delete('/:id', async (req, res) => {
  await prisma.testSuite.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post('/:id/cases', async (req, res) => {
  const { testCaseId } = req.body;
  await prisma.suiteCase.upsert({
    where: { suiteId_testCaseId: { suiteId: req.params.id, testCaseId } },
    create: { suiteId: req.params.id, testCaseId },
    update: {},
  });
  res.status(201).json({ ok: true });
});

router.delete('/:id/cases/:testCaseId', async (req, res) => {
  await prisma.suiteCase.delete({
    where: { suiteId_testCaseId: { suiteId: req.params.id, testCaseId: req.params.testCaseId } },
  });
  res.status(204).end();
});

module.exports = router;
