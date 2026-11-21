require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'auth-service' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later' },
});

app.use('/auth', authLimiter, require('./routes/auth'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal auth-service error' });
});

const port = process.env.PORT || 4002;
app.listen(port, () => console.log(`auth-service listening on ${port}`));
