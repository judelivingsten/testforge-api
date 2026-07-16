const express = require('express');
const { fetchJiraTicket } = require('../parsers/jiraParser');
const { generateTestCases } = require('../prompts/testCaseGenerator');
const { saveTestSuite } = require('../database/db');

const router = express.Router();

// Jira webhooks cannot send custom headers, so the shared secret is passed
// in the request body (`secret`) or as a query parameter (`?secret=`).
function validateSecret(req) {
  const expected = process.env.JIRA_WEBHOOK_SECRET;
  if (!expected) {
    return { ok: false, status: 500, error: 'Webhook secret is not configured' };
  }

  const provided = req.body?.secret || req.query?.secret;
  if (!provided) {
    return { ok: false, status: 401, error: 'Missing webhook secret' };
  }
  if (provided !== expected) {
    return { ok: false, status: 403, error: 'Invalid webhook secret' };
  }
  return { ok: true };
}

router.post('/jira', async (req, res) => {
  const auth = validateSecret(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const event = req.body || {};

  if (event.webhookEvent !== 'jira:issue_created') {
    // Acknowledge other events so Jira does not retry them.
    return res.status(200).json({ status: 'ignored', reason: 'unhandled event type' });
  }

  const issueKey = event.issue?.key;
  if (!issueKey) {
    return res.status(400).json({ error: 'Missing issue key in webhook payload' });
  }

  let userStory, acceptanceCriteria;
  try {
    ({ userStory, acceptanceCriteria } = await fetchJiraTicket(issueKey));
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('authentication failed') ? 401
      : err.message.includes('Missing Jira credentials') ? 500
      : 502;
    return res.status(status).json({ error: err.message });
  }

  try {
    const result = await generateTestCases(userStory, acceptanceCriteria);
    const suiteId = saveTestSuite('jira', issueKey, userStory, result.testCases);
    return res.status(200).json({
      status: 'success',
      issueKey,
      suiteId,
      totalCount: result.testCases.length,
    });
  } catch (err) {
    console.error('Webhook generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate test cases', details: err.message });
  }
});

module.exports = router;
