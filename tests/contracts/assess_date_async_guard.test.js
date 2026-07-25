#!/usr/bin/env node
'use strict';
// DATE PHASE 1B (async guard) — acceptance contract.
//
// populateAssessDateDropdown() awaits a network fetch before touching the
// DOM. Nothing previously stopped an older, still-in-flight call from
// applying its (now stale) result after a newer call had already started or
// finished — an older call's fetch resolving late could clobber a newer
// call's correct render, or resurrect state a patient-switch reset had just
// cleared (see the ASSESS_DATE_STATE_INTEGRITY recon and Q2/R4 design
// rounds).
//
// Fix: a module-level generation counter. Every call captures its own token
// synchronously, before any await; on resuming after the await, a token that
// no longer matches the counter means a newer call started since — this
// call's result is stale and must bare-return before any DOM mutation
// (§4.8 does not apply here: a newer call is guaranteed to either have
// already rendered correctly, or still be in flight and will render when it
// resumes — see the Q2/A-3 design reasoning already accepted for this
// mechanism).
//
// Separately, isAssessmentDateOtherMode(sel) was extracted from the inline
// `sel.value === '__other__'` check. This is NOT a race-condition fix —
// it's a stale-value-still-in-the-DOM fix: the generation guard stops an
// OLD CALL from writing; this stops a CURRENT call from trusting
// sel.value === '__other__' when the #assess-date-input backing it no
// longer exists.
//
// This file tests both pieces via the same source-slicing technique as the
// other tests in this directory. beginAssessDateGeneration/
// isAssessDateGenerationStale are pure (no DOM at all).
// isAssessmentDateOtherMode touches document.getElementById once — driven
// with a hand-rolled stub that supports simulating "the element doesn't
// exist" (the exact class of bug D-1 caught in the BTracks round — the
// previous version of that stub pre-seeded every id unconditionally, making
// that path untestable).
//
// Exit code 0 = every check held. Exit code 1 = a contract broke.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const APP_JS = fs.readFileSync(path.join(REPO_ROOT, 'app.js'), 'utf8').replace(/\r\n/g, '\n');

let failures = 0;
function check(name, condition, failMessage) {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
    console.log(`      ${failMessage}`);
  }
}

// ---- source-slice for runtime tests (generation counter + Other-mode) ----
const START = '// ===== Phase 1b (async guard): generation counter =====';
const END = 'async function populateAssessDateDropdown(patientId, opts = {})';

function slice(startMarker, endMarker) {
  const startIdx = APP_JS.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`START_MARKER not found: ${startMarker} — update this test.`);
  const endIdx = APP_JS.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error(`END_MARKER not found after ${startMarker} — update this test.`);
  return APP_JS.slice(startIdx, endIdx);
}

const SOURCE = slice(START, END);
['function beginAssessDateGeneration', 'function isAssessDateGenerationStale', 'function isAssessmentDateOtherMode']
  .forEach(name => {
    if (!SOURCE.includes(name)) throw new Error(`${name} not found in extracted source — update this test.`);
  });

// ---- source-contract helpers (Test 5) — brace-matching, same approach as
// fastigial_form_pipeline_boundary.test.js's extractBlockFrom, reimplemented
// locally so this file stays self-contained. ----
function matchBraceBlock(text, fromIndex) {
  let i = text.indexOf('{', fromIndex);
  if (i === -1) throw new Error('no opening brace found from index ' + fromIndex);
  let depth = 0;
  let inStr = null;
  for (; i < text.length; i++) {
    const c = text[i];
    const prev = text[i - 1];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '/' && text[i + 1] === '/') { const nl = text.indexOf('\n', i); i = nl === -1 ? text.length : nl; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error('unbalanced braces from index ' + fromIndex);
}
// NOTE: fromIndex is idx + startLineText.length - 1 (the marker's OWN last
// character), not idx — populateAssessDateDropdown's signature contains an
// early, irrelevant brace pair (`opts = {}`) that would otherwise be matched
// as the block's opening brace instead of the real function body. The
// marker passed to this function must end with the actual desired '{'.
function extractBlockFrom(text, startLineText) {
  const idx = text.indexOf(startLineText);
  if (idx === -1) throw new Error('start marker not found: ' + startLineText);
  const end = matchBraceBlock(text, idx + startLineText.length - 1);
  return text.slice(idx, end);
}

// ---- DOM stub for isAssessmentDateOtherMode, with an excludeIds path so
// "the element does not exist" is a reachable, testable scenario. ----
function load(sourceOverride, excludeIds) {
  const excluded = new Set(excludeIds || []);
  const registry = {};
  if (!excluded.has('assess-date-input')) {
    registry['assess-date-input'] = { id: 'assess-date-input', value: '2026-07-20' };
  }
  const sandbox = {
    document: { getElementById: id => registry[id] || null },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(sourceOverride || SOURCE, context);
  return { context, registry };
}

// =============================================================================
// Generation helpers: 4 cases + mutation control
// =============================================================================
{
  const { context } = load();
  const t1 = context.beginAssessDateGeneration();
  check('1: a freshly-minted token is not stale relative to itself', context.isAssessDateGenerationStale(t1) === false,
    'expected the token just obtained to not be stale yet');

  const t2 = context.beginAssessDateGeneration();
  check('2: an earlier token becomes stale once a newer token is minted', context.isAssessDateGenerationStale(t1) === true,
    'expected t1 to be stale now that t2 exists');
  check('2: the newer token is not stale', context.isAssessDateGenerationStale(t2) === false,
    'expected t2 (the latest) to not be stale');

  const t3 = context.beginAssessDateGeneration();
  check('3: the LATEST token is never stale, checked immediately', context.isAssessDateGenerationStale(t3) === false,
    'expected the most recently minted token to never be stale');
  check('3: all earlier tokens are stale relative to the latest', context.isAssessDateGenerationStale(t1) === true && context.isAssessDateGenerationStale(t2) === true,
    'expected both t1 and t2 to be stale once t3 exists');

  // Monotonic across many calls — only the very last one survives.
  let lastToken = null;
  const earlierTokens = [];
  for (let i = 0; i < 20; i++) {
    if (lastToken !== null) earlierTokens.push(lastToken);
    lastToken = context.beginAssessDateGeneration();
  }
  const allEarlierAreStale = earlierTokens.every(tok => context.isAssessDateGenerationStale(tok) === true);
  check('4: monotonic over many calls — every earlier token is stale, only the latest is not',
    allEarlierAreStale && context.isAssessDateGenerationStale(lastToken) === false,
    'expected exactly one non-stale token (the latest) after 20 sequential calls');
}
// Mutation negative control — stop the counter from incrementing.
{
  const target = 'function beginAssessDateGeneration() { return ++_assessDateGen; }';
  const sabotaged = SOURCE.replace(target, 'function beginAssessDateGeneration() { return _assessDateGen; }');
  if (sabotaged === SOURCE) {
    check('mutation setup: sabotage replace found beginAssessDateGeneration\'s body', false,
      'body text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx } = load(sabotaged);
    const oldTok = sabotagedCtx.beginAssessDateGeneration();
    const newTok = sabotagedCtx.beginAssessDateGeneration();
    check('mutation control: a non-incrementing counter wrongly reports the earlier token as fresh',
      sabotagedCtx.isAssessDateGenerationStale(oldTok) === false,
      'expected the sabotaged (non-incrementing) counter to fail to distinguish an older token from the latest — if this fails, incrementing may not be doing anything');
  }
}

// =============================================================================
// Test 5: source-contract — position(early return)
//       < position(beginAssessDateGeneration() call)
//       < position(first await)
// Static text-order assertion, not runtime behavior: the token MUST be
// captured before the function's first suspension point, or a call could
// already be mid-await before it even has a token to compare against later.
// =============================================================================
{
  const fnBlock = extractBlockFrom(APP_JS, 'async function populateAssessDateDropdown(patientId, opts = {}) {');
  const earlyReturnIdx = fnBlock.indexOf("if (!sel || sel.tagName !== 'SELECT') return;");
  const beginGenIdx = fnBlock.indexOf('const myGen = beginAssessDateGeneration();');
  const firstAwaitIdx = fnBlock.indexOf('await ');

  check('5 setup: early-return line found', earlyReturnIdx !== -1, 'the early-return guard text has changed — update this test');
  check('5 setup: beginAssessDateGeneration() call found', beginGenIdx !== -1, 'the token-capture line text has changed — update this test');
  check('5 setup: an await exists in the function', firstAwaitIdx !== -1, 'expected at least one await in populateAssessDateDropdown');

  check('5: early-return precedes the token capture', earlyReturnIdx < beginGenIdx,
    `expected the !sel early return (index ${earlyReturnIdx}) before beginAssessDateGeneration() (index ${beginGenIdx})`);
  check('5: token capture precedes the first await', beginGenIdx < firstAwaitIdx,
    `expected beginAssessDateGeneration() (index ${beginGenIdx}) before the first await (index ${firstAwaitIdx}) — a token captured after suspending would miss the race window it exists to guard`);
}

// =============================================================================
// Test 6: sel.value === '__other__' AND #assess-date-input exists → true
// =============================================================================
{
  const { context } = load(); // default stub seeds assess-date-input
  const sel = { value: '__other__' };
  check('6: Other mode with a live #assess-date-input reports true', context.isAssessmentDateOtherMode(sel) === true,
    'expected sel.value === \'__other__\' plus an existing input to report Other mode');
}

// =============================================================================
// Test 7: sel.value === '__other__' but #assess-date-input does NOT exist → false
// Mutation: revert to the old single-signal check (sel.value alone) —
// Test 7 must flip to wrongly report true.
// =============================================================================
{
  const { context } = load(undefined, ['assess-date-input']); // D-1 lesson: element genuinely absent, not just empty
  const sel = { value: '__other__' };
  check('7: Other mode with sel.value===\'__other__\' but no #assess-date-input reports false', context.isAssessmentDateOtherMode(sel) === false,
    'expected the two-signal check to require the input element to actually exist, not just trust sel.value');
}
{
  const target = "function isAssessmentDateOtherMode(sel) {\n  return sel?.value === '__other__' && !!document.getElementById('assess-date-input');\n}";
  const sabotaged = SOURCE.replace(target, "function isAssessmentDateOtherMode(sel) {\n  return sel?.value === '__other__';\n}");
  if (sabotaged === SOURCE) {
    check('7 mutation setup: sabotage replace found isAssessmentDateOtherMode\'s body', false,
      'body text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx } = load(sabotaged, ['assess-date-input']);
    const sel = { value: '__other__' };
    check('7 (negative control): reverting to the single-signal (sel.value-only) check wrongly reports Other mode with no input element',
      sabotagedCtx.isAssessmentDateOtherMode(sel) === true,
      'expected the single-signal regression to wrongly return true when #assess-date-input is absent — if this fails, Test 7 may not have discriminating power');
  }
}

console.log();
if (failures > 0) {
  console.log(`${failures} assess-date async-guard contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All assess-date async-guard contract checks passed.');
  process.exit(0);
}
