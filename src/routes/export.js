const express = require('express');
const { generateExcelFile } = require('../formatters/excelFormatter');

const router = express.Router();

router.post('/excel', async (req, res) => {
  const { testCases } = req.body;

  if (!Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ error: 'testCases must be a non-empty array' });
  }

  try {
    const filePath = await generateExcelFile(testCases);

    res.download(filePath, 'test-cases.xlsx');
  } catch (err) {
    console.error('Excel export failed:', err.message);
    res.status(500).json({ error: 'Failed to generate Excel file', details: err.message });
  }
});

module.exports = router;
