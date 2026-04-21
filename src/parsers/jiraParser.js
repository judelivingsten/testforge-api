const axios = require('axios');

function extractTextFromADF(node) {
  if (!node) return '';

  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromADF).join('');
  }

  return '';
}

async function fetchJiraTicket(ticketId) {
  const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

  if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('Missing Jira credentials: JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN must be set');
  }

  const url = `${JIRA_DOMAIN}/rest/api/3/issue/${ticketId}`;

  let response;
  try {
    response = await axios.get(url, {
      auth: {
        username: JIRA_EMAIL,
        password: JIRA_API_TOKEN,
      },
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 401 || status === 403) {
        throw new Error('Jira authentication failed: check JIRA_EMAIL and JIRA_API_TOKEN');
      }
      if (status === 404) {
        throw new Error(`Jira ticket not found: ${ticketId}`);
      }
      throw new Error(`Jira API error (${status}): ${err.response.data?.errorMessages?.join(', ') || err.message}`);
    }
    throw new Error(`Failed to reach Jira: ${err.message}`);
  }

  const fields = response.data.fields;

  const userStory = fields.summary || '';
  const acceptanceCriteria = extractTextFromADF(fields.description);

  return { userStory, acceptanceCriteria };
}

module.exports = { fetchJiraTicket };
