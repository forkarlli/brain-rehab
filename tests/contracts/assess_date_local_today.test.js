#!/usr/bin/env node
'use strict';
// COMMIT A (CLIENT_DATE_DEFAULT_FIXED) — acceptance contract.
//
// new Date().toISOString().slice(0,10) / .split('T')[0] compute the UTC
// calendar date, not the user's local one. For a timezone ahead of UTC (e.g.
// Taiwan, UTC+8), during local early-morning hours this yields YESTERDAY's
// date. Fixed by getLocalTodayDateString(), which reads getFullYear/
// getMonth/getDate (local-timezone-aware) instead of converting through UTC.
//
// This file tests:
//   - getLocalTodayDateString() itself: format contract + a source-contract
//     check that it does NOT use toISOString (would silently regress to the
//     UTC bug), with a mutation control proving that check has power.
//   - source-contract: the three in-scope call sites (Other-input create,
//     Other-input repair, State A custom "today") all call
//     getLocalTodayDateString(), not toISOString().
//   - runtime: populateAssessDateDropdown's State B (sessions.length > 0)
//     option list always includes local-today, even when it is absent from
//     both sessionDates and assessDates — driven against the REAL function
//     body with only the fetch/await block substituted for a synchronous
//     stub (the fetch itself needs a browser; this test's concern is the
//     allDates construction that runs after it, same manual-verification
//     boundary this repo already draws elsewhere for fetch-heavy paths).
//   - confirms sessions[0].date (the pre-selected default) is unchanged —
//     the PM's explicit decision was to add today as an option, not force
//     it as the default when sessions exist.
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
// fromIndex is idx + startLineText.length - 1 (the marker's OWN last
// character) — populateAssessDateDropdown's signature has an early,
// irrelevant brace pair (`opts = {}`) that would otherwise be matched first.
function extractBlockFrom(text, startLineText) {
  const idx = text.indexOf(startLineText);
  if (idx === -1) throw new Error('start marker not found: ' + startLineText);
  const end = matchBraceBlock(text, idx + startLineText.length - 1);
  return text.slice(idx, end);
}

// =============================================================================
// Part 1: getLocalTodayDateString() — format + source-contract
// =============================================================================
const HELPER_SLICE = extractBlockFrom(APP_JS, 'function getLocalTodayDateString() {');
if (!HELPER_SLICE.includes('function getLocalTodayDateString')) {
  throw new Error('getLocalTodayDateString not found — update this test.');
}

{
  const context = vm.createContext({});
  vm.runInContext(HELPER_SLICE, context);
  const result = context.getLocalTodayDateString();
  check('1: getLocalTodayDateString() returns a YYYY-MM-DD string', /^\d{4}-\d{2}-\d{2}$/.test(result),
    `expected a YYYY-MM-DD shape, got ${JSON.stringify(result)}`);

  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  check('1: matches local getFullYear/getMonth/getDate composed directly', result === expected,
    `expected ${expected} (from local Date components), got ${result}`);
}

check('2: getLocalTodayDateString does not call toISOString (would reintroduce the UTC bug)',
  !HELPER_SLICE.includes('toISOString'),
  'expected no toISOString() call inside getLocalTodayDateString');

{
  const target = 'function getLocalTodayDateString() {\n  const d = new Date();\n  const y = d.getFullYear();\n  const m = String(d.getMonth() + 1).padStart(2, \'0\');\n  const day = String(d.getDate()).padStart(2, \'0\');\n  return `${y}-${m}-${day}`;\n}';
  const sabotaged = HELPER_SLICE.replace(target, 'function getLocalTodayDateString() {\n  return new Date().toISOString().slice(0, 10);\n}');
  if (sabotaged === HELPER_SLICE) {
    check('2 mutation setup: sabotage replace found getLocalTodayDateString\'s body', false,
      'body text has changed — update the sabotage string in this test');
  } else {
    check('2 (negative control): reverting to a toISOString-based body is caught by the source-contract check',
      sabotaged.includes('toISOString'),
      'expected the sabotaged (UTC-based) body to contain toISOString — if this fails, the mutation itself is broken, not the check');
  }
}

// =============================================================================
// Part 2: source-contract — the three in-scope call sites use the helper,
// not a raw toISOString() computation.
// =============================================================================
{
  const otherCreateBlock = extractBlockFrom(APP_JS, 'function setAssessDateOtherInputMode(mode) {');
  check('3: setAssessDateOtherInputMode contains no toISOString call at all',
    !otherCreateBlock.includes('toISOString'),
    'expected both the create and repair defaults to use getLocalTodayDateString(), not toISOString()');
  check('3: setAssessDateOtherInputMode calls getLocalTodayDateString at least twice (create + repair)',
    (otherCreateBlock.match(/getLocalTodayDateString\(\)/g) || []).length === 2,
    'expected exactly two getLocalTodayDateString() call sites (create-branch, repair-branch)');
}
{
  const populateBlock = extractBlockFrom(APP_JS, 'async function populateAssessDateDropdown(patientId, opts = {}) {');
  check('4: populateAssessDateDropdown contains no toISOString call at all',
    !populateBlock.includes('toISOString'),
    'expected both the State A "today" default and the State B allDates injection to use getLocalTodayDateString()');
  check('4: allDates construction includes getLocalTodayDateString() in the Set',
    populateBlock.includes('[...sessionDates, ...assessDates, getLocalTodayDateString()]'),
    'expected local-today to be unconditionally included in the allDates Set');
  check('4: sessions[0].date pre-selection is unchanged (PM decision: option-list only, not forced default)',
    populateBlock.includes('if (!wasOther) sel.value = sessions[0].date;'),
    'expected the pre-selected default to remain sessions[0].date, not getLocalTodayDateString()');
}

// =============================================================================
// Part 3: runtime — State B's allDates always contains local-today, driven
// against the real function body with the fetch/await block substituted for
// a synchronous stub (documented boundary: the fetch call itself still needs
// a browser / manual verification, same as this repo's other async DOM
// functions).
// =============================================================================
const FETCH_BLOCK = `  let sessions = [];
  if (patientId) {
    try {
      const res = await fetch('/api/therapy-sessions?patientId=' + encodeURIComponent(patientId));
      const data = await res.json();
      if (Array.isArray(data.sessions)) sessions = data.sessions;
    } catch (e) {
      console.error('載入訓練記錄日期失敗:', e);
    }
  }`;
const SYNC_STUB = '  let sessions = __TEST_sessions || [];';

function buildSyncSource() {
  const fnBlock = extractBlockFrom(APP_JS, 'async function populateAssessDateDropdown(patientId, opts = {}) {');
  if (!fnBlock.includes(FETCH_BLOCK)) {
    throw new Error('FETCH_BLOCK text not found in populateAssessDateDropdown — update this test\'s FETCH_BLOCK constant.');
  }
  const withoutAsync = fnBlock.replace('async function populateAssessDateDropdown', 'function populateAssessDateDropdown');
  return withoutAsync.replace(FETCH_BLOCK, SYNC_STUB);
}

const SYNC_SOURCE = HELPER_SLICE + '\n' +
  "function isAssessDateGenerationStale() { return false; }\n" +
  "function beginAssessDateGeneration() { return 1; }\n" +
  "function isAssessmentDateOtherMode() { return false; }\n" +
  "function setAssessDateOtherInputMode() {}\n" +
  buildSyncSource();

function makeSelectStub(initialOptions) {
  const el = {
    tagName: 'SELECT',
    value: '',
    innerHTML: '',
    style: {},
    _options: initialOptions || [],
    closest: () => ({ style: {} }),
    appendChild(opt) { el._options.push(opt.value); },
  };
  return el;
}

function load(DB) {
  const sel = makeSelectStub();
  const custom = { value: '', innerHTML: '', closest: () => ({ style: {} }) };
  const registry = { 'assess-date': sel, 'assess-date-custom': custom };
  const sandbox = {
    document: {
      getElementById: id => registry[id] || null,
      createElement: () => ({ value: '', textContent: '' }),
    },
    DB,
    console,
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(SYNC_SOURCE, context);
  return { context, sel, custom };
}

{
  const DB = { assessments: [] };
  const { context, sel } = load(DB);
  const testSessions = [{ date: '2026-07-20' }, { date: '2026-07-18' }];
  context.__TEST_sessions = testSessions;
  context.populateAssessDateDropdown('P1', {});

  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  check('5: local-today is present in the rendered #assess-date options even though absent from sessions/assessments',
    sel.innerHTML.includes(`value="${localToday}"`),
    `expected an option for ${localToday} in: ${sel.innerHTML}`);
  check('5: the pre-selected sel.value is still sessions[0].date, not local-today',
    sel.value === '2026-07-20',
    `expected sel.value to remain sessions[0].date (2026-07-20), got ${sel.value}`);
}

{
  // today already coincides with a real session date — must not duplicate.
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const DB = { assessments: [] };
  const { context, sel } = load(DB);
  context.__TEST_sessions = [{ date: localToday }, { date: '2026-01-01' }];
  context.populateAssessDateDropdown('P1', {});
  const occurrences = (sel.innerHTML.match(new RegExp(`value="${localToday}"`, 'g')) || []).length;
  check('6: local-today is not duplicated when it already coincides with a session date',
    occurrences === 1, `expected exactly one option for ${localToday}, found ${occurrences}`);
}

console.log();
if (failures > 0) {
  console.log(`${failures} assess-date local-today contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All assess-date local-today contract checks passed.');
  process.exit(0);
}
