const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert QA engineer. Given a user story and acceptance criteria, generate comprehensive test cases.

Return ONLY a valid JSON object with this exact structure:
{
  "testCases": [
    {
      "id": "TC-001",
      "title": "Short descriptive title",
      "type": "positive" | "negative" | "edge",
      "priority": "high" | "medium" | "low",
      "given": "The precondition or initial context",
      "when": "The action or event that occurs",
      "then": "The expected outcome or result"
    }
  ]
}

Guidelines:
- Generate a balanced set covering positive, negative, and edge cases
- Assign IDs sequentially as TC-001, TC-002, etc.
- Priority: high = critical path or blocking; medium = important but not blocking; low = nice-to-have coverage
- Keep Given/When/Then concise and specific
- Do not include any text outside the JSON object`;

async function generateTestCases(userStory, acceptanceCriteria) {
  if (!userStory || typeof userStory !== 'string' || !userStory.trim()) {
    throw new Error('userStory is required and must be a non-empty string');
  }
  if (!acceptanceCriteria || typeof acceptanceCriteria !== 'string' || !acceptanceCriteria.trim()) {
    throw new Error('acceptanceCriteria is required and must be a non-empty string');
  }

  const userMessage = `User Story:\n${userStory.trim()}\n\nAcceptance Criteria:\n${acceptanceCriteria.trim()}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('No text content in Claude response');
  }

  let parsed;
  try {
    const cleaned = textBlock.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${textBlock.text.slice(0, 200)}`);
  }

  if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
    throw new Error('Response missing required testCases array');
  }

  return parsed;
}

module.exports = { generateTestCases };