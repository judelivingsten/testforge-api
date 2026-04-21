const express = require('express');
const { fetchJiraTicket } = require('../parsers/jiraParser');

const router = express.Router();

router.get('/:ticketId', async (req, res) => {
  const { ticketId } = req.params;

  try {
    const { userStory, acceptanceCriteria } = await fetchJiraTicket(ticketId);
    res.json({ ticketId, userStory, acceptanceCriteria });
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('authentication failed') ? 401
      : err.message.includes('Missing Jira credentials') ? 500
      : 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
