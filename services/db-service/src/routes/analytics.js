const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;

  const [statusCounts, priorityCounts, totalTestCases, executions, byTester] = await Promise.all([
    prisma.testExecution.groupBy({
      by: ['status'],
      where: { testCase: { projectId } },
      _count: { _all: true },
    }),
    prisma.testCase.groupBy({
      by: ['priority'],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.testCase.count({ where: { projectId } }),
    prisma.testExecution.findMany({
      where: { testCase: { projectId } },
      select: { status: true, executedAt: true },
      orderBy: { executedAt: 'asc' },
    }),
    prisma.testExecution.groupBy({
      by: ['executedById'],
      where: { testCase: { projectId } },
      _count: { _all: true },
    }),
  ]);

  res.json({ statusCounts, priorityCounts, totalTestCases, executions, byTester });
});

module.exports = router;
