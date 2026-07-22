#!/usr/bin/env node
'use strict';
// P0-A1: BCF naked-fetch false-success hotfix — acceptance contract.
//
// Before this fix, saveBCFAssessment() did `DB.bcfDiagnoses.unshift(bcfRec)`
// BEFORE an un-checked `await fetch('/api/bcf-diagnoses', ...)` with no
// try/catch and no response inspection at all (see Phase 1 recon). A 503
// (Mongo down) or a network reject was indistinguishable from success to
// the calling code, and a reject would abort the whole async function,
// silently swallowing the MTT record's own success/failure report too.
//
// This file tests the two pieces that fix that, extracted verbatim from
// app.js (not reimplemented) via the same source-slicing technique as
// fastigial_form_pipeline_boundary.test.js and genid_tier_fallback.test.js:
//
//   - resolveSaveOutcomeMessage(mttOutcome, bcfOutcome): pure function,
//     the six PM/ChatGPT/Gemini-approved message strings, exhaustively
//     tested (no DOM dependency at all).
//
//   - _saveBcfDiagnosisRecord(bcfRec, fetchImpl): the BCF fetch-gate +
//     DB.bcfDiagnoses mutation, deliberately extracted out of
//     saveBCFAssessment() so it has no document.getElementById dependency
//     and can be fault-injected here with a fake fetchImpl. This is what
//     makes tests A1/A2/A3/A4 (503 / reject / 2xx / negative control)
//     possible without a jsdom dependency this project doesn't have.
//
// saveBCFAssessment() itself is NOT tested here — it still builds bcfRec
// from ~20 form fields via document.getElementById, same reason the FP
// contract test gives for not driving that class of function end-to-end.
// See the report text for the manual-browser test steps that cover the
// full function.
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

const START_MARKER = '// ===== P0-A1: BCF naked-fetch false-success hotfix =====';
const END_MARKER = 'async function saveBCFAssessment()';

function extractSource() {
  const startIdx = APP_JS.indexOf(START_MARKER);
  if (startIdx === -1) throw new Error('START_MARKER not found — P0-A1 block header changed, update this test.');
  const endIdx = APP_JS.indexOf(END_MARKER, startIdx);
  if (endIdx === -1) throw new Error('END_MARKER not found after P0-A1 block — update this test.');
  const src = APP_JS.slice(startIdx, endIdx);
  if (!src.includes('function resolveSaveOutcomeMessage')) {
    throw new Error('resolveSaveOutcomeMessage not found inside extracted block.');
  }
  if (!src.includes('async function _saveBcfDiagnosisRecord')) {
    throw new Error('_saveBcfDiagnosisRecord not found inside extracted block.');
  }
  return src;
}

const SOURCE = extractSource();

function makeMockConsole() {
  const calls = { warn: [], error: [] };
  return {
    console: {
      warn: (...a) => calls.warn.push(a),
      error: (...a) => calls.error.push(a),
      log: () => {},
    },
    calls,
  };
}

// Fresh vm context per test = fresh DB.bcfDiagnoses, matching one page load.
function load(sourceOverride) {
  const { console: mockConsole, calls } = makeMockConsole();
  const sandbox = {
    console: mockConsole,
    DB: { bcfDiagnoses: [] },
    fetch: () => { throw new Error('global fetch must not be called — pass fetchImpl explicitly in every test'); },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(sourceOverride || SOURCE, context);
  return { context, calls, DB: sandbox.DB };
}

function fakeResponse({ ok, status, body }) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

// Wrapped in an async IIFE: several test blocks below use `await` against
// _saveBcfDiagnosisRecord (an async function), and this file is loaded as
// CommonJS (no "type":"module" in package.json) — top-level await isn't
// valid there, so the whole body runs inside one async main().
(async () => {

// =============================================================================
// resolveSaveOutcomeMessage: exhaustive 6-combination + invalid-combo test
// =============================================================================
{
  const { context } = load();
  const cases = [
    ['PASS', 'PASS', '肌肉張力測試與 BCF 腦區判斷均已儲存。', 'success'],
    ['PASS', 'FAIL', '肌肉張力測試已儲存；BCF 腦區判斷儲存失敗，請重新嘗試。', 'error'],
    ['FAIL', 'PASS', 'BCF 腦區判斷已儲存；肌肉張力測試儲存失敗，請重新嘗試。', 'error'],
    ['FAIL', 'FAIL', '肌肉張力測試與 BCF 腦區判斷皆儲存失敗，請重新嘗試。', 'error'],
    ['PASS', 'NOT_ATTEMPTED', '肌肉張力測試已儲存。', 'success'],
    ['FAIL', 'NOT_ATTEMPTED', '肌肉張力測試儲存失敗，請重新嘗試。', 'error'],
  ];
  for (const [mtt, bcf, expectedText, expectedSeverity] of cases) {
    const result = context.resolveSaveOutcomeMessage(mtt, bcf);
    check(`resolveSaveOutcomeMessage(${mtt}, ${bcf}) text matches PM-approved wording exactly`,
      result.text === expectedText,
      `expected "${expectedText}", got "${result.text}"`);
    check(`resolveSaveOutcomeMessage(${mtt}, ${bcf}) severity is '${expectedSeverity}'`,
      result.severity === expectedSeverity,
      `expected severity '${expectedSeverity}', got '${result.severity}'`);
  }

  let threw = false;
  try { context.resolveSaveOutcomeMessage('PASS', 'BOGUS'); } catch (e) { threw = true; }
  check('resolveSaveOutcomeMessage throws on an unmapped combination rather than guessing a message',
    threw, 'expected a thrown error for an invalid outcome combination, but it returned normally');
}

// =============================================================================
// A1: /api/bcf-diagnoses returns 503 (Mongo not ready)
// =============================================================================
{
  const { context, DB } = load();
  const fetch503 = async () => fakeResponse({ ok: false, status: 503, body: { error: 'DB not ready' } });
  const outcome = await context._saveBcfDiagnosisRecord({ id: 'BCF999', patientId: 'P1' }, fetch503);
  check('A1: outcome is FAIL on 503', outcome === 'FAIL', `expected 'FAIL', got '${outcome}'`);
  check('A1: DB.bcfDiagnoses stays empty (no ghost record)', DB.bcfDiagnoses.length === 0,
    `expected 0 records, got ${DB.bcfDiagnoses.length}`);
}

// =============================================================================
// A2: fetch rejects (network down) — must not throw, must not abort caller
// =============================================================================
{
  const { context, DB } = load();
  const fetchReject = async () => { throw new Error('simulated network failure'); };
  let threw = false;
  let outcome;
  try {
    outcome = await context._saveBcfDiagnosisRecord({ id: 'BCF998', patientId: 'P1' }, fetchReject);
  } catch (e) {
    threw = true;
  }
  check('A2: _saveBcfDiagnosisRecord does not throw on fetch reject', !threw,
    'a rejected fetch propagated out of _saveBcfDiagnosisRecord instead of being caught');
  check('A2: outcome is FAIL on reject', !threw && outcome === 'FAIL', `expected 'FAIL', got '${outcome}'`);
  check('A2: DB.bcfDiagnoses stays empty (no ghost record)', DB.bcfDiagnoses.length === 0,
    `expected 0 records, got ${DB.bcfDiagnoses.length}`);
}

// =============================================================================
// A3: normal 2xx with a diagnosis body — record enters DB.bcfDiagnoses
// =============================================================================
{
  const { context, DB } = load();
  const bcfRec = { id: 'BCF001', patientId: 'P1', type: 'BCF腦區判斷' };
  const fetchOk = async () => fakeResponse({ ok: true, status: 200, body: { diagnosis: { _id: 'BCF001' } } });
  const outcome = await context._saveBcfDiagnosisRecord(bcfRec, fetchOk);
  check('A3: outcome is PASS on 2xx with diagnosis body', outcome === 'PASS', `expected 'PASS', got '${outcome}'`);
  check('A3: DB.bcfDiagnoses contains exactly the saved record', DB.bcfDiagnoses.length === 1 && DB.bcfDiagnoses[0] === bcfRec,
    `expected DB.bcfDiagnoses to contain bcfRec, got ${JSON.stringify(DB.bcfDiagnoses)}`);
}

// =============================================================================
// A3b: 200 OK but body has no `diagnosis` key — must NOT be treated as success
// (defends the "check response body too" requirement, not just res.ok)
// =============================================================================
{
  const { context, DB } = load();
  const fetchOkNoDiagnosis = async () => fakeResponse({ ok: true, status: 200, body: {} });
  const outcome = await context._saveBcfDiagnosisRecord({ id: 'BCF997' }, fetchOkNoDiagnosis);
  check('A3b: a 200 response without a `diagnosis` body is treated as FAIL, not PASS',
    outcome === 'FAIL', `expected 'FAIL', got '${outcome}'`);
  check('A3b: DB.bcfDiagnoses stays empty', DB.bcfDiagnoses.length === 0,
    `expected 0 records, got ${DB.bcfDiagnoses.length}`);
}

// =============================================================================
// A4: mutation negative control. Sabotage the gate so it always reports
// success regardless of the response, then confirm A1/A2-equivalent
// assertions flip from PASS to FAIL — proving those tests actually have
// discriminating power and are not just passing by construction.
// =============================================================================
{
  const sabotaged = SOURCE.replace(
    'if (bcfResp.ok && bcfData && bcfData.diagnosis) {',
    'if (true) {'
  );
  if (sabotaged === SOURCE) {
    check('A4 setup: sabotage replace found the target line', false,
      'the gate condition text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx, DB: sabotagedDB } = load(sabotaged);
    const outcome503 = await sabotagedCtx._saveBcfDiagnosisRecord(
      { id: 'BCF-sabotage-1' },
      async () => fakeResponse({ ok: false, status: 503, body: { error: 'DB not ready' } })
    );
    check('A4: sabotaged gate flips A1-equivalent (503) from FAIL to PASS — negative control confirms the real gate has discriminating power',
      outcome503 === 'PASS', `expected sabotage to flip outcome to 'PASS', got '${outcome503}' (if this fails, the gate itself may be unconditional even in the real code)`);
    check('A4: sabotaged gate also lets the ghost record into DB.bcfDiagnoses on a 503',
      sabotagedDB.bcfDiagnoses.length === 1,
      `expected the sabotaged version to leak a ghost record into DB.bcfDiagnoses, got ${sabotagedDB.bcfDiagnoses.length}`);
  }
}

console.log();
if (failures > 0) {
  console.log(`${failures} BCF diagnosis save gate contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All BCF diagnosis save gate contract checks passed.');
  process.exit(0);
}

})();
