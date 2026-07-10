#!/usr/bin/env node
'use strict';
// FP (Form-Pipeline) contract — P0-C governance.
//
// P0-C recon (2026-07-10) found that the legacy BCF form pipeline
// (generateBCFResults / generateIntegratedPrescription / saveBCFAssessment)
// and the RightEye/intrusion pipeline (computeRightEyeRx) are structurally
// separate: `reResult` (the computeRightEyeRx output, which is the only
// source of "Bilateral Fastigial Nucleus" in the whole app) is computed in
// all three functions but never merged into the affectedBrainRegions /
// affectedBrainSet Set that feeds `BILATERAL_REGIONS.has()`.
//
// Recon also found REGION_SIDE_TYPE has zero Fastigial entries — which
// means the `BILATERAL_REGIONS.has(r)` clause in those three filters is
// currently dead code: `!REGION_SIDE_TYPE[r]` already short-circuits true
// for Fastigial before BILATERAL_REGIONS is ever consulted. If Fastigial
// is ever added to REGION_SIDE_TYPE, that clause silently flips from dead
// code to an active gate — a behavior change with no code review trigger
// unless something is watching for it. That's what this file watches for.
//
// This is a static source-contract test, not a runtime/DOM harness test.
// generateBCFResults/generateIntegratedPrescription/saveBCFAssessment are
// saturated with document.getElementById/querySelector calls (BCF form
// state); driving them end-to-end would require a JSDOM-class dependency
// (not currently in package.json) plus mocks for ~20 different selectors,
// for a payoff that a source-contract check gets more reliably and without
// new dependencies or a scaffold that goes stale as the form changes. See
// this file's PR/commit message for the explicit feasibility judgment.
//
// Exit code 0 = both contracts hold. Exit code 1 = a contract broke, with
// a message telling a future author WHY, not just WHAT.

const fs = require('fs');
const path = require('path');

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

// ---- shared helper: string-aware brace matcher (same technique as the
// baseline harness — no reimplementation of app.js logic, just enough
// parsing to find block boundaries) ----
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
// T-FP-A: REGION_SIDE_TYPE must never contain a Fastigial alias.
// =============================================================================
{
  const aliasBlock = extractBlockFrom(APP_JS, 'const BRAIN_REGION_ALIASES = {');
  const fastigialLineMatch = aliasBlock.match(/'Bilateral Fastigial Nucleus':\s*\[([^\]]*)\]/);
  if (!fastigialLineMatch) {
    throw new Error("T-FP-A setup failed: 'Bilateral Fastigial Nucleus' entry not found in BRAIN_REGION_ALIASES — contract test itself needs updating, not silently skipped.");
  }
  const aliasNames = [...fastigialLineMatch[1].matchAll(/'([^']*)'/g)].map(m => m[1]);
  const fastigialNames = ['Bilateral Fastigial Nucleus', ...aliasNames];

  const sideTypeBlock = extractBlockFrom(APP_JS, 'const REGION_SIDE_TYPE = {');
  const sideTypeKeys = [...sideTypeBlock.matchAll(/'([^']*)':\s*\{/g)].map(m => m[1]);

  const collision = fastigialNames.filter(name => sideTypeKeys.includes(name));

  check(
    'T-FP-A: REGION_SIDE_TYPE contains no Fastigial alias',
    collision.length === 0,
    'Structured form-pipeline integration review required before adding Fastigial to REGION_SIDE_TYPE (see FP contract).\n' +
    `      Colliding name(s): ${JSON.stringify(collision)}\n` +
    '      Adding Fastigial here flips BILATERAL_REGIONS.has() from dead code to an active gate — silent Rx behavior change.'
  );
}

// =============================================================================
// T-FP-B: intrusion-derived data must not be merged into the legacy form
// pipeline's affectedBrainRegions/affectedBrainSet before the
// BILATERAL_REGIONS.has() filter runs, in any of the 3 call sites.
//
// The risk-carrying fields on computeRightEyeRx()'s return value are the
// ones that name brain regions: `brainRegions`, `weakRegions`, and
// `indicators` (each indicator carries a `.brain` array). `reResult.hasAbnormal`
// is a plain boolean gate used legitimately by all 3 sites and is NOT a
// merge risk, so this checks for the specific risk-carrying accessors
// rather than for any reference to `reResult` at all (an earlier draft of
// this test flagged the harmless `.hasAbnormal` check as a false positive —
// caught by actually running it, not by re-reading the code more carefully).
// =============================================================================
{
  const RISK_ACCESSOR = /reResult\.(brainRegions|weakRegions|indicators)\b/;

  function sliceBetween(text, fromMarker, toMarker) {
    const fromIdx = text.indexOf(fromMarker);
    if (fromIdx === -1) throw new Error('fromMarker not found: ' + fromMarker);
    const searchFrom = fromIdx + fromMarker.length;
    const toIdx = text.indexOf(toMarker, searchFrom);
    if (toIdx === -1) throw new Error('toMarker not found after fromMarker: ' + toMarker);
    return text.slice(searchFrom, toIdx);
  }

  // Site 1: generateBCFResults — top-level function.
  const generateBCFResultsBody = extractBlockFrom(APP_JS, 'function generateBCFResults()');
  const site1Gap = sliceBetween(generateBCFResultsBody, 'const reResult = computeRightEyeRx(', 'BILATERAL_REGIONS.has(');
  check(
    'T-FP-B site 1 (generateBCFResults): no risk-carrying reResult accessor before .has() filter',
    !RISK_ACCESSOR.test(site1Gap),
    'reResult.brainRegions/weakRegions/indicators is now read between the reResult declaration and the BILATERAL_REGIONS.has() ' +
    'filter in generateBCFResults(). If this merges RightEye/intrusion regions (incl. Fastigial) into affectedBrainRegions, the ' +
    'P0-C "pipelines are separate" finding no longer holds — re-run P0-C-style recon before proceeding.'
  );

  // Site 2: generateIntegratedPrescription — top-level function, closes
  // BEFORE saveBCFAssessment() (confirmed: both are top-level siblings,
  // `saveBCFAssessment` is declared with zero indentation at its own
  // `async function` line — it is NOT nested inside
  // generateIntegratedPrescription, despite sitting later in the same file
  // region. An earlier P0-C recon pass mischaracterized it as nested;
  // corrected while building this test, which is exactly the kind of thing
  // this file exists to keep honest going forward.)
  const generateIntegratedPrescriptionBody = extractBlockFrom(APP_JS, 'function generateIntegratedPrescription()');
  const site2Gap = sliceBetween(generateIntegratedPrescriptionBody, 'const reResult = computeRightEyeRx(', 'BILATERAL_REGIONS.has(');
  check(
    'T-FP-B site 2 (generateIntegratedPrescription): no risk-carrying reResult accessor before .has() filter',
    !RISK_ACCESSOR.test(site2Gap),
    'reResult.brainRegions/weakRegions/indicators is now read between the reResult declaration and the BILATERAL_REGIONS.has() ' +
    'filter in generateIntegratedPrescription(). Same risk as site 1 — re-run P0-C-style recon before proceeding.'
  );

  // Site 3: saveBCFAssessment — separate top-level function (see note
  // above). It currently re-derives affectedBrainSet purely from freshly
  // re-read DOM checkbox state and never calls computeRightEyeRx or
  // references `reResult` at all — assert the whole function body stays
  // free of both identifiers.
  const saveBCFAssessmentBody = extractBlockFrom(APP_JS, 'async function saveBCFAssessment()');
  check(
    'T-FP-B site 3 (saveBCFAssessment): no computeRightEyeRx/reResult reference at all',
    !/reResult|computeRightEyeRx/.test(saveBCFAssessmentBody),
    'saveBCFAssessment() now references reResult or calls computeRightEyeRx. If this pulls RightEye/intrusion regions into ' +
    'affectedBrainSet, the P0-C "pipelines are separate" finding no longer holds — re-run P0-C-style recon before proceeding.'
  );
}

console.log();
if (failures > 0) {
  console.log(`${failures} FP contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All FP contract checks passed.');
  process.exit(0);
}
