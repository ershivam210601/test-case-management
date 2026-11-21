const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const TTL = {
  ANALYTICS: 15 * 60,
  SUITE_LIST: 30 * 60,
  PROJECT_METADATA: 60 * 60,
};

async function getCached(key) {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function setCached(key, value, ttlSeconds) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async function invalidate(...keys) {
  if (keys.length) await redis.del(keys);
}

async function invalidateByPrefix(prefix) {
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length) await redis.del(keys);
}

module.exports = { redis, TTL, getCached, setCached, invalidate, invalidateByPrefix };
