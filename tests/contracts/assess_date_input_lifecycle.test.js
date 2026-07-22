#!/usr/bin/env node
'use strict';
// ASSESS_DATE_STATE_INTEGRITY — Phase 1 acceptance contract.
//
// Before this fix, the dynamically-created #assess-date-input element was
// only ever created (11247, original line numbers) and value-cleared
// (251-252, saveAssessmentToServer), never removed. Because the creation
// site guarded on `if (!existingInput)`, a cleared-but-still-present
// element silently blocked its own rebuild the next time the user re-entered
// Other mode — it came back empty instead of defaulting to today
// (ASSESS_DATE_SENTINEL). It also survived patient switches untouched,
// since nothing else in the codebase called .remove() on it.
//
// This file tests setAssessDateOtherInputMode(mode), extracted verbatim from
// app.js (not reimplemented) via the same source-slicing technique as
// bcf_diagnosis_save_gate.test.js and genid_tier_fallback.test.js.
//
// setAssessDateOtherInputMode is DOM-shaped (getElementById / closest /
// createElement / appendChild / remove / activeElement) but the surface it
// touches is small and enumerable, so it's driven here with a hand-rolled
// minimal fake `document` rather than jsdom (this project has no jsdom
// dependency — see the same rationale in bcf_diagnosis_save_gate.test.js).
//
// The four call sites that now invoke this helper (the assess-date change
// listener's Other/Normal branches, the two patient-switch handlers, and
// populateAssessDateDropdown's own tail sync) are NOT driven end-to-end
// here — same reason saveBCFAssessment() itself isn't: they need a real
// document and user-event sequence. See the report text for the manual
// browser verification steps that cover the wiring.
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

const START_MARKER = '// ===== ASSESS_DATE_STATE_INTEGRITY: assess-date-input lifecycle helper (Phase 1) =====';
const END_MARKER = 'async function populateAssessDateDropdown';

function extractSource() {
  const startIdx = APP_JS.indexOf(START_MARKER);
  if (startIdx === -1) throw new Error('START_MARKER not found — helper block header changed, update this test.');
  const endIdx = APP_JS.indexOf(END_MARKER, startIdx);
  if (endIdx === -1) throw new Error('END_MARKER not found after helper block — update this test.');
  const src = APP_JS.slice(startIdx, endIdx);
  if (!src.includes('function setAssessDateOtherInputMode')) {
    throw new Error('setAssessDateOtherInputMode not found inside extracted block.');
  }
  return src;
}

const SOURCE = extractSource();

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

// Minimal hand-rolled DOM stub. Models exactly what setAssessDateOtherInputMode
// touches — nothing more. `registry` is the fake getElementById backing store;
// appendChild registers a child under its own `.id`, mirroring real DOM
// behavior where an appended element becomes queryable by id.
function makeFakeDom(seedInput) {
  const registry = {};

  function makeFakeElement(fields) {
    const el = Object.assign({ id: '', type: '', className: '', value: '' }, fields);
    el.remove = () => { if (el.id && registry[el.id] === el) delete registry[el.id]; };
    return el;
  }

  const container = {
    appendChild(el) {
      if (el.id) registry[el.id] = el;
    },
  };
  const customEl = makeFakeElement({ id: 'assess-date-custom' });
  customEl.closest = (selector) => (selector === '.form-group' ? container : null);
  registry['assess-date-custom'] = customEl;

  if (seedInput) {
    registry['assess-date-input'] = makeFakeElement({ id: 'assess-date-input', value: seedInput.value });
  }

  const documentStub = {
    activeElement: null,
    getElementById: (id) => registry[id] || null,
    createElement: (tag) => {
      if (tag !== 'input') throw new Error(`unexpected createElement tag: ${tag}`);
      return makeFakeElement({});
    },
  };
  return { documentStub, registry };
}

function load(sourceOverride, seedInput) {
  const { documentStub, registry } = makeFakeDom(seedInput);
  const sandbox = { document: documentStub };
  const context = vm.createContext(sandbox);
  vm.runInContext(sourceOverride || SOURCE, context);
  return { context, document: documentStub, registry };
}

// =============================================================================
// 1: OTHER, element absent — creates it with a valid today value
// =============================================================================
{
  const { context, registry } = load();
  context.setAssessDateOtherInputMode('OTHER');
  const el = registry['assess-date-input'];
  check('1: OTHER creates #assess-date-input when absent', !!el,
    'expected assess-date-input to be created and registered, got nothing');
  check('1: created input has a valid YYYY-MM-DD value', !!el && DATE_SHAPE.test(el.value),
    `expected a YYYY-MM-DD value, got '${el && el.value}'`);
}

// =============================================================================
// 2: OTHER, element present with a valid value — left untouched
// =============================================================================
{
  const { context, registry } = load(null, { value: '2026-07-15' });
  const before = registry['assess-date-input'];
  context.setAssessDateOtherInputMode('OTHER');
  const after = registry['assess-date-input'];
  check('2: OTHER does not replace an existing valid input', after === before,
    'expected the same element reference, got a different one (unnecessary rebuild)');
  check('2: OTHER does not alter an existing valid value', after.value === '2026-07-15',
    `expected value to stay '2026-07-15', got '${after.value}'`);
}

// =============================================================================
// 3: OTHER, element present but value is '' — repaired in place (the sentinel case)
// =============================================================================
{
  const { context, registry } = load(null, { value: '' });
  const before = registry['assess-date-input'];
  context.setAssessDateOtherInputMode('OTHER');
  const after = registry['assess-date-input'];
  check('3: OTHER repairs an empty value in place (same element)', after === before,
    'expected the same element reference (repair, not remove+recreate), got a different one');
  check('3: OTHER repairs an empty value to a valid YYYY-MM-DD', DATE_SHAPE.test(after.value),
    `expected a repaired YYYY-MM-DD value, got '${after.value}'`);
}

// =============================================================================
// 3b: OTHER, element present with a non-date-shaped value — also repaired
// =============================================================================
{
  const { context, registry } = load(null, { value: '__other__' });
  context.setAssessDateOtherInputMode('OTHER');
  const after = registry['assess-date-input'];
  check('3b: OTHER repairs a non-YYYY-MM-DD value', DATE_SHAPE.test(after.value),
    `expected a repaired YYYY-MM-DD value, got '${after.value}'`);
}

// =============================================================================
// 4: NORMAL, element absent — no-op, no throw
// =============================================================================
{
  const { context, registry } = load();
  let threw = false;
  try { context.setAssessDateOtherInputMode('NORMAL'); } catch (e) { threw = true; }
  check('4: NORMAL on an absent input does not throw', !threw,
    'expected no-op, got a thrown error');
  check('4: NORMAL on an absent input leaves the registry empty', !registry['assess-date-input'],
    'expected assess-date-input to remain absent');
}

// =============================================================================
// 5: NORMAL, element present, not focused — removed
// =============================================================================
{
  const { context, registry, document } = load(null, { value: '2026-07-15' });
  document.activeElement = null;
  context.setAssessDateOtherInputMode('NORMAL');
  check('5: NORMAL removes an unfocused existing input', !registry['assess-date-input'],
    `expected assess-date-input to be removed, got ${JSON.stringify(registry['assess-date-input'])}`);
}

// =============================================================================
// 6: NORMAL, element present AND is document.activeElement — NOT removed
// (the focus guard from the design proposal, Q2's second layer of defense)
// =============================================================================
{
  const { context, registry, document } = load(null, { value: '2026-07-15' });
  document.activeElement = registry['assess-date-input'];
  context.setAssessDateOtherInputMode('NORMAL');
  check('6: NORMAL does not remove a focused existing input', !!registry['assess-date-input'],
    'expected the focused input to survive, but it was removed');
  check('6: NORMAL does not alter a focused input\'s value', registry['assess-date-input'].value === '2026-07-15',
    `expected value to stay '2026-07-15', got '${registry['assess-date-input'] && registry['assess-date-input'].value}'`);
}

// =============================================================================
// 7: mutation negative control. Sabotage the repair-in-place condition so it
// never fires (reverting to the pre-fix behavior: existing-but-invalid values
// are left alone), then confirm test 3's assertion flips from PASS to FAIL —
// proving test 3 has discriminating power and isn't passing by construction.
// =============================================================================
{
  const target = "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(existingInput.value)) {";
  const sabotaged = SOURCE.replace(target, "if (false && !/^\\d{4}-\\d{2}-\\d{2}$/.test(existingInput.value)) {");
  if (sabotaged === SOURCE) {
    check('7 setup: sabotage replace found the target line', false,
      'the repair-condition text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx, registry: sabotagedRegistry } = load(sabotaged, { value: '' });
    sabotagedCtx.setAssessDateOtherInputMode('OTHER');
    const after = sabotagedRegistry['assess-date-input'];
    check('7: sabotaged gate reproduces ASSESS_DATE_SENTINEL — empty value stays empty',
      after.value === '', `expected sabotage to leave value empty ('${after.value}' found) — if this fails, the real repair logic may not be doing anything`);
  }
}

console.log();
if (failures > 0) {
  console.log(`${failures} assess-date-input lifecycle contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All assess-date-input lifecycle contract checks passed.');
  process.exit(0);
}
