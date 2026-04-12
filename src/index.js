require('dotenv').config();
const express = require('express');
const cors = require('cors');

const generateRouter = require('./routes/generate');
const exportRouter = require('./routes/export');
const { apiKeyAuth, rateLimiter } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TestForge API is running' });
});

app.use('/api', rateLimiter);
app.use('/api', apiKeyAuth);

app.use('/api/v1/generate', generateRouter);
app.use('/api/v1/export', exportRouter);

app.listen(PORT, () => {
  console.log(`TestForge API listening on port ${PORT}`);
});
