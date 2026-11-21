const express = require('express');
const dbClient = require('../lib/dbClient');
const requireRole = require('../middleware/requireRole');
const { getCached, setCached, invalidate, TTL } = require('../lib/redisClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { data } = await dbClient.get('/internal/projects');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const cacheKey = `project:${req.params.id}`;
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await dbClient.get(`/internal/projects/${req.params.id}`);
    await setCached(cacheKey, data, TTL.PROJECT_METADATA);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post('/internal/projects', { ...req.body, createdById: req.user.id });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.patch(`/internal/projects/${req.params.id}`, req.body);
    await invalidate(`project:${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/projects/${req.params.id}`);
    await invalidate(`project:${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post(`/internal/projects/${req.params.id}/members`, req.body);
    await invalidate(`project:${req.params.id}`);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/members/:userId', requireRole('admin', 'test_lead'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/projects/${req.params.id}/members/${req.params.userId}`);
    await invalidate(`project:${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
