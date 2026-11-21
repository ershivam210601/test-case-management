const express = require('express');
const dbClient = require('../lib/dbClient');
const { analyticsLimiter } = require('../middleware/rateLimiters');
const { getCached, setCached, TTL } = require('../lib/redisClient');

const router = express.Router();
router.use(analyticsLimiter);

router.get('/:projectId', async (req, res, next) => {
  try {
    const cacheKey = `analytics:${req.params.projectId}`;
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await dbClient.get(`/internal/analytics/${req.params.projectId}`);
    await setCached(cacheKey, data, TTL.ANALYTICS);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
