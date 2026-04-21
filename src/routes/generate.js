const express = require('express');
const multer = require('multer');
const { generateTestCases } = require('../prompts/testCaseGenerator');
const { extractText } = require('../parsers/fileParser');
const { fetchJiraTicket } = require('../parsers/jiraParser');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', async (req, res) => {
  const { userStory, acceptanceCriteria } = req.body;

  if (!userStory || typeof userStory !== 'string' || !userStory.trim()) {
    return res.status(400).json({ error: 'userStory is required' });
  }
  if (!acceptanceCriteria || typeof acceptanceCriteria !== 'string' || !acceptanceCriteria.trim()) {
    return res.status(400).json({ error: 'acceptanceCriteria is required' });
  }

  try {
    const result = await generateTestCases(userStory, acceptanceCriteria);
    res.json(result);
  } catch (err) {
    console.error('Generation failed:', err.message);
    res.status(500).json({ error: 'Failed to generate test cases', details: err.message });
  }
});

router.post('/file', upload.single('document'), async (req, res) => {
  console.log('File route hit');
  console.log('File received:', req.file ? req.file.originalname : 'NO FILE');

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF or Word file' });
  }

  let text;
  try {
    text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch (err) {
    return res.status(422).json({ error: 'Failed to extract text', details: err.message });
  }

  if (!text || !text.trim()) {
    return res.status(422).json({ error: 'No text found in the file' });
  }

  const acceptanceCriteria = req.body?.acceptanceCriteria?.trim() 
    || 'Derived from document content';

  try {
    const result = await generateTestCases(text, acceptanceCriteria);
    res.json(result);
  } catch (err) {
    console.error('Generation failed:', err.message);
    res.status(500).json({ error: 'Failed to generate test cases', details: err.message });
  }
});

router.get('/jira/:ticketId', async (req, res) => {
  const { ticketId } = req.params;

  let userStory, acceptanceCriteria;
  try {
    ({ userStory, acceptanceCriteria } = await fetchJiraTicket(ticketId));
  } catch (err) {
    const status = err.message.includes('not found') ? 404
      : err.message.includes('authentication failed') ? 401
      : err.message.includes('Missing Jira credentials') ? 500
      : 502;
    return res.status(status).json({ error: err.message });
  }

  try {
    const result = await generateTestCases(userStory, acceptanceCriteria);
    res.json(result);
  } catch (err) {
    console.error('Generation failed:', err.message);
    res.status(500).json({ error: 'Failed to generate test cases', details: err.message });
  }
});

module.exports = router;