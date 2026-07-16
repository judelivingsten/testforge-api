require('dotenv').config();
const express = require('express');
const cors = require('cors');

const generateRouter = require('./routes/generate');
const exportRouter = require('./routes/export');
const jiraRouter = require('./routes/jira');
const historyRouter = require('./routes/history');
const webhookRouter = require('./routes/webhook');
const { apiKeyAuth, rateLimiter } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Jira webhooks cannot send the x-api-key header, so mount the webhook route
// before the auth middleware. It authenticates via a shared secret instead.
app.use('/api/v1/webhook', webhookRouter);

app.use('/api', rateLimiter);
app.use('/api', apiKeyAuth);

app.use('/api/v1/generate', generateRouter);
app.use('/api/v1/export', exportRouter);
app.use('/api/v1/jira', jiraRouter);
app.use('/api/v1/history', historyRouter);

app.listen(PORT, () => {
  console.log(`TestForge API listening on port ${PORT}`);
});
