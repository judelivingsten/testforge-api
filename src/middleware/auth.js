const rateLimit = require('express-rate-limit');

function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({ error: 'Missing API key. Provide it in the x-api-key header.' });
  }

  if (key !== process.env.APP_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key.' });
  }

  next();
}

const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded. Maximum 100 requests per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiKeyAuth, rateLimiter };
