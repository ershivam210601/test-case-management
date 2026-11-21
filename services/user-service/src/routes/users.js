const express = require('express');
const dbClient = require('../lib/dbClient');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { data } = await dbClient.get('/internal/users');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { data } = await dbClient.get(`/internal/users/${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const { data } = await dbClient.patch(`/internal/users/${req.params.id}`, { name, role });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await dbClient.delete(`/internal/users/${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
