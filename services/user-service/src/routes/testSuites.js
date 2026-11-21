const express = require('express');
const dbClient = require('../lib/dbClient');
const requireRole = require('../middleware/requireRole');
const { getCached, setCached, invalidate, TTL } = require('../lib/redisClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const cacheKey = `suites:${projectId || 'all'}`;
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await dbClient.get('/internal/test-suites', { params: req.query });
    await setCached(cacheKey, data, TTL.SUITE_LIST);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data } = await dbClient.get(`/internal/test-suites/${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post('/internal/test-suites', req.body);
    await invalidate(`suites:${req.body.projectId}`, 'suites:all');
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.patch(`/internal/test-suites/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/test-suites/${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cases', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post(`/internal/test-suites/${req.params.id}/cases`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/cases/:testCaseId', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/test-suites/${req.params.id}/cases/${req.params.testCaseId}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
