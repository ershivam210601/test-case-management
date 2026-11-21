const rateLimit = require('express-rate-limit');

function makeLimiter(max, windowMs) {
  return rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });
}

module.exports = {
  testCaseLimiter: makeLimiter(100, 60 * 60 * 1000),
  executionLimiter: makeLimiter(200, 60 * 60 * 1000),
  analyticsLimiter: makeLimiter(50, 60 * 60 * 1000),
};
