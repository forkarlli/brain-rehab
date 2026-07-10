#!/usr/bin/env node
'use strict';
// Golden baseline harness for the saccade/Fastigial/Dentate Rx pipeline.
// Extracts the REAL source of the relevant functions verbatim from a given git ref
// (via `git show <ref>:app.js`) and executes them in an isolated vm context with
// synthetic inputs — no reimplementation of app.js logic.
//
// Usage (from repo root):
//   node tests/baselines/saccade_pipeline/harness/dump_baseline.js [gitRef]
//   node tests/baselines/saccade_pipeline/harness/dump_baseline.js [gitRef] --compare <baselineJsonPath>
//
// gitRef defaults to the frozen baseline commit (0a27543). Pass a different ref
// (e.g. HEAD) to dump the pipeline's current behavior, or use --compare to diff
// a fresh dump against the committed golden baseline.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function gitShow(ref, file) {
  const out = execSync(`git show ${ref}:${file}`, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return out.replace(/\r\n/g, '\n');
}

// ---- string-aware brace matcher (skips braces inside quotes/comments) ----
function matchBraceBlock(text, fromIndex) {
  let i = text.indexOf('{', fromIndex);
  if (i === -1) throw new Error('no opening brace found from index ' + fromIndex);
  let depth = 0;
  let inStr = null; // ', ", or `
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

function extractByStartLine(src, startLineText) {
  const idx = src.indexOf(startLineText);
  if (idx === -1) throw new Error('start marker not found: ' + startLineText);
  const endIdx = matchBraceBlock(src, idx);
  // include trailing semicolon if present
  const semi = src[endIdx] === ';' ? endIdx + 1 : endIdx;
  return src.slice(idx, semi);
}

function extractFunction(src, signatureText) {
  return extractByStartLine(src, signatureText);
}

// Extract a verbatim sub-slice of a function body between two literal marker lines
// (both must appear, in order, inside the function). Used where we want to run a
// function's internal logic without its DB/DOM-dependent prologue.
function extractBodySlice(src, afterMarker, uptoAndIncludingMarker) {
  const startAnchor = src.indexOf(afterMarker);
  if (startAnchor === -1) throw new Error('afterMarker not found: ' + afterMarker);
  const bodyStart = startAnchor + afterMarker.length;
  const endAnchorIdx = src.indexOf(uptoAndIncludingMarker, bodyStart);
  if (endAnchorIdx === -1) throw new Error('uptoAndIncludingMarker not found: ' + uptoAndIncludingMarker);
  const bodyEnd = endAnchorIdx + uptoAndIncludingMarker.length;
  return src.slice(bodyStart, bodyEnd);
}

function buildHarness(ref) {
  const src = gitShow(ref, 'app.js');

  const aliasNormalizeBlock = extractByStartLine(src, 'const BRAIN_REGION_ALIASES = {') +
    '\n' + src.slice(
      src.indexOf('const BRAIN_REGION_ALIASES = {') + extractByStartLine(src, 'const BRAIN_REGION_ALIASES = {').length,
      src.indexOf('const BRAIN_REGION_RX = {')
    );

  const overshootConsts =
    extractByStartLine(src, 'const OVERSHOOT_RESOLVER_CONFIG = {') + '\n\n' +
    extractByStartLine(src, 'const HORIZONTAL_OVERSHOOT_MATRIX = {');

  const reAIGradesInit = "let reAIGrades = { rightward_overshoot: null, rightward_undershoot: null, leftward_overshoot: null, leftward_undershoot: null, saccade_direction: null, pursuit_entropy: null, hOvershootPct: null };\n";

  const resolveOvershootFn = extractFunction(src, 'function resolveHorizontalOvershootDirection(');
  const lookupOvershootFn  = extractFunction(src, 'function lookupOvershootFromMatrix(');
  const computeRightEyeRxFn = extractFunction(src, 'function computeRightEyeRx(');
  const computeEyeMachineRxFn = extractFunction(src, 'function computeEyeMachineRx(');
  const computeConsistencyFn = extractFunction(src, 'function computeConsistency(');
  const extractDomainRegionsFn = extractFunction(src, 'function extractDomainRegions(');

  // brainRegionMap-building body slice from inside runIntegratedAnalysis, bypassing
  // the DB/getLatest prologue — injected `moduleOutputs` takes the place of the
  // real function's DB-derived one.
  const riSlice = extractBodySlice(
    src,
    'const moduleOutputs = { balance: balanceOut, muscle: muscleOut, rightEye: reOut };',
    'const consistency = computeConsistency(moduleOutputs);'
  );
  const testBrainRegionMapFn =
    'function testBrainRegionMap(moduleOutputs) {\n' + riSlice +
    '\n  return { brainRegionMap, consistency };\n}\n';

  // EYERX_ALIASES is defined inline inside generateIntegratedPrescription (not
  // top-level), so it's pulled by its own brace match rather than extractFunction.
  const eyerxAliasesBlock = extractByStartLine(src, 'const EYERX_ALIASES = {');
  const expandEyerxFn =
    'function expandEyerxAliases(affectedBrainRegions) {\n' + eyerxAliasesBlock +
    '\n  for (const [canon, extra] of Object.entries(EYERX_ALIASES)) {\n' +
    '    if (affectedBrainRegions.has(canon)) extra.forEach(a => affectedBrainRegions.add(a));\n' +
    '  }\n  return affectedBrainRegions;\n}\n';

  const full = [
    aliasNormalizeBlock,
    overshootConsts,
    reAIGradesInit,
    resolveOvershootFn,
    lookupOvershootFn,
    computeRightEyeRxFn,
    computeEyeMachineRxFn,
    computeConsistencyFn,
    extractDomainRegionsFn,
    testBrainRegionMapFn,
    expandEyerxFn,
    'this.__api = { computeRightEyeRx, computeEyeMachineRx, testBrainRegionMap, extractDomainRegions, expandEyerxAliases, normalizeBrainRegion };',
  ].join('\n\n');

  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(full, ctx, { filename: `app.js@${ref} (extracted)` });
  return ctx.__api;
}

// ---------------------------------------------------------------------------

const baseRxInput = {
  spH: null, spV: null, spC: null, eso: null, svH: null, svV: null, syncH: null, syncV: null,
  intrusion: 'none', intrusionAmp: null, intrusionType: null,
  pldRight: null, pldLeft: null, orthRight: null, orthLeft: null,
  svRight: null, svLeft: null, svUp: null, svDown: null,
  spHRight: null, spHLeft: null,
  hTotal: 0, hOverR: 0, hUnderR: 0, hMissedR: 0, hOverL: 0, hUnderL: 0, hMissedL: 0,
  vTotal: 0, vOverR: 0, vUnderR: 0, vMissedR: 0, vOverL: 0, vUnderL: 0, vMissedL: 0,
  hOverRGrade: null, hUnderRGrade: null, hOverLGrade: null, hUnderLGrade: null,
  vpLateralDrift: null, vsLateralDrift: null,
  latOD: null, latOS: null,
  saccDirResults: [], saccDirConfidence: null,
};

const rxScenarioInputs = {
  S1_intrusion_horizontal_large:   { ...baseRxInput, intrusion: 'horizontal', intrusionAmp: '大', intrusionType: 'saccadic' },
  S2_intrusion_up_large:           { ...baseRxInput, intrusion: 'up',         intrusionAmp: '大' },
  S3_intrusion_down_large:         { ...baseRxInput, intrusion: 'down',       intrusionAmp: '大' },
  S4a_intrusion_horizontal_small:  { ...baseRxInput, intrusion: 'horizontal', intrusionAmp: '小' },
  S4b_intrusion_horizontal_medium: { ...baseRxInput, intrusion: 'horizontal', intrusionAmp: '中' },
};

const integrationScenarioInputs = {
  S5_fastigial_non_intrusion: {
    balance: null,
    muscle: { abnormalCount: 1, weakRegions: [{ name: 'Fastigial', evidence: 'muscle-test derived, non-intrusion source' }] },
    rightEye: null,
  },
  S6_dentate_alone: {
    balance: null,
    muscle: { abnormalCount: 1, weakRegions: [{ name: '雙側齒狀核', evidence: 'muscle-test derived' }] },
    rightEye: null,
  },
  S7_mixed_cross_module: {
    balance: null,
    muscle: { abnormalCount: 1, weakRegions: [{ name: 'Bilateral Fastigial Nucleus', evidence: 'm' }] },
    rightEye: { abnormalCount: 1, weakRegions: [{ name: 'FOR', evidence: 're' }] },
  },
};

const eyerxAffectedItems = [{ code: 'E7', type: '眼動機' }, { code: 'E8', type: '眼動機' }];

function dump(ref) {
  const api = buildHarness(ref);
  const out = { rx_scenarios: {}, integration_scenarios: {} };

  for (const [name, data] of Object.entries(rxScenarioInputs)) {
    const r = api.computeRightEyeRx(data);
    out.rx_scenarios[name] = {
      input: data,
      intrusion_indicator: r.indicators.find(i => i.label === 'Intrusion'),
      rx: r.rx.map(e => ({ mode: e.mode, name: e.name, angle: e.angle, speed: e.speed, dist: e.dist, reps: e.reps, target: e.target, bg: e.bg, notes: e.notes, priority: e.priority })),
    };
  }

  for (const [name, moduleOutputs] of Object.entries(integrationScenarioInputs)) {
    const r = api.testBrainRegionMap(moduleOutputs);
    const domVertMuscle = api.extractDomainRegions(moduleOutputs.muscle, 'vertical');
    const domVertRE = api.extractDomainRegions(moduleOutputs.rightEye, 'vertical');
    const seedRegions = Object.keys(r.brainRegionMap);
    const expanded = api.expandEyerxAliases(new Set(seedRegions));
    const eyerx = api.computeEyeMachineRx(expanded, eyerxAffectedItems, []);
    out.integration_scenarios[name] = {
      input: moduleOutputs,
      brainRegionMap: r.brainRegionMap,
      consistency: r.consistency,
      domain_vertical_from_muscle: domVertMuscle,
      domain_vertical_from_rightEye: domVertRE,
      eyerx_layer: {
        seed_regions_from_brainRegionMap: seedRegions,
        affectedBrainRegions_after_EYERX_expansion: [...expanded],
        affectedItems_used: eyerxAffectedItems,
        computeEyeMachineRx_rec: eyerx.rec,
      },
    };
  }

  return out;
}

function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function main() {
  const args = process.argv.slice(2);
  const ref = args[0] && !args[0].startsWith('--') ? args[0] : '0a27543';
  const compareIdx = args.indexOf('--compare');

  const result = dump(ref);

  if (compareIdx !== -1) {
    const baselinePath = args[compareIdx + 1];
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    let allPass = true;
    for (const group of ['rx_scenarios', 'integration_scenarios']) {
      for (const name of Object.keys(baseline[group] || {})) {
        const pass = deepEqual(baseline[group][name], result[group][name]);
        allPass = allPass && pass;
        console.log(`${pass ? 'PASS' : 'FAIL'}  ${group}.${name}`);
      }
    }
    process.exit(allPass ? 0 : 1);
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}

main();
