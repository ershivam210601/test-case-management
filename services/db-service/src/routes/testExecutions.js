const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const { testCaseId, suiteId, executedById, projectId, page = '1', pageSize = '20' } = req.query;
  const where = {
    ...(testCaseId && { testCaseId }),
    ...(suiteId && { suiteId }),
    ...(executedById && { executedById }),
    ...(projectId && { testCase: { projectId } }),
  };
  const take = Math.min(parseInt(pageSize, 10) || 20, 100);
  const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.testExecution.findMany({
      where,
      include: { testCase: { select: { id: true, title: true, priority: true, type: true } }, executedBy: { select: { id: true, name: true } } },
      orderBy: { executedAt: 'desc' },
      skip,
      take,
    }),
    prisma.testExecution.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), pageSize: take });
});

router.post('/', async (req, res) => {
  const { testCaseId, suiteId, status, comment, executedById } = req.body;
  const execution = await prisma.testExecution.create({
    data: { testCaseId, suiteId, status, comment, executedById },
  });
  res.status(201).json(execution);
});

module.exports = router;
