const express = require('express');
const dbClient = require('../lib/dbClient');
const requireRole = require('../middleware/requireRole');
const { testCaseLimiter } = require('../middleware/rateLimiters');
const { invalidate } = require('../lib/redisClient');

const router = express.Router();
router.use(testCaseLimiter);

router.get('/', async (req, res, next) => {
  try {
    const { data } = await dbClient.get('/internal/test-cases', { params: req.query });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data } = await dbClient.get(`/internal/test-cases/${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post('/internal/test-cases', { ...req.body, createdById: req.user.id });
    if (req.body.projectId) await invalidate(`suites:${req.body.projectId}`);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.patch(`/internal/test-cases/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/test-cases/${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/bulk-delete', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    await dbClient.post('/internal/test-cases/bulk-delete', req.body);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
