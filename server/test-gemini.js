const assert = require('assert');
const { generateAiChangeSummary, getGeminiClient, resetGeminiClient } = require('./engine/gemini');
const { computeTextDiff, generateChangeSummary } = require('./engine/differ');

async function runGeminiTests() {
  console.log('🧪 Starting WatchTower Gemini Integration & Fallback Test Suite...\n');
  let passed = 0;
  let failed = 0;

  // Preserve any ambient environment variable
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  // =========================================================================
  // TEST 1: Missing API Key Fallback
  // =========================================================================
  try {
    console.log('--- Test 1: Missing API Key Fallback ---');
    delete process.env.GEMINI_API_KEY;
    resetGeminiClient();

    const oldText = 'TechGadget Headphones $49.99 in stock';
    const newText = 'TechGadget Headphones $39.99 in stock';
    const diff = computeTextDiff(oldText, newText);
    const ruleSummary = generateChangeSummary(oldText, newText, diff.stats);

    const res = await generateAiChangeSummary({
      oldText,
      newText,
      diffStats: diff.stats,
      fallbackSummary: ruleSummary
    });

    assert.strictEqual(res.summarySource, 'fallback', 'Must use fallback when GEMINI_API_KEY is not set');
    assert.strictEqual(res.summary, ruleSummary, 'Must return rule-based summary');
    console.log(`  ✓ Successfully fell back to rule-based summary: "${res.summary}" (source: ${res.summarySource})`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 1 failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST 2: Initial Baseline - No Gemini Call
  // =========================================================================
  try {
    console.log('\n--- Test 2: Initial Baseline Exemption ---');
    process.env.GEMINI_API_KEY = 'mock-key-for-test';
    resetGeminiClient();

    const res = await generateAiChangeSummary({
      oldText: '',
      newText: 'Brand new page content',
      fallbackSummary: 'Initial baseline snapshot captured.'
    });

    assert.strictEqual(res.summarySource, 'fallback', 'Initial baseline must not call Gemini');
    assert.strictEqual(res.summary, 'Initial baseline snapshot captured.');
    console.log(`  ✓ Initial baseline skipped Gemini: "${res.summary}"`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 2 failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST 3: Unchanged Page - No Gemini Call
  // =========================================================================
  try {
    console.log('\n--- Test 3: Unchanged Content Exemption ---');
    process.env.GEMINI_API_KEY = 'mock-key-for-test';
    resetGeminiClient();

    const text = 'Static header and footer content unchanged';
    const res = await generateAiChangeSummary({
      oldText: text,
      newText: text,
      fallbackSummary: 'No notable content changes detected.'
    });

    assert.strictEqual(res.summarySource, 'fallback', 'Unchanged page must not call Gemini');
    assert.strictEqual(res.summary, 'No notable content changes detected.');
    console.log(`  ✓ Unchanged content skipped Gemini: "${res.summary}"`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 3 failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST 4: Successful Gemini AI Summary (Mocked SDK Client)
  // =========================================================================
  try {
    console.log('\n--- Test 4: Mocked Gemini Generation Success ---');
    process.env.GEMINI_API_KEY = 'mock-key-for-test';
    resetGeminiClient();

    // Mock client with valid Gemini response
    const mockClient = {
      models: {
        generateContent: async ({ model, contents }) => {
          assert.ok(contents.includes('UNTRUSTED DATA'), 'Prompt must instruct model to treat text as untrusted');
          assert.ok(contents.includes('TechGadget Headphones'), 'Prompt must include webpage text');
          return {
            text: 'The price for TechGadget Headphones was discounted by $10, dropping from $49.99 to $39.99.'
          };
        }
      }
    };

    // Override client getter temporarily for unit test
    const geminiModule = require('./engine/gemini');
    const originalGetClient = geminiModule.getGeminiClient;
    geminiModule.getGeminiClient = () => mockClient;

    const res = await generateAiChangeSummary({
      oldText: 'TechGadget Headphones $49.99',
      newText: 'TechGadget Headphones $39.99',
      diffStats: { addedLines: 1, removedLines: 1, changedPercent: 10 },
      monitor: { name: 'Store Monitor', url: 'https://example.com/store' },
      fallbackSummary: 'Price dropped by $10',
      client: mockClient
    });

    assert.strictEqual(res.summarySource, 'gemini', 'Successful generation must report summarySource="gemini"');
    assert.ok(res.summary.includes('$49.99 to $39.99'), 'Summary text must match generated response');

    console.log(`  ✓ Gemini AI summary generated: "${res.summary}" (source: ${res.summarySource})`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 4 failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST 5: Error / Rate-Limit Resilience
  // =========================================================================
  try {
    console.log('\n--- Test 5: Gemini Error / Quota Resilience ---');
    const mockFailingClient = {
      models: {
        generateContent: async () => {
          throw new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for gemini-2.5-flash');
        }
      }
    };

    const res = await generateAiChangeSummary({
      oldText: 'TechGadget Headphones $49.99',
      newText: 'TechGadget Headphones $39.99',
      diffStats: { addedLines: 1, removedLines: 1 },
      fallbackSummary: 'Price dropped by $10.00',
      client: mockFailingClient
    });

    assert.strictEqual(res.summarySource, 'fallback', 'Failed API call must cleanly return fallback source');
    assert.strictEqual(res.summary, 'Price dropped by $10.00', 'Must return rule-based fallback without throwing');

    console.log(`  ✓ Gracefully caught 429 quota error and used fallback: "${res.summary}"`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 5 failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST 6: Timeout Resilience
  // =========================================================================
  try {
    console.log('\n--- Test 6: Gemini Request Timeout Resilience ---');
    const mockHangingClient = {
      models: {
        generateContent: async () => {
          // Never resolves or takes 5 seconds
          await new Promise(r => setTimeout(r, 5000));
          return { text: 'Late response' };
        }
      }
    };

    const start = Date.now();
    const res = await generateAiChangeSummary({
      oldText: 'Old announcement',
      newText: 'New announcement',
      diffStats: { addedLines: 1, removedLines: 1 },
      fallbackSummary: 'Announcement updated.',
      timeoutMs: 300, // fast timeout for test
      client: mockHangingClient
    });
    const elapsed = Date.now() - start;

    assert.ok(elapsed < 1500, `Must time out quickly (took ${elapsed}ms)`);
    assert.strictEqual(res.summarySource, 'fallback', 'Timed out request must return fallback');
    assert.strictEqual(res.summary, 'Announcement updated.');

    console.log(`  ✓ Timed out after ${elapsed}ms and safely used fallback without crashing`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test 6 failed:', err.message);
    failed++;
  }

  // Restore environment variables
  if (originalKey) {
    process.env.GEMINI_API_KEY = originalKey;
  } else {
    delete process.env.GEMINI_API_KEY;
  }
  if (originalModel) {
    process.env.GEMINI_MODEL = originalModel;
  } else {
    delete process.env.GEMINI_MODEL;
  }
  resetGeminiClient();

  console.log(`\n====================================================`);
  console.log(`🏁 Gemini Suite Result: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runGeminiTests().catch(err => {
  console.error('Fatal Gemini test error:', err);
  process.exit(1);
});
