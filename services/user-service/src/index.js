require('dotenv').config();
const express = require('express');
const authenticate = require('./middleware/authenticate');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'user-service' }));

app.use(authenticate);

app.use('/users', require('./routes/users'));
app.use('/projects', require('./routes/projects'));
app.use('/test-cases', require('./routes/testCases'));
app.use('/test-suites', require('./routes/testSuites'));
app.use('/test-executions', require('./routes/testExecutions'));
app.use('/analytics', require('./routes/analytics'));

app.use((err, req, res, next) => {
  console.error(err);
  const status = (err.response && err.response.status) || 500;
  const data = (err.response && err.response.data) || { error: 'Internal user-service error' };
  res.status(status).json(data);
});

const port = process.env.PORT || 4003;
app.listen(port, () => console.log(`user-service listening on ${port}`));
