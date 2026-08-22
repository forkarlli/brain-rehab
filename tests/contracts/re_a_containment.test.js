#!/usr/bin/env node
'use strict';
// RE-A containment acceptance criteria (AC-1 … AC-16) + negative control.
//
// Runs the REAL production definitions extracted from a given git ref (default
// HEAD) inside a vm context — no reimplementation of app.js logic.
//
// The containment flag is injected as a vm context global, never by editing
// production source, so the negative control cannot leave the working tree
// dirty (design §11.3).
//
// Usage:
//   node tests/contracts/re_a_containment.test.js [gitRef]

const { execSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HARNESS = require(path.join(REPO_ROOT, 'tests', 'baselines', 'saccade_pipeline', 'harness', 'dump_baseline.js'));
const REF = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'HEAD';

let passed = 0, failed = 0;
const failures = [];
function check(name, cond, msg) {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; failures.push(`${name}\n        ${msg}`); console.log(`FAIL  ${name}\n        ${msg}`); }
}

function gitShow(ref, file) {
  return execSync(`git show ${ref}:${file}`, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    .replace(/\r\n/g, '\n');
}

const SRC = gitShow(REF, 'app.js');

if (!SRC.includes('const SACCADE_DIRECTION_CLINICAL_USE_ENABLED')) {
  console.error(`\nref '${REF}' predates RE-A containment — this suite has nothing to assert against.` +
    `\nRun it against a ref that contains the containment constants (e.g. HEAD).\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Render-layer harness: the two presentation consumers are self-contained.
// ---------------------------------------------------------------------------
// extractFunction's brace matcher starts at the signature's first '{', which for a
// destructured parameter list closes on the parameter object rather than the body.
// Anchor on the full signature (ending in the body's '{') instead.
function extractFnBySignature(src, signatureEndingInBrace) {
  const idx = src.indexOf(signatureEndingInBrace);
  if (idx === -1) throw new Error('signature not found: ' + signatureEndingInBrace);
  const end = HARNESS.matchBraceBlock(src, idx + signatureEndingInBrace.length - 1);
  return src.slice(idx, end);
}

function buildRenderHarness(src) {
  const parts = [
    HARNESS.extractLine(src, 'const NEV = '),
    extractFnBySignature(src, 'function renderRightEyeSection({ indicators, brainRegions, rx, priorityLines, ST_ICON, ST_LABEL }, standalone = false) {'),
    HARNESS.extractFunction(src, 'function _rxNoDataCard('),
    HARNESS.extractFunction(src, 'function _renderRightEyeCard('),
    'this.__render = { renderRightEyeSection, _renderRightEyeCard };',
  ].join('\n\n');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(parts, ctx, { filename: `app.js@${REF} (render slice)` });
  return ctx.__render;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const BASE = HARNESS.baseRxInput;

const DIRECTIONAL_LABELS = [
  '水平 Saccade 右向 Undershoot', '水平 Saccade 右向 Missed',
  '水平 Saccade 左向 Undershoot', '水平 Saccade 左向 Missed',
  '垂直 Saccade 上向 Overshoot', '垂直 Saccade 上向 Undershoot', '垂直 Saccade 上向 Missed',
  '垂直 Saccade 下向 Overshoot', '垂直 Saccade 下向 Undershoot', '垂直 Saccade 下向 Missed',
];

// 2026-08-17 reproduction: OD=9, OS=10, vTotal=24 (37.5% / 41.7% -> moderate)
const FX_0817 = { ...BASE, vTotal: 24, vOverR: 9, vOverL: 10 };
// AC-7: extraction returned 0/0 for a real vertical block
const FX_ZERO = { ...BASE, vTotal: 24, vOverR: 0, vOverL: 0 };
// AC-10: AI grade injected directly (P1-U AI branch)
const FX_P1U_GRADE = { ...BASE, hTotal: 10, hUnderR: 0, hUnderRGrade: 'moderate' };
// AC-14: no AI grade, numeric fallback would reach severe
const FX_P1U_NUMERIC = { ...BASE, hTotal: 10, hUnderR: 4, hUnderRGrade: null };
// AC-13: horizontal Missed + mirror
const FX_MISS_R = { ...BASE, hTotal: 10, hMissedR: 4, hMissedL: 0 };
const FX_MISS_L = { ...BASE, hTotal: 10, hMissedR: 0, hMissedL: 4 };
// AC-5: a non-directional abnormality must survive containment untouched
const FX_NONDIR = { ...BASE, spH: 55 };
// AC-15b: replay path nulls all four AI grades (app.js:9592)
const FX_REPLAY = { ...FX_P1U_GRADE, hOverRGrade: null, hUnderRGrade: null, hOverLGrade: null, hUnderLGrade: null };

// RE_A_MUTATION=1 disables containment for the "ON" harness as well, so the suite
// must go red. This is a mutation check on the assertions themselves — it proves
// the green run has evidential value. Test-side only; production source is never
// edited and the working tree stays clean.
const MUTATE = process.env.RE_A_MUTATION === '1';
const apiOn  = HARNESS.buildHarness(REF, { SACCADE_DIRECTION_CLINICAL_USE_ENABLED: MUTATE }); // containment ON (unless mutating)
const apiOff = HARNESS.buildHarness(REF, { SACCADE_DIRECTION_CLINICAL_USE_ENABLED: true  }); // containment OFF
if (MUTATE) console.log('*** RE_A_MUTATION=1 — containment disabled; this run MUST fail ***\n');
const render = buildRenderHarness(SRC);

const ind = (r, label) => r.indicators.find(i => i.label === label);
const dirInds = r => r.indicators.filter(i => DIRECTIONAL_LABELS.includes(i.label));
const rxNames = r => r.rx.map(e => `${e.mode} ${e.name} ${e.angle}`);
const notes = r => r.rx.flatMap(e => e.notes || []);

console.log(`\n=== RE-A containment ACs — ref=${REF} ===\n`);

// ---------------------------------------------------------------------------
// AC-11  live-path identity  (must run first: everything below depends on it)
// ---------------------------------------------------------------------------
{
  const defCount = (SRC.match(/^function computeRightEyeRx\(/gm) || []).length;
  check('AC-11a computeRightEyeRx has exactly one top-level definition',
    defCount === 1,
    `found ${defCount} definitions — the harness's indexOf extraction would pick an arbitrary one (N26 class)`);

  const r = apiOff.computeRightEyeRx(FX_0817);
  const upSt = ind(r, '垂直 Saccade 上向 Overshoot');
  check('AC-11b containment-off fixture actually activates the dangerous branch',
    upSt && upSt.status === 'moderate' && upSt.brain.includes('CB Vermis'),
    `expected moderate + CB Vermis with containment off, got ${JSON.stringify(upSt)} — a green test on an inert fixture proves nothing`);
}

// ---------------------------------------------------------------------------
// AC-1 / AC-9  chokepoint covers all three families, both axes
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx({ ...BASE, hTotal: 10, vTotal: 24, hUnderR: 4, hMissedR: 4, hUnderL: 4, hMissedL: 4, vOverR: 9, vUnderR: 9, vMissedR: 9, vOverL: 10, vUnderL: 10, vMissedL: 10 });
  const found = dirInds(r);
  check('AC-1 all directional statuses are NOT_EVALUABLE',
    found.length > 0 && found.every(i => i.status === 'nev'),
    `expected every directional indicator to be nev; got ${JSON.stringify(found.map(i => [i.label, i.status]))}`);
  check('AC-9 Overshoot + Undershoot + Missed families all covered',
    DIRECTIONAL_LABELS.every(l => { const i = ind(r, l); return i && i.status === 'nev'; }),
    `missing or non-nev: ${DIRECTIONAL_LABELS.filter(l => { const i = ind(r, l); return !i || i.status !== 'nev'; }).join(', ')}`);
  check('AC-2 no brain regions attributed from directional indicators',
    found.every(i => Array.isArray(i.brain) && i.brain.length === 0),
    `expected [] brain on every nev row; got ${JSON.stringify(found.map(i => [i.label, i.brain]))}`);
  check('AC-3 no M2/M3/M5 prescriptions from directional indicators',
    !rxNames(r).some(n => /CB Vermis|riMLF|PPRF|Left CB|Right CB|Superior Colliculus|SC /.test(n)),
    `unexpected directional Rx: ${rxNames(r).join(' | ')}`);
  check('AC-3b hemifield stimulation instruction (N27) not emitted',
    !notes(r).some(n => n.includes('視野側')),
    `unexpected hemifield instruction: ${notes(r).filter(n => n.includes('視野側')).join(' | ')}`);
  check('AC-4 raw measurement retained on nev rows',
    ind(r, '垂直 Saccade 上向 Overshoot').value === '37.5%' && ind(r, '水平 Saccade 右向 Missed').value === '80%',
    `expected raw percentages preserved; got up=${ind(r, '垂直 Saccade 上向 Overshoot').value} missR=${ind(r, '水平 Saccade 右向 Missed').value}`);
  check('AC-1b reason is row-level and canonical',
    found.every(i => i.reason === 'SACCADE_DIRECTION_SEMANTICS_UNRESOLVED') &&
      r.notEvaluableReasons.length === 1 && r.notEvaluableReasons[0] === 'SACCADE_DIRECTION_SEMANTICS_UNRESOLVED',
    `row reasons=${JSON.stringify([...new Set(found.map(i => i.reason))])} summary=${JSON.stringify(r.notEvaluableReasons)}`);
}

// ---------------------------------------------------------------------------
// AC-5  blast radius
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx(FX_NONDIR);
  const sp = r.indicators.find(i => /Smooth Pursuit|追隨|水平 SP/.test(i.label));
  check('AC-5 non-directional indicators unaffected by containment',
    !!sp && sp.status !== 'nev' && r.hasAbnormal === true && r.brainRegions.size > 0,
    `expected an untouched abnormal non-directional finding; sp=${JSON.stringify(sp)} hasAbnormal=${r.hasAbnormal} regions=${[...r.brainRegions]}`);
}

// ---------------------------------------------------------------------------
// AC-6  2026-08-17 regression fixture
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx(FX_0817);
  check('AC-6a 2026-08-17 fixture yields no CB Vermis from this pathway',
    ![...r.brainRegions].includes('CB Vermis'),
    `brainRegions=${JSON.stringify([...r.brainRegions])}`);
  check('AC-6b 2026-08-17 fixture yields no vertical M3',
    !rxNames(r).some(n => n.includes('垂直') && n.includes('CB Vermis')),
    `rx=${rxNames(r).join(' | ')}`);
  check('AC-6c 2026-08-17 fixture yields no Up/Down clinical indicator',
    ['垂直 Saccade 上向 Overshoot', '垂直 Saccade 下向 Overshoot'].every(l => ind(r, l).status === 'nev'),
    `up=${ind(r, '垂直 Saccade 上向 Overshoot').status} down=${ind(r, '垂直 Saccade 下向 Overshoot').status}`);
  check('AC-6d weakRegions excludes the suppressed attribution',
    !r.weakRegions.some(w => w.name === 'CB Vermis'),
    `weakRegions=${JSON.stringify(r.weakRegions.map(w => w.name))}`);
}

// ---------------------------------------------------------------------------
// AC-7  missing is not normal
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx(FX_ZERO);
  const up = ind(r, '垂直 Saccade 上向 Overshoot');
  check('AC-7 0/0 extraction is NOT_EVALUABLE, never NORMAL',
    up.status === 'nev' && r.hasNotEvaluable === true && r.hasAbnormal === false,
    `status=${up.status} hasNotEvaluable=${r.hasNotEvaluable} hasAbnormal=${r.hasAbnormal}`);
}

// ---------------------------------------------------------------------------
// AC-10 / AC-14  P1-U — AI grade branch and numeric fallback branch
// ---------------------------------------------------------------------------
{
  const rG = apiOn.computeRightEyeRx(FX_P1U_GRADE);
  check('AC-10 injected AI grade is contained',
    ind(rG, '水平 Saccade 右向 Undershoot').status === 'nev' &&
      ![...rG.brainRegions].includes('Left CB') &&
      !rxNames(rG).some(n => n.includes('R90') && n.includes('Left CB')),
    `status=${ind(rG, '水平 Saccade 右向 Undershoot').status} regions=${[...rG.brainRegions]} rx=${rxNames(rG).join(' | ')}`);

  const offG = apiOff.computeRightEyeRx(FX_P1U_GRADE);
  check('AC-10b containment-off proves the AI grade branch is live',
    ind(offG, '水平 Saccade 右向 Undershoot').status === 'moderate' && [...offG.brainRegions].includes('Left CB'),
    `containment-off did not activate the AI grade branch: ${JSON.stringify(ind(offG, '水平 Saccade 右向 Undershoot'))}`);

  const rN = apiOn.computeRightEyeRx(FX_P1U_NUMERIC);
  check('AC-14 numeric fallback (AI grade null) is contained',
    ind(rN, '水平 Saccade 右向 Undershoot').status === 'nev' && ![...rN.brainRegions].includes('Left CB'),
    `status=${ind(rN, '水平 Saccade 右向 Undershoot').status} regions=${[...rN.brainRegions]}`);

  const offN = apiOff.computeRightEyeRx(FX_P1U_NUMERIC);
  check('AC-14b containment-off proves the numeric fallback branch is live',
    ind(offN, '水平 Saccade 右向 Undershoot').status === 'severe' && [...offN.brainRegions].includes('Left CB'),
    `containment-off did not activate the numeric branch: ${JSON.stringify(ind(offN, '水平 Saccade 右向 Undershoot'))}`);
}

// ---------------------------------------------------------------------------
// AC-13  horizontal Missed + mirror
// ---------------------------------------------------------------------------
{
  const rR = apiOn.computeRightEyeRx(FX_MISS_R);
  check('AC-13a hMissedR contained — no Right PPRF / Left SC / R90 M5',
    ind(rR, '水平 Saccade 右向 Missed').status === 'nev' &&
      !['Right PPRF', 'Left SC'].some(x => [...rR.brainRegions].includes(x)) &&
      !rxNames(rR).some(n => n.includes('R90') && n.includes('PPRF')),
    `status=${ind(rR, '水平 Saccade 右向 Missed').status} regions=${[...rR.brainRegions]} rx=${rxNames(rR).join(' | ')}`);
  check('AC-13a2 no left-hemifield stimulation instruction',
    !notes(rR).some(n => n.includes('左視野側')),
    `notes=${notes(rR).join(' | ')}`);

  const rL = apiOn.computeRightEyeRx(FX_MISS_L);
  check('AC-13b mirror: hMissedL contained — no Left PPRF / Right SC / L90 M5',
    ind(rL, '水平 Saccade 左向 Missed').status === 'nev' &&
      !['Left PPRF', 'Right SC'].some(x => [...rL.brainRegions].includes(x)) &&
      !rxNames(rL).some(n => n.includes('L90') && n.includes('PPRF')),
    `status=${ind(rL, '水平 Saccade 左向 Missed').status} regions=${[...rL.brainRegions]} rx=${rxNames(rL).join(' | ')}`);
  check('AC-13b2 no right-hemifield stimulation instruction',
    !notes(rL).some(n => n.includes('右視野側')),
    `notes=${notes(rL).join(' | ')}`);

  const offR = apiOff.computeRightEyeRx(FX_MISS_R);
  check('AC-13c containment-off proves the Missed branch is live (priority 1)',
    [...offR.brainRegions].includes('Right PPRF') &&
      offR.rx.some(e => e.priority === 1 && (e.notes || []).some(n => n.includes('左視野側'))),
    `containment-off did not activate the Missed branch: regions=${[...offR.brainRegions]}`);
}

// ---------------------------------------------------------------------------
// AC-8  presentation contract (renderRightEyeSection)
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx(FX_0817);
  const html = render.renderRightEyeSection(r);
  check('AC-8a nev rows are not filtered out of the table',
    html.includes('垂直 Saccade 上向 Overshoot'),
    'nev row missing from rendered table — containment would be indistinguishable from normal');
  check('AC-8b nev rows render an explicit NOT_EVALUABLE label, not undefined',
    html.includes('不可評估') && html.includes('⛔') && !html.includes('undefined'),
    `rendered cell is wrong; contains undefined=${html.includes('undefined')}`);
  check('AC-8c nev rows carry no brain-region tag',
    !/垂直 Saccade 上向 Overshoot[\s\S]{0,600}?CB Vermis/.test(html),
    'a brain-region tag was rendered on a nev row');
  check('AC-8d nev row is not labelled normal',
    !/垂直 Saccade 上向 Overshoot[\s\S]{0,400}?>正常</.test(html),
    'nev row rendered with the 正常 label');
}

// ---------------------------------------------------------------------------
// AC-15  persistence fidelity (a) and recompute consistency (b)
// ---------------------------------------------------------------------------
{
  // (a) write-shape is taken verbatim from the single persistence site (app.js:7411)
  const mapLine = SRC.split('\n').find(l => l.includes('reRec.indicators') && l.includes('rxResult.indicators.map'));
  check('AC-15a1 persistence mapping carries status and reason',
    !!mapLine && /status:\s*i\.status/.test(mapLine) && /reason:\s*i\.reason/.test(mapLine),
    `persistence mapping line does not preserve both fields: ${mapLine}`);

  const r = apiOn.computeRightEyeRx(FX_0817);
  const persisted = JSON.parse(JSON.stringify(
    r.indicators.map(i => ({ label: i.label, value: i.value, status: i.status, brain: i.brain, note: i.note, reason: i.reason }))
  ));
  const back = persisted.find(i => i.label === '垂直 Saccade 上向 Overshoot');
  check('AC-15a2 round-trip preserves nev status and reason (no coercion to na)',
    back.status === 'nev' && back.reason === 'SACCADE_DIRECTION_SEMANTICS_UNRESOLVED',
    `round-tripped row: ${JSON.stringify(back)}`);

  const card = render._renderRightEyeCard({ date: '2026-08-17', indicators: persisted, brainRegions: [...r.brainRegions] });
  check('AC-15a3 read-back consumer surfaces NOT_EVALUABLE, not 無異常',
    card.includes('不可評估') && !card.includes('無異常'),
    `_renderRightEyeCard output claims no abnormality: ${card.includes('無異常')}`);

  // (b) replay recomputes from raw counts with all four AI grades nulled (app.js:9592)
  const rep = apiOn.computeRightEyeRx(FX_REPLAY);
  check('AC-15b recompute path still NOT_EVALUABLE (numeric/unresolved semantics only)',
    ind(rep, '水平 Saccade 右向 Undershoot').status === 'nev' && rep.hasNotEvaluable === true,
    `replay status=${ind(rep, '水平 Saccade 右向 Undershoot').status}`);
}

// ---------------------------------------------------------------------------
// AC-16  live summary consumers must not claim "all normal"
// ---------------------------------------------------------------------------
{
  const r = apiOn.computeRightEyeRx(FX_ZERO); // no abnormal, >=1 not-evaluable
  check('AC-16 precondition: fixture has no abnormal and at least one NOT_EVALUABLE',
    r.hasAbnormal === false && r.hasNotEvaluable === true && r.notEvaluableCount > 0,
    `hasAbnormal=${r.hasAbnormal} hasNotEvaluable=${r.hasNotEvaluable} count=${r.notEvaluableCount}`);

  // 10781 — behavioural, the function is self-contained
  const card = render._renderRightEyeCard({
    date: '2026-08-22',
    indicators: r.indicators.map(i => ({ label: i.label, value: i.value, status: i.status, brain: i.brain, note: i.note, reason: i.reason })),
    brainRegions: [...r.brainRegions],
  });
  check('AC-16c _renderRightEyeCard (live) does not render 無異常',
    !card.includes('無異常') && card.includes('不可評估'),
    `card output: ${card.slice(0, 400)}`);

  // 5281 / 7224 — source contract on the live definitions (both are DOM-bound).
  const bcfBody = HARNESS.extractFunction(SRC, 'function generateBCFResults()');
  check('AC-16a generateBCFResults gates the RightEye section on hasNotEvaluable too',
    /reResult\.hasAbnormal\s*\|\|\s*reResult\.hasNotEvaluable/.test(bcfBody),
    'RightEye section is still gated on hasAbnormal alone — a not-evaluable-only result would render nothing');

  const standaloneBody = HARNESS.extractFunction(SRC, 'function analyzeRightEyeStandalone()');
  const normalIdx = standaloneBody.indexOf('所有指標均在正常範圍');
  const guardIdx = standaloneBody.indexOf('!reResult.hasAbnormal && !reResult.hasNotEvaluable');
  check('AC-16b analyzeRightEyeStandalone guards the all-normal panel with hasNotEvaluable',
    guardIdx !== -1 && normalIdx !== -1 && guardIdx < normalIdx,
    'the 所有指標均在正常範圍 panel is not guarded by !hasNotEvaluable');
  check('AC-16b2 analyzeRightEyeStandalone has a distinct not-evaluable branch',
    standaloneBody.includes('部分 RightEye 方向性指標目前不可評估'),
    'no NOT_EVALUABLE summary branch found');

  // N25 guard: the dormant consumers must remain unpatched.
  const deadBody = HARNESS.extractFunction(SRC, 'function generateIntegratedPrescription()');
  check('AC-16d dormant consumers in the shadowed function were left unpatched (N25)',
    !deadBody.includes('hasNotEvaluable'),
    'the shadowed generateIntegratedPrescription() was patched — that inflates apparent blast radius (N25/N26 class)');
}

// ---------------------------------------------------------------------------
// AC-12  negative control
// ---------------------------------------------------------------------------
{
  const r = apiOff.computeRightEyeRx(FX_0817);
  const wouldFail =
    [...r.brainRegions].includes('CB Vermis') &&
    ind(r, '垂直 Saccade 上向 Overshoot').status === 'moderate' &&
    rxNames(r).some(n => n.includes('垂直') && n.includes('CB Vermis'));
  check('AC-12 negative control: removing containment makes AC-6 fail',
    wouldFail,
    'with containment off the suppressed outputs did NOT reappear — the passing ACs above have no proof value');

  const rM = apiOff.computeRightEyeRx(FX_MISS_R);
  check('AC-12b negative control covers the Missed family too',
    [...rM.brainRegions].includes('Right PPRF') && ind(rM, '水平 Saccade 右向 Missed').status === 'severe',
    'containment-off did not restore the Missed pathway');
}

// ---------------------------------------------------------------------------
console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failed) {
  console.log('\nFailures:\n  ' + failures.join('\n  ') + '\n');
  process.exit(1);
}
process.exit(0);
