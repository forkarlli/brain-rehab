#!/usr/bin/env node
'use strict';
// DATE_PATIENT_SWITCH_ENTRY_COVERAGE_GAP — acceptance contract.
//
// #sessionPatientFilter and #reportPatientFilter change the assessment
// patient context (they sync #assess-patient-select) but never called
// setAssessDateOtherInputMode('NORMAL') or populateAssessDateDropdown() —
// only #assess-patient-select and #global-patient-select's own handlers did,
// by duplicating both calls directly. Fixed by moving the date-reset pair
// into onAssessmentPatientContextChanged() itself (already the single entry
// point all four patient-context handlers call for the BTracks-domain
// reset), and removing the now-redundant direct calls from the two handlers
// that used to have them.
//
// resetMode: true is mandatory on the populate call — its absence is exactly
// what let a stale sel.value === '__other__' resurrect Other mode for the
// new patient (Phase 1's wasOther/resetMode design, already covered by
// assess_date_input_lifecycle.test.js).
//
// This file tests:
//   - the orchestrator's date-reset wiring, driven for real against the
//     actual setAssessDateOtherInputMode() (DOM-only, no async/fetch — safe
//     to run directly), with _resetBTracksTabState/_resetBTracksModalState/
//     populateAssessDateDropdown stubbed as call-recording spies (this
//     file's concern is the date wiring, not re-verifying BTracks reset
//     internals — already covered by btracks_ownership_reset.test.js — or
//     driving the real async/fetch-based populateAssessDateDropdown, which
//     needs a browser, same boundary this suite already draws elsewhere)
//   - a source-contract assertion that the two previously-duplicating
//     handlers no longer contain the specific direct calls that used to be
//     there
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
// character) — safe as long as the marker itself contains no earlier braces.
function extractBlockFrom(text, startLineText) {
  const idx = text.indexOf(startLineText);
  if (idx === -1) throw new Error('start marker not found: ' + startLineText);
  const end = matchBraceBlock(text, idx + startLineText.length - 1);
  return text.slice(idx, end);
}

// ---- runtime slice: the real setAssessDateOtherInputMode + the real
// onAssessmentPatientContextChanged, with the heavy dependencies
// (_resetBTracksTabState/_resetBTracksModalState/populateAssessDateDropdown)
// provided as call-recording stubs appended afterward, in the SAME
// vm.runInContext call. Since those three are not declared anywhere in this
// slice, the stubs become their only binding. ----
const SET_MODE_SLICE = extractBlockFrom(APP_JS, 'function setAssessDateOtherInputMode(mode) {');
const ORCHESTRATOR_SLICE = extractBlockFrom(APP_JS, '// ===== P0-0 / DATE_PATIENT_SWITCH_ENTRY_COVERAGE_GAP: patient-context change');
const BASE_SOURCE = SET_MODE_SLICE + '\n' + ORCHESTRATOR_SLICE;

if (!BASE_SOURCE.includes('function setAssessDateOtherInputMode')) throw new Error('setAssessDateOtherInputMode not found — update this test.');
if (!BASE_SOURCE.includes('function onAssessmentPatientContextChanged')) throw new Error('onAssessmentPatientContextChanged not found — update this test.');
if (!BASE_SOURCE.includes("setAssessDateOtherInputMode('NORMAL');\n  populateAssessDateDropdown(newPatientId, { resetMode: true });")) {
  throw new Error('the date-reset pair is not where this test expects it inside onAssessmentPatientContextChanged — update this test.');
}

const SPY_SHIMS = `
let __calls = [];
function _resetBTracksTabState() { __calls.push(['resetTab']); }
function _resetBTracksModalState() { __calls.push(['resetModal']); }
function populateAssessDateDropdown(patientId, opts) { __calls.push(['populate', patientId, opts]); }
function __TEST_getCalls() { return __calls; }
function __TEST_setPreviousContext(v) { _previousAssessmentContextPatientId = v; }
function __TEST_getPreviousContext() { return _previousAssessmentContextPatientId; }
`;
const SOURCE = BASE_SOURCE + '\n' + SPY_SHIMS;

function load(sourceOverride, excludeIds) {
  const excluded = new Set(excludeIds || []);
  const registry = {};
  if (!excluded.has('assess-date-input')) {
    const el = { id: 'assess-date-input', value: '2026-07-20' };
    el.remove = () => { if (registry['assess-date-input'] === el) delete registry['assess-date-input']; };
    registry['assess-date-input'] = el;
  }
  const sandbox = {
    document: {
      getElementById: id => registry[id] || null,
      activeElement: null,
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(sourceOverride || SOURCE, context);
  return { context, registry };
}

// =============================================================================
// 1: a genuine patient switch runs the full pair — date reset (real
// setAssessDateOtherInputMode('NORMAL'), observably removing a live
// #assess-date-input) AND the BTracks-domain resets, via the same
// orchestrator call.
// =============================================================================
{
  const { context, registry } = load();
  context.onAssessmentPatientContextChanged('P_B');
  check('1: setAssessDateOtherInputMode(\'NORMAL\') really ran — #assess-date-input was removed',
    !registry['assess-date-input'],
    'expected the leftover Other-mode input to be removed by the real setAssessDateOtherInputMode call');
  const calls = context.__TEST_getCalls();
  check('1: populateAssessDateDropdown was called with the new patientId and resetMode:true',
    calls.some(c => c[0] === 'populate' && c[1] === 'P_B' && c[2] && c[2].resetMode === true),
    `expected a populate('P_B', {resetMode:true}) call, got ${JSON.stringify(calls)}`);
  check('1: _resetBTracksTabState was still called (date fix must not regress BTracks reset)',
    calls.some(c => c[0] === 'resetTab'), 'expected the existing BTracks tab reset to still run');
  check('1: _resetBTracksModalState was still called', calls.some(c => c[0] === 'resetModal'),
    'expected the existing BTracks modal reset to still run');
}

// =============================================================================
// 2: newPatientId === '' is still a no-op for the date pair too (not just BTracks)
// =============================================================================
{
  const { context, registry } = load();
  context.onAssessmentPatientContextChanged('');
  check('2: no calls at all for an empty newPatientId', context.__TEST_getCalls().length === 0,
    `expected zero calls, got ${JSON.stringify(context.__TEST_getCalls())}`);
  check('2: #assess-date-input is untouched', !!registry['assess-date-input'],
    'expected the Other-mode input to survive an empty newPatientId');
}

// =============================================================================
// 3: unchanged context (same patient announced twice) is still a no-op —
// the date pair must not fire redundantly either.
// =============================================================================
{
  const { context } = load();
  context.onAssessmentPatientContextChanged('P_A');
  const callsAfterFirst = context.__TEST_getCalls().length;
  context.onAssessmentPatientContextChanged('P_A');
  check('3: re-announcing the same patient makes no additional calls',
    context.__TEST_getCalls().length === callsAfterFirst,
    `expected no new calls, had ${callsAfterFirst} before, ${context.__TEST_getCalls().length} after`);
}

// =============================================================================
// 4: resetMode:true specifically — dedicated check per the PM's ⚠️, since its
// absence is what resurrects Other mode (Phase 1 finding), not a detail to
// bundle silently into test 1's broader assertion.
// =============================================================================
{
  const { context } = load();
  context.onAssessmentPatientContextChanged('P_C');
  const populateCall = context.__TEST_getCalls().find(c => c[0] === 'populate');
  check('4: the populate call\'s opts is exactly { resetMode: true }', populateCall && populateCall[2] && populateCall[2].resetMode === true,
    `expected opts.resetMode === true, got ${JSON.stringify(populateCall && populateCall[2])}`);
}

// =============================================================================
// 5 (D-1 lesson): #assess-date-input absent — orchestrator must not throw.
// =============================================================================
{
  const { context: ctxNoInput } = load(undefined, ['assess-date-input']);
  let threw = false;
  try { ctxNoInput.onAssessmentPatientContextChanged('P_D'); } catch (e) { threw = true; }
  check('5: orchestrator does not throw when #assess-date-input never existed', !threw,
    'expected the orchestrator to tolerate a never-created Other-mode input, it threw instead');
}

// =============================================================================
// 6 (source-contract): the two previously-duplicating handlers no longer
// contain the specific direct calls that used to be there.
// =============================================================================
{
  const assessPatientSelectBlock = extractBlockFrom(APP_JS, "document.getElementById('assess-patient-select')?.addEventListener('change', () => {");
  check('6 (assess-patient-select): no direct setAssessDateOtherInputMode(\'NORMAL\') call',
    !assessPatientSelectBlock.includes("setAssessDateOtherInputMode('NORMAL')"),
    'expected the duplicate direct call to be gone — date reset is now the orchestrator\'s job');
  check('6 (assess-patient-select): no direct populateAssessDateDropdown(pid call',
    !assessPatientSelectBlock.includes('populateAssessDateDropdown(pid'),
    'expected the duplicate direct populate() call to be gone');
  check('6 (assess-patient-select): still calls the orchestrator',
    assessPatientSelectBlock.includes('onAssessmentPatientContextChanged(pid)'),
    'expected the handler to still delegate to the orchestrator');

  const globalPatientSelectBlock = extractBlockFrom(APP_JS, "document.getElementById('global-patient-select')");
  check('6 (global-patient-select): no direct setAssessDateOtherInputMode(\'NORMAL\') call',
    !globalPatientSelectBlock.includes("setAssessDateOtherInputMode('NORMAL')"),
    'expected the duplicate direct call to be gone');
  check('6 (global-patient-select): no direct populateAssessDateDropdown(currentGlobalPatientId call',
    !globalPatientSelectBlock.includes('populateAssessDateDropdown(currentGlobalPatientId'),
    'expected the duplicate direct populate() call to be gone');
  check('6 (global-patient-select): still calls the orchestrator',
    globalPatientSelectBlock.includes('onAssessmentPatientContextChanged(currentGlobalPatientId)'),
    'expected the handler to still delegate to the orchestrator');
}

console.log();
if (failures > 0) {
  console.log(`${failures} date patient-context coverage contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All date patient-context coverage contract checks passed.');
  process.exit(0);
}
