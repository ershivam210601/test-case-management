const express = require('express');
const dbClient = require('../lib/dbClient');
const requireRole = require('../middleware/requireRole');
const { executionLimiter } = require('../middleware/rateLimiters');
const { invalidateByPrefix } = require('../lib/redisClient');

const router = express.Router();
router.use(executionLimiter);

router.get('/', async (req, res, next) => {
  try {
    const { data } = await dbClient.get('/internal/test-executions', { params: req.query });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'test_lead', 'tester'), async (req, res, next) => {
  try {
    const { data } = await dbClient.post('/internal/test-executions', { ...req.body, executedById: req.user.id });
    await invalidateByPrefix('analytics:');
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
