require('dotenv').config();
const express = require('express');
const internalAuth = require('./internalAuth');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'db-service' }));

app.use(internalAuth);

app.use('/internal/users', require('./routes/users'));
app.use('/internal/projects', require('./routes/projects'));
app.use('/internal/test-cases', require('./routes/testCases'));
app.use('/internal/test-suites', require('./routes/testSuites'));
app.use('/internal/test-executions', require('./routes/testExecutions'));
app.use('/internal/analytics', require('./routes/analytics'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal db-service error' });
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`db-service listening on ${port}`));
