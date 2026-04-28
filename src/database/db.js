const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../testforge.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS test_suites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    reference TEXT NOT NULL,
    user_story TEXT NOT NULL,
    test_cases TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertStmt = db.prepare(
  'INSERT INTO test_suites (source, reference, user_story, test_cases, total_count) VALUES (?, ?, ?, ?, ?)'
);

function saveTestSuite(source, reference, userStory, testCases) {
  const json = JSON.stringify(testCases);
  const count = Array.isArray(testCases) ? testCases.length : 0;
  const result = insertStmt.run(source, reference, userStory, json, count);
  return result.lastInsertRowid;
}

function getTestSuites() {
  return db.prepare(
    'SELECT id, source, reference, total_count, created_at FROM test_suites ORDER BY id DESC'
  ).all();
}

function getTestSuiteById(id) {
  const row = db.prepare('SELECT * FROM test_suites WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, test_cases: JSON.parse(row.test_cases) };
}

function deleteTestSuite(id) {
  const result = db.prepare('DELETE FROM test_suites WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = { saveTestSuite, getTestSuites, getTestSuiteById, deleteTestSuite };
