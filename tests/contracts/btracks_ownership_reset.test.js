#!/usr/bin/env node
'use strict';
// P0-0 (BTracks ownership) — acceptance contract.
//
// History (see Phase-0 recon W-1 through W-4, Z-2, and the P0-0 review
// rounds): DB.assessments records could silently attribute one patient's
// BTracks/Romberg measurements — including uploaded-report COP data that
// drives Lateral Bias diagnosis / posture selection / flying-chair
// prescriptions — to a different patient. Three fixes landed in sequence:
//
//   R-1/R-2: the four parse/upload assignment points only ever set `data`,
//   never an owner — the highest-risk path (the one carrying COP data) had
//   NO ownership at all. Fixed by collapsing each instance into one atomic
//   state object, { data, dataOwner }, assigned as a whole.
//
//   R-3: the compute/save guard's truthy-on-currentPid check let a stale
//   owner through whenever no patient was currently selected. Fixed by
//   extracting a pure predicate, isBTracksOwnershipBlocked(), that also
//   fails closed on unowned-but-present data and on a stale owner vs. a
//   blank current selection.
//
//   B-1: the four parse/upload callbacks decided ownership by reading the
//   patient selector at COMPLETION time, not at the time the operation
//   STARTED — an async upload begun under patient A could still complete
//   after the user switched to B and get attributed to B. Fixed by capturing
//   the owner synchronously at operation start and discarding (no DOM
//   writes, no state assignment) if the context changed by completion —
//   extracted as isBTracksAcquisitionStale(startOwner, currentOwner).
//
//   B-2: the delegated 'input'/'change' listener could, in principle, touch
//   the same state as an acquisition. Split into two independent variables —
//   _btracksState (acquisition-only, atomic) and _btracksFormOwner
//   (listener-only) — so the listener structurally cannot touch parsed-report
//   ownership. isBTracksOwnershipBlocked() checks both.
//
//   B-3: the reset no-op condition used to compare newPatientId against the
//   BTracks domain's own state, which meant a state that already (anomalously)
//   claimed ownership by the incoming patient would suppress a reset that
//   should have happened. Fixed by moving the "did the context actually
//   change" decision into the orchestrator itself
//   (_previousAssessmentContextPatientId), fully independent of either
//   domain's internal state. The reset functions are now unconditional.
//
//   E-1: reset cleared the input fields but not the parse-result summary
//   panels (#btracks-html-summary / #btracks-parsed-summary and their modal
//   equivalents) — a separate display surface. Patient A's STD/PRO/VIS/VES/
//   RQ table stayed visible under patient B even though the fields
//   themselves were empty and a save would be blocked (§4.5: visible is not
//   authoritative — a therapist can still read and re-type stale numbers).
//   Fixed by clearing innerHTML AND hiding (display:'none') both panels in
//   each reset — display alone would let the stale content reappear next
//   time the panel is shown without a fresh parse.
//
// This file tests every piece above via the same source-slicing technique as
// the other tests in this directory: isBTracksOwnershipBlocked and
// isBTracksAcquisitionStale (both pure, no DOM), _resetBTracksTabState /
// _resetBTracksModalState / onAssessmentPatientContextChanged (DOM-touching
// but enumerable, driven with a hand-rolled stub).
//
// NOT covered here: the real _handleBTrackSHtmlFile / _handleBTrackSFiles
// (and modal equivalents) end-to-end. They call the real parseBTrackSReport,
// which calls `new DOMParser()` — a real browser API this project has no
// stub for (same reasoning the rest of this suite uses to exempt
// saveBCFAssessment() and _rombergCompute() from end-to-end coverage). The
// race-detection logic those functions rely on (isBTracksAcquisitionStale)
// is fully covered directly; the full upload flow needs manual browser
// verification — see the report text for the steps.
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

// Wide slices — from the shared predicates through _rombergCompute/
// _mRombergCompute (exclusive) — so parseBTrackSReport, _btracksAngleDirection
// etc. are present as *declarations* (needed so the slice parses/hoists
// cleanly) even though this file never calls the ones that need DOMParser.
const TAB_START = 'function isBTracksAcquisitionStale';
const TAB_END = 'function _rombergCompute()';
const MODAL_START = '// ===== MODAL ROMBERG HELPERS =====';
const MODAL_END = 'function _mRombergCompute()';

function slice(startMarker, endMarker) {
  const startIdx = APP_JS.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`START_MARKER not found: ${startMarker} — update this test.`);
  const endIdx = APP_JS.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error(`END_MARKER not found after ${startMarker} — update this test.`);
  return APP_JS.slice(startIdx, endIdx);
}

const TAB_SLICE = slice(TAB_START, TAB_END);
const MODAL_SLICE = slice(MODAL_START, MODAL_END);
const BASE_SOURCE = TAB_SLICE + '\n' + MODAL_SLICE;

['isBTracksAcquisitionStale', 'isBTracksOwnershipBlocked', '_resetBTracksTabState',
 '_resetBTracksModalState', 'onAssessmentPatientContextChanged', '_onRombergSourceChange',
 '_mOnRombergSourceChange'].forEach(name => {
  if (!BASE_SOURCE.includes(`function ${name}`)) throw new Error(`${name} not found in extracted source — update this test.`);
});

// Thin accessor shims — pure passthrough — appended in the SAME
// vm.runInContext call so they share the extracted `let` bindings' lexical
// scope (a vm context does not expose top-level `let` bindings as sandbox
// properties, only `var`/function declarations do).
const ACCESSOR_SHIMS = `
function __TEST_setBTracksState(v) { _btracksState = v; }
function __TEST_getBTracksState() { return _btracksState; }
function __TEST_setBTracksFormOwner(v) { _btracksFormOwner = v; }
function __TEST_getBTracksFormOwner() { return _btracksFormOwner; }
function __TEST_setMBTracksState(v) { _mBtracksState = v; }
function __TEST_getMBTracksState() { return _mBtracksState; }
function __TEST_getPreviousContext() { return _previousAssessmentContextPatientId; }
`;
const SOURCE = BASE_SOURCE + '\n' + ACCESSOR_SHIMS;

const TAB_FIELD_IDS = [
  'romberg-path-eo', 'romberg-path-ec', 'romberg-path-pro', 'romberg-path-vis',
  'romberg-pct-std', 'romberg-pct-pro', 'romberg-pct-vis', 'romberg-pct-ves',
  'romberg-jerk', 'romberg-direction', 'romberg-righteye-vertical', 'romberg-source',
  'romberg-rq-display', 'romberg-mode-badge', 'romberg-result', 'btracks-save-btn',
  'btracks-upload-zone', 'btracks-html-upload-zone',
  // E-1: parse-result summary panels — a separate display surface from the
  // fields they were used to fill in.
  'btracks-html-summary', 'btracks-parsed-summary',
];
const MODAL_FIELD_IDS = [
  'modal-romberg-path-eo', 'modal-romberg-path-ec', 'modal-romberg-path-pro', 'modal-romberg-path-vis',
  'modal-romberg-direction', 'modal-romberg-source',
  'modal-romberg-rq-display', 'modal-romberg-mode-badge',
  'modal-btracks-dropzone-wrap', 'modal-btracks-html-zone',
  'modal-btracks-html-summary', 'modal-btracks-summary',
];

function makeFakeElement(id) {
  return {
    id,
    value: `stale-${id}`,
    textContent: `stale-${id}`,
    // E-1: a stale-but-nonempty innerHTML simulates patient A's leftover
    // STD/PRO/VIS/VES/RQ parse-result table still sitting in the DOM.
    innerHTML: `stale-${id}`,
    style: { display: '', background: '' },
  };
}

// excludeIds lets a test simulate "this DOM never got rendered" (D-1: e.g.
// the BTracks tab was never opened, or the modal was never set to type
// 'romberg') — the previous version of this file pre-seeded every id
// unconditionally, which meant the missing-element crash path was
// structurally untestable.
function load(sourceOverride, excludeIds) {
  const registry = {};
  const excluded = new Set(excludeIds || []);
  [...TAB_FIELD_IDS, ...MODAL_FIELD_IDS].forEach(id => {
    if (!excluded.has(id)) registry[id] = makeFakeElement(id);
  });
  const sandbox = {
    document: { getElementById: id => registry[id] || null },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(sourceOverride || SOURCE, context);
  return { context, registry };
}

// A few string helpers for source-contract (static) assertions — same
// brace-matching approach used by fastigial_form_pipeline_boundary.test.js's
// extractBlockFrom, reimplemented locally so this file stays self-contained.
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
function extractBlockFrom(text, startLineText) {
  const idx = text.indexOf(startLineText);
  if (idx === -1) throw new Error('start marker not found: ' + startLineText);
  const end = matchBraceBlock(text, idx);
  return text.slice(idx, end);
}

// =============================================================================
// A: isBTracksOwnershipBlocked — pure predicate, no DOM involved at all
// =============================================================================
{
  const { context } = load();
  const f = context.isBTracksOwnershipBlocked;

  check('A1: fresh state, no form owner, any current patient — not blocked',
    f({ data: null, dataOwner: null }, null, 'P_B') === false,
    'expected a completely untouched state to never block');

  check('A2: dataOwner=null but data present (uploaded before any patient selected) — BLOCKED',
    f({ data: { cop_ml_ves: 1 }, dataOwner: null }, null, 'P_B') === true,
    'expected unowned-but-present data to block regardless of current patient');

  check('A3: dataOwner matches current patient, no form owner — not blocked',
    f({ data: { cop_ml_ves: 1 }, dataOwner: 'P_B' }, null, 'P_B') === false,
    'expected a matching data owner to pass');

  check('A4: dataOwner is a different real patient than current — BLOCKED',
    f({ data: { cop_ml_ves: 1 }, dataOwner: 'P_A' }, null, 'P_B') === true,
    'expected a mismatched data owner to block');

  check('A5: dataOwner is a stale real patient, current patient is \'\' (deselected) — BLOCKED',
    f({ data: null, dataOwner: 'P_A' }, null, '') === true,
    'expected a stale data owner to block even when no patient is currently selected');

  check('A6: dataOwner matches current, no parsed report, no form owner — not blocked',
    f({ data: null, dataOwner: 'P_B' }, null, 'P_B') === false,
    'expected owned-but-empty data with no manual typing to pass');

  check('A7: formOwner mismatch alone (no parsed data at all) — BLOCKED',
    f({ data: null, dataOwner: null }, 'P_A', 'P_B') === true,
    'expected a mismatched form owner to block even with no parsed data involved — B-2');

  check('A8: formOwner matches current, no parsed data — not blocked',
    f({ data: null, dataOwner: null }, 'P_B', 'P_B') === false,
    'expected a matching form owner with no parsed data to pass');
}

// =============================================================================
// B: mutation negative control — bypass isBTracksOwnershipBlocked
// =============================================================================
{
  const target = 'function isBTracksOwnershipBlocked(state, formOwner, currentPatientId) {\n  const dataOwnerMismatch = state.dataOwner !== null && state.dataOwner !== currentPatientId;\n  const unownedData = state.data !== null && state.dataOwner === null;\n  const formOwnerMismatch = formOwner !== null && formOwner !== currentPatientId;\n  return dataOwnerMismatch || unownedData || formOwnerMismatch;\n}';
  const sabotaged = SOURCE.replace(target, 'function isBTracksOwnershipBlocked(state, formOwner, currentPatientId) {\n  return false;\n}');
  if (sabotaged === SOURCE) {
    check('B setup: sabotage replace found the guard body', false,
      'isBTracksOwnershipBlocked body text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx } = load(sabotaged);
    const f = sabotagedCtx.isBTracksOwnershipBlocked;
    check('B1: bypassed guard wrongly allows a mismatched data owner through',
      f({ data: { cop_ml_ves: 1 }, dataOwner: 'P_A' }, null, 'P_B') === false,
      'expected the sabotaged guard to let a mismatched owner through');
    check('B2: bypassed guard wrongly allows a mismatched form owner through',
      f({ data: null, dataOwner: null }, 'P_A', 'P_B') === false,
      'expected the sabotaged guard to let a mismatched form owner through');
  }
}

// =============================================================================
// C: _resetBTracksTabState / _resetBTracksModalState — now unconditional
// (the no-op decision moved to the orchestrator, see E/O3/O4)
// =============================================================================
{
  const { context, registry } = load();
  context.__TEST_setBTracksState({ data: { path_std: 1, cop_ml_ves: 2 }, dataOwner: 'P_A' });
  context.__TEST_setBTracksFormOwner('P_A');
  registry['romberg-source'].value = 'btracks_html_file';
  // E-1 setup: simulate patient A's parse-result summary panels actually
  // being on screen (real code sets style.display='block' when populating
  // them — see _handleBTrackSHtmlFile / _handleBTrackSFiles).
  registry['btracks-html-summary'].innerHTML = 'A STD/PRO/VIS/VES/RQ table';
  registry['btracks-html-summary'].style.display = 'block';
  registry['btracks-parsed-summary'].innerHTML = 'A AI-parsed table';
  registry['btracks-parsed-summary'].style.display = 'block';
  context._resetBTracksTabState();
  check('C1: reset replaces the whole state object', JSON.stringify(context.__TEST_getBTracksState()) === JSON.stringify({ data: null, dataOwner: null }),
    `expected { data: null, dataOwner: null }, got ${JSON.stringify(context.__TEST_getBTracksState())}`);
  check('C1: reset clears the form owner too', context.__TEST_getBTracksFormOwner() === null,
    `expected null, got '${context.__TEST_getBTracksFormOwner()}'`);
  check('C1: reset clears numeric fields', registry['romberg-path-eo'].value === '',
    `expected empty value, got '${registry['romberg-path-eo'].value}'`);
  check('C1 (N-1): reset re-syncs the upload-zone display (both hidden for source=manual)',
    registry['btracks-upload-zone'].style.display === 'none' && registry['btracks-html-upload-zone'].style.display === 'none',
    'expected both upload zones hidden');
  check('C1 (N-2): reset hides the save button', registry['btracks-save-btn'].style.display === 'none',
    `expected 'none', got '${registry['btracks-save-btn'].style.display}'`);
  check('C1 (E-1): reset clears the HTML-report summary panel innerHTML',
    registry['btracks-html-summary'].innerHTML === '',
    `expected '', got '${registry['btracks-html-summary'].innerHTML}' — patient A's parse-result table would stay visible under patient B`);
  check('C1 (E-1): reset hides the HTML-report summary panel',
    registry['btracks-html-summary'].style.display === 'none',
    `expected 'none', got '${registry['btracks-html-summary'].style.display}' — display alone (without clearing innerHTML) would let stale content reappear`);
  check('C1 (E-1): reset clears the AI-parsed summary panel innerHTML',
    registry['btracks-parsed-summary'].innerHTML === '',
    `expected '', got '${registry['btracks-parsed-summary'].innerHTML}'`);
  check('C1 (E-1): reset hides the AI-parsed summary panel',
    registry['btracks-parsed-summary'].style.display === 'none',
    `expected 'none', got '${registry['btracks-parsed-summary'].style.display}'`);
}
{
  const { context, registry } = load();
  context.__TEST_setMBTracksState({ data: { path_std: 1 }, dataOwner: 'P_A' });
  registry['modal-btracks-html-summary'].innerHTML = 'A STD/PRO/VIS/VES/RQ table';
  registry['modal-btracks-html-summary'].style.display = 'block';
  registry['modal-btracks-summary'].innerHTML = 'A AI-parsed table';
  registry['modal-btracks-summary'].style.display = 'block';
  context._resetBTracksModalState();
  check('D1: modal reset replaces the whole state object', JSON.stringify(context.__TEST_getMBTracksState()) === JSON.stringify({ data: null, dataOwner: null }),
    `expected { data: null, dataOwner: null }, got ${JSON.stringify(context.__TEST_getMBTracksState())}`);
  check('D1: modal reset clears DOM fields', registry['modal-romberg-path-eo'].value === '',
    `expected empty value, got '${registry['modal-romberg-path-eo'].value}'`);
  check('D1 (E-1): reset clears the modal HTML-report summary panel innerHTML',
    registry['modal-btracks-html-summary'].innerHTML === '',
    `expected '', got '${registry['modal-btracks-html-summary'].innerHTML}'`);
  check('D1 (E-1): reset hides the modal HTML-report summary panel',
    registry['modal-btracks-html-summary'].style.display === 'none',
    `expected 'none', got '${registry['modal-btracks-html-summary'].style.display}'`);
  check('D1 (E-1): reset clears the modal AI-parsed summary panel innerHTML',
    registry['modal-btracks-summary'].innerHTML === '',
    `expected '', got '${registry['modal-btracks-summary'].innerHTML}'`);
  check('D1 (E-1): reset hides the modal AI-parsed summary panel',
    registry['modal-btracks-summary'].style.display === 'none',
    `expected 'none', got '${registry['modal-btracks-summary'].style.display}'`);
}

// =============================================================================
// E: onAssessmentPatientContextChanged — basic orchestration
// =============================================================================
{
  const { context, registry } = load();
  context.onAssessmentPatientContextChanged('P_A'); // establish a baseline context
  context.__TEST_setBTracksState({ data: { path_std: 1 }, dataOwner: 'P_A' });
  context.__TEST_setMBTracksState({ data: { path_std: 1 }, dataOwner: 'P_A' });

  check('E1: unchanged context (same patient again) is a no-op', context.__TEST_getBTracksState().data !== null,
    'expected re-announcing the same patient to not reset');

  context.onAssessmentPatientContextChanged('P_B');
  check('E2: a genuine switch resets the tab domain', context.__TEST_getBTracksState().data === null,
    'expected tab-domain state to be reset by the orchestrator');
  check('E3: a genuine switch resets the modal domain', context.__TEST_getMBTracksState().data === null,
    'expected modal-domain state to be reset by the orchestrator');
  check('E4: orchestrator clears both field sets', registry['romberg-path-eo'].value === '' && registry['modal-romberg-path-eo'].value === '',
    'expected both tab and modal DOM fields to be cleared');
}

// =============================================================================
// F: source-change discards data but preserves dataOwner
// =============================================================================
{
  const { context, registry } = load();
  context.__TEST_setBTracksState({ data: { path_std: 1, cop_ml_ves: 2 }, dataOwner: 'P_B' });
  registry['romberg-source'].value = 'manual';
  context._onRombergSourceChange();
  check('F1: switching source to manual nulls data', context.__TEST_getBTracksState().data === null,
    `expected data to be nulled, got ${JSON.stringify(context.__TEST_getBTracksState().data)}`);
  check('F1: switching source to manual preserves dataOwner', context.__TEST_getBTracksState().dataOwner === 'P_B',
    `expected dataOwner to stay 'P_B', got '${context.__TEST_getBTracksState().dataOwner}'`);
}

// =============================================================================
// G (D-1 regression): #romberg-source / #modal-romberg-source do not exist
// until their respective tab/modal-type has been rendered at least once.
// _resetBTracksTabState()/_resetBTracksModalState() are now called
// unconditionally on every real patient switch (via the orchestrator),
// regardless of which tab the user is on — they must not throw. Requires the
// excludeIds path in load(); the original version of this file pre-seeded
// every id unconditionally, so this path was structurally untestable.
// =============================================================================
{
  const { context: ctxNoTabSource } = load(undefined, ['romberg-source']);
  let threwTab = false;
  try { ctxNoTabSource._resetBTracksTabState(); } catch (e) { threwTab = true; }
  check('G1: _resetBTracksTabState does not throw when #romberg-source is absent', !threwTab,
    'expected the tab reset to tolerate a never-rendered BTracks tab, it threw instead');
  check('G1: state is still reset even though #romberg-source was absent', ctxNoTabSource.__TEST_getBTracksState().data === null,
    'expected the reset to still complete for everything that does not depend on #romberg-source');

  const { context: ctxNoModalSource } = load(undefined, ['modal-romberg-source']);
  let threwModal = false;
  try { ctxNoModalSource._resetBTracksModalState(); } catch (e) { threwModal = true; }
  check('G2: _resetBTracksModalState does not throw when #modal-romberg-source is absent', !threwModal,
    'expected the modal reset to tolerate a-type never having been \'romberg\', it threw instead');
  check('G2: modal state is still reset even though #modal-romberg-source was absent', ctxNoModalSource.__TEST_getMBTracksState().data === null,
    'expected the reset to still complete for everything that does not depend on #modal-romberg-source');

  // The real-world consequence of the pre-fix bug: an uncaught throw inside
  // _resetBTracksTabState (called from onAssessmentPatientContextChanged,
  // called from e.g. the assess-patient-select handler) would abort every
  // statement after it in that handler — populateAssessDateDropdown(),
  // renderAssessments(), clearBCFForm(), clearRightEyeForm(). Confirm the
  // orchestrator itself — the thing actually wired into all four entry
  // points — also survives when neither tab/modal has ever been rendered.
  const { context: ctxNeither } = load(undefined, ['romberg-source', 'modal-romberg-source']);
  let threwOrchestrator = false;
  try { ctxNeither.onAssessmentPatientContextChanged('P_B'); } catch (e) { threwOrchestrator = true; }
  check('G3: onAssessmentPatientContextChanged does not throw when neither tab nor modal has ever been rendered', !threwOrchestrator,
    'expected the orchestrator to survive a patient switch before either romberg form existed — this is the exact crash a real handler would hit');
}

// =============================================================================
// O1 (D-4): source-contract assertion, same static-analysis style as this
// project's existing T-FP-A test. The delegated listeners' function bodies
// must not reference _btracksState/_mBtracksState at all — the ONLY thing
// they may write is _btracksFormOwner/_mBtracksFormOwner. This is checked
// against the actual source text, not simulated behavior, so it catches
// someone later adding a state-touching line to the listener even if no
// runtime test happens to exercise it.
// =============================================================================
{
  const tabListenerBlock = extractBlockFrom(APP_JS, "document.getElementById('btracks-interface')?.addEventListener(evt, () => {");
  check('O1 (main): delegated listener body does not reference _btracksState', !tabListenerBlock.includes('_btracksState'),
    `delegated listener must only ever write _btracksFormOwner. Body:\n${tabListenerBlock}`);
  check('O1 (main): delegated listener body does not reference _mBtracksState', !tabListenerBlock.includes('_mBtracksState'),
    `delegated listener must not touch the modal's state either. Body:\n${tabListenerBlock}`);
  check('O1 (main): delegated listener body does write _btracksFormOwner', tabListenerBlock.includes('_btracksFormOwner ='),
    'expected the listener to actually assign _btracksFormOwner — an empty/no-op listener would also pass the two checks above for the wrong reason');

  const modalListenerBlock = extractBlockFrom(APP_JS, "document.getElementById('assessmentFormDynamic')?.addEventListener(evt, () => {");
  check('O1 (modal): delegated listener body does not reference _btracksState', !modalListenerBlock.includes('_btracksState'),
    `delegated listener must only ever write _mBtracksFormOwner. Body:\n${modalListenerBlock}`);
  check('O1 (modal): delegated listener body does not reference _mBtracksState', !modalListenerBlock.includes('_mBtracksState'),
    `delegated listener must not touch the modal's state object either — only _mBtracksFormOwner. Body:\n${modalListenerBlock}`);
  check('O1 (modal): delegated listener body does write _mBtracksFormOwner', modalListenerBlock.includes('_mBtracksFormOwner ='),
    'expected the listener to actually assign _mBtracksFormOwner');
}

// =============================================================================
// O2: async upload race — A starts, context switches to B, callback
// completes. isBTracksAcquisitionStale is the exact check all four real
// acquisition callbacks gate their atomic assignment on; verified directly
// here rather than through the real FileReader/DOMParser-based functions
// (see file header for why).
// =============================================================================
{
  const { context } = load();
  check('O2 (main/modal, shared predicate): an operation started under A, completing while B is current, is stale',
    context.isBTracksAcquisitionStale('P_A', 'P_B') === true,
    'expected a context change between start and completion to be flagged stale — this is what makes the real callbacks `return` before ever assigning _btracksState/_mBtracksState');
  check('O2: an operation started and completing under the same patient is NOT stale',
    context.isBTracksAcquisitionStale('P_A', 'P_A') === false,
    'expected an unchanged context to be safe to apply');
  check('O2: an operation started with no patient selected, completing under a real patient, is stale',
    context.isBTracksAcquisitionStale(null, 'P_B') === true,
    'expected null (no patient at start) to never silently match a real patient at completion');
}
// Mutation negative control for O2.
{
  const target = 'function isBTracksAcquisitionStale(startOwner, currentOwner) {\n  return currentOwner !== startOwner;\n}';
  const sabotaged = SOURCE.replace(target, 'function isBTracksAcquisitionStale(startOwner, currentOwner) {\n  return false;\n}');
  if (sabotaged === SOURCE) {
    check('O2 setup: sabotage replace found isBTracksAcquisitionStale\'s body', false,
      'body text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx } = load(sabotaged);
    check('O2 (negative control): sabotaged race-check wrongly reports a switched context as fresh',
      sabotagedCtx.isBTracksAcquisitionStale('P_A', 'P_B') === false,
      'expected the sabotaged predicate to always report "not stale" — if this fails, the check may not be doing anything');
  }
}

// =============================================================================
// O3: B-3 — the reset decision must not be derived from the domain's own
// state. Simulates state that already (anomalously) claims ownership by the
// incoming patient ("already laundered") and confirms the orchestrator still
// resets, because its decision is _previousAssessmentContextPatientId, not
// state.dataOwner.
// =============================================================================
{
  const { context } = load();
  check('O3 setup: previousContext starts unset', context.__TEST_getPreviousContext() === null,
    'expected a fresh context to have no previous patient recorded yet');
  context.__TEST_setBTracksState({ data: { cop_ml_ves: 99 }, dataOwner: 'P_B' }); // "already laundered" — claims B before the orchestrator ever saw B
  context.onAssessmentPatientContextChanged('P_B');
  check('O3: a genuine first transition to B resets even though state already claimed B as owner',
    context.__TEST_getBTracksState().data === null,
    'expected the reset to fire based on _previousAssessmentContextPatientId, not on whether state.dataOwner happens to already equal the incoming patient');
}
// Mutation negative control for O3 — reintroduce the old state-based no-op
// condition and confirm the "laundered" case wrongly skips the reset.
{
  const target = 'function onAssessmentPatientContextChanged(newPatientId) {\n  if (newPatientId === \'\') return;\n  if (newPatientId === _previousAssessmentContextPatientId) return;\n  _previousAssessmentContextPatientId = newPatientId;\n  _resetBTracksTabState();\n  _resetBTracksModalState();\n}';
  const sabotaged = SOURCE.replace(target, 'function onAssessmentPatientContextChanged(newPatientId) {\n  if (newPatientId === \'\') return;\n  if (newPatientId === _btracksState.dataOwner) return;\n  _resetBTracksTabState();\n  _resetBTracksModalState();\n}');
  if (sabotaged === SOURCE) {
    check('O3 setup: sabotage replace found onAssessmentPatientContextChanged\'s body', false,
      'body text has changed — update the sabotage string in this test');
  } else {
    const { context: sabotagedCtx } = load(sabotaged);
    sabotagedCtx.__TEST_setBTracksState({ data: { cop_ml_ves: 99 }, dataOwner: 'P_B' });
    sabotagedCtx.onAssessmentPatientContextChanged('P_B');
    check('O3 (negative control): reintroducing the old state-based no-op wrongly skips the reset on "laundered" state',
      sabotagedCtx.__TEST_getBTracksState().data !== null,
      'expected the sabotaged (pre-B-3) logic to wrongly treat "state already claims B" as "nothing changed" — if this fails, B-3 may not be preventing anything');
  }
}

// =============================================================================
// O4: deselect behavior per the B-3 ruling.
//   - newPatientId === '' is a no-op and does NOT update previousContext
//   - reselecting the SAME patient after a deselect detour stays a no-op
//   - a genuine switch to a DIFFERENT patient after the detour still resets
// =============================================================================
{
  const { context, registry } = load();
  context.onAssessmentPatientContextChanged('P_A'); // baseline context = P_A
  context.__TEST_setBTracksState({ data: { path_std: 1 }, dataOwner: 'P_A' });
  registry['romberg-path-eo'].value = 'A-in-progress-value';

  context.onAssessmentPatientContextChanged('');
  check('O4a: deselecting to \'\' does not reset state', context.__TEST_getBTracksState().data !== null,
    'expected deselection alone to leave state untouched');
  check('O4a: deselecting to \'\' does not clear DOM fields', registry['romberg-path-eo'].value === 'A-in-progress-value',
    'expected deselection alone to leave DOM fields untouched');
  check('O4a: deselecting to \'\' does not update previousContext', context.__TEST_getPreviousContext() === 'P_A',
    `expected previousContext to remain 'P_A', got '${context.__TEST_getPreviousContext()}'`);

  context.onAssessmentPatientContextChanged('P_A');
  check('O4b: reselecting the SAME patient after the detour is still a no-op (A\'s own data survives)',
    context.__TEST_getBTracksState().data !== null,
    'expected reselecting the same patient to not wipe that patient\'s own in-progress data');

  context.onAssessmentPatientContextChanged('P_B');
  check('O4c: a genuine switch to a DIFFERENT patient after the detour still resets',
    context.__TEST_getBTracksState().data === null,
    'expected switching to B to reset — the \'\' detour must not have erased memory of the real previous context');
}

console.log();
if (failures > 0) {
  console.log(`${failures} BTracks ownership contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All BTracks ownership contract checks passed.');
  process.exit(0);
}
