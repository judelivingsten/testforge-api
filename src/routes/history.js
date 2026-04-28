const express = require('express');
const { getTestSuites, getTestSuiteById, deleteTestSuite } = require('../database/db');

const router = express.Router();

router.get('/', (req, res) => {
  const suites = getTestSuites();
  res.json(suites);
});

router.get('/:id', (req, res) => {
  const suite = getTestSuiteById(Number(req.params.id));
  if (!suite) return res.status(404).json({ error: 'Test suite not found' });
  res.json(suite);
});

router.delete('/:id', (req, res) => {
  const deleted = deleteTestSuite(Number(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Test suite not found' });
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
