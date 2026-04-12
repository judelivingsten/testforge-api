/**
 * Integration tests for POST /api/v1/generate
 *
 * Requires the server to be running:
 *   npm start
 *
 * Set APP_API_KEY in .env or export it before running:
 *   node tests/generate.test.js
 */

require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.APP_API_KEY || '';

const VALID_PAYLOAD = {
  userStory:
    'As a registered user, I want to log in with my email and password ' +
    'so that I can access my account.',
  acceptanceCriteria: [
    '- Valid email and password grants access and redirects to the dashboard.',
    '- Invalid credentials display an error message without revealing which field is wrong.',
    '- Account is locked for 15 minutes after 5 consecutive failed attempts.',
    '- A "Remember me" option keeps the user logged in for 30 days.',
    '- Logged-in users who revisit the login page are redirected to the dashboard.',
  ].join('\n'),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function run(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    await fn();
    console.log('PASS');
    passed++;
  } catch (err) {
    console.log(`FAIL\n    ${err.message}`);
    failed++;
  }
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, ...headers },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nPOST /api/v1/generate\n');

  // 1. Reject missing API key
  await run('returns 401 when x-api-key header is absent', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  // 2. Reject wrong API key
  await run('returns 403 for an invalid API key', async () => {
    const { status } = await post('/api/v1/generate', VALID_PAYLOAD, {
      'x-api-key': 'wrong-key',
    });
    assert(status === 403, `expected 403, got ${status}`);
  });

  // 3. Reject missing userStory
  await run('returns 400 when userStory is missing', async () => {
    const { status, body } = await post('/api/v1/generate', {
      acceptanceCriteria: VALID_PAYLOAD.acceptanceCriteria,
    });
    assert(status === 400, `expected 400, got ${status}`);
    assert(typeof body.error === 'string', 'expected error message');
  });

  // 4. Reject missing acceptanceCriteria
  await run('returns 400 when acceptanceCriteria is missing', async () => {
    const { status, body } = await post('/api/v1/generate', {
      userStory: VALID_PAYLOAD.userStory,
    });
    assert(status === 400, `expected 400, got ${status}`);
    assert(typeof body.error === 'string', 'expected error message');
  });

  // 5. Reject empty strings
  await run('returns 400 when fields are empty strings', async () => {
    const { status } = await post('/api/v1/generate', {
      userStory: '   ',
      acceptanceCriteria: '   ',
    });
    assert(status === 400, `expected 400, got ${status}`);
  });

  // 6. Successful generation
  await run('returns 200 with structured test cases for a valid login user story', async () => {
    console.log('\n    Calling Claude API — this may take a few seconds...');

    const { status, body } = await post('/api/v1/generate', VALID_PAYLOAD);

    assert(status === 200, `expected 200, got ${status} — ${JSON.stringify(body)}`);
    assert(Array.isArray(body.testCases), 'response.testCases should be an array');
    assert(body.testCases.length > 0, 'testCases array should not be empty');

    const REQUIRED_FIELDS = ['id', 'title', 'type', 'priority', 'given', 'when', 'then'];
    for (const tc of body.testCases) {
      for (const field of REQUIRED_FIELDS) {
        assert(typeof tc[field] === 'string' && tc[field].trim(), `test case missing field: ${field}`);
      }
      assert(['positive', 'negative', 'edge'].includes(tc.type), `invalid type: ${tc.type}`);
      assert(['high', 'medium', 'low'].includes(tc.priority), `invalid priority: ${tc.priority}`);
    }

    const types = new Set(body.testCases.map((tc) => tc.type));
    assert(types.has('positive'), 'expected at least one positive test case');
    assert(types.has('negative'), 'expected at least one negative test case');
    assert(types.has('edge'),     'expected at least one edge test case');

    console.log(`\n    Generated ${body.testCases.length} test cases:`);
    for (const tc of body.testCases) {
      console.log(`      [${tc.type.padEnd(8)} | ${tc.priority.padEnd(6)}] ${tc.id} — ${tc.title}`);
    }
    console.log('');
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err.message);
  console.error('Is the server running?  →  npm start\n');
  process.exit(1);
});
