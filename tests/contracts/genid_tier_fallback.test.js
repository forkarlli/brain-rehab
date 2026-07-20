#!/usr/bin/env node
'use strict';
// X-ZERO-A: genId three-tier UUID generator — STAGE 1 acceptance contract.
//
// genId(prefix) now degrades crypto.randomUUID -> crypto.getRandomValues ->
// a non-cryptographic high-entropy fallback, and must never throw and never
// fall back to the old six-digit-timestamp scheme (that scheme is the bug
// this replaces: 10^6 ID space cycling every 16.67 minutes).
//
// This is a static-source-load contract test, not a hand-reimplementation
// of genId. It slices the actual genId block out of app.js (same technique
// as fastigial_form_pipeline_boundary.test.js) and runs it for real inside
// a fresh vm context per scenario, so a regression in the real file fails
// this test — testing a copy would not catch that.
//
// Each vm.createContext() call is a fresh "page load": genId's module-scope
// counter and per-tier warn flags start clean, matching the real browser
// lifecycle (this state is meant to live for one page load, not reset per
// call). crypto/performance/Date are explicitly injected per scenario so
// tier selection does not depend on which Node version runs this file.
//
// Exit code 0 = every check held. Exit code 1 = a contract broke, with a
// message telling a future author WHY, not just WHAT.

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

// ---- source extraction (same brace-matching technique as the FP contract test) ----
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

// Anchored to the `let` state block, not the "===== X-ZERO-A" comment —
// the state must be declared before genId() (TDZ hardening), so the
// comment now sits AFTER these lines. Extraction must start here to
// include the module-scope state at all.
const GENID_START_MARKER = 'let _genIdTier2WarnEmitted = false;';
const GENID_END_MARKER = 'const avatarColors';

function extractGenIdSource() {
  const startIdx = APP_JS.indexOf(GENID_START_MARKER);
  if (startIdx === -1) throw new Error('GENID_START_MARKER not found — genId block header changed, update this test.');
  const endIdx = APP_JS.indexOf(GENID_END_MARKER, startIdx);
  if (endIdx === -1) throw new Error('GENID_END_MARKER not found after genId block — update this test.');
  // sanity: the block must actually contain a balanced function genId(prefix) {...}
  const fnIdx = APP_JS.indexOf('function genId(prefix)', startIdx);
  if (fnIdx === -1 || fnIdx > endIdx) throw new Error('function genId(prefix) not found inside extracted block.');
  matchBraceBlock(APP_JS, fnIdx); // throws if unbalanced
  return APP_JS.slice(startIdx, endIdx);
}

const GENID_SOURCE = extractGenIdSource();

// ---- sandbox helpers ----
function makeMockConsole() {
  const calls = { warn: [], error: [], log: [] };
  return {
    console: {
      warn: (...a) => calls.warn.push(a),
      error: (...a) => calls.error.push(a),
      log: (...a) => calls.log.push(a),
    },
    calls,
  };
}

// Loads a fresh instance of genId (fresh counter/warn-flag state = fresh
// "page load") into a new vm context with the given crypto/performance/Date
// overrides. Omitted overrides fall through to the realm's own real
// intrinsics (Math/Date are ECMA-262 built-ins present in every realm
// automatically; crypto/performance/console are Node/browser additions and
// must be explicitly supplied or genId's `typeof x !== 'undefined'` checks
// correctly see them as absent).
function loadGenId({ crypto, performance, Date: DateOverride, Math: MathOverride } = {}) {
  const { console: mockConsole, calls } = makeMockConsole();
  const sandbox = { console: mockConsole };
  if (crypto !== undefined) sandbox.crypto = crypto;
  if (performance !== undefined) sandbox.performance = performance;
  if (DateOverride !== undefined) sandbox.Date = DateOverride;
  if (MathOverride !== undefined) sandbox.Math = MathOverride;
  const context = vm.createContext(sandbox);
  vm.runInContext(GENID_SOURCE, context);
  return { genId: context.genId, calls };
}

const CANONICAL_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIER3_SHAPE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-0[0-9a-f]{3}-0[0-9a-f]{3}-[0-9a-f]{12}$/;
const LEGACY_RE = /^(A|MTT|RE|BCF|IP|RX|S)\d{6}$/;

const CALL_SITE_PREFIXES = ['MTT', 'BCF', 'RE', 'A', 'IP', 'RX', 'S']; // 7 distinct (A used at 2 call sites)

// =============================================================================
// Test 1: Tier 1 forced (crypto.randomUUID available)
// =============================================================================
{
  const FIXED_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  check('Test 1 setup: fixed stub UUID is itself canonical v4-shaped', CANONICAL_V4_RE.test(FIXED_UUID),
    'test bug: the hardcoded stub does not match canonical v4 shape');

  const { genId, calls } = loadGenId({ crypto: { randomUUID: () => FIXED_UUID } });
  const id = genId('A');
  check('Test 1: Tier 1 relays crypto.randomUUID() verbatim, bare-concatenated', id === 'A' + FIXED_UUID,
    `expected 'A${FIXED_UUID}', got '${id}'`);
  check('Test 1: prefix segment byte-identical (no separator)', id[1] !== '-',
    `separator inserted after prefix: ${id}`);
  check('Test 1: no Tier 2/3 warning fired (proves Tier 1 path only, no fallthrough)', calls.warn.length === 0,
    `expected 0 warnings, got ${calls.warn.length}: ${JSON.stringify(calls.warn)}`);
}

// =============================================================================
// Test 2: Tier 2 forced (randomUUID unavailable, getRandomValues available)
// =============================================================================
{
  const cryptoStub = {
    getRandomValues: (typedArray) => {
      for (let i = 0; i < typedArray.length; i++) typedArray[i] = Math.floor(Math.random() * 256);
      return typedArray;
    },
  };
  const { genId, calls } = loadGenId({ crypto: cryptoStub });
  const id = genId('RE');
  const payload = id.slice('RE'.length);
  check('Test 2: does not throw and returns a string', typeof id === 'string', `genId threw or returned non-string`);
  check('Test 2: payload is canonical v4 shape (version=4, variant correct)', CANONICAL_V4_RE.test(payload),
    `payload '${payload}' is not canonical v4 shape`);
  check('Test 2: prefix segment byte-identical (no separator)', id[2] !== '-',
    `separator inserted after prefix: ${id}`);
  check('Test 2: exactly one Tier 2 warning fired', calls.warn.length === 1,
    `expected exactly 1 warning, got ${calls.warn.length}: ${JSON.stringify(calls.warn)}`);
}

// =============================================================================
// Test 3: Tier 3 forced (crypto completely unavailable)
// =============================================================================
{
  const { genId, calls } = loadGenId({ crypto: undefined });
  const id = genId('BCF');
  const payload = id.slice('BCF'.length);
  check('Test 3: does not throw and returns a string', typeof id === 'string', `genId threw or returned non-string`);
  check('Test 3: payload is not the legacy six-digit-timestamp shape', !/^\d{6}$/.test(payload),
    `payload regressed to legacy six-digit shape: ${payload}`);
  check('Test 3: payload matches Tier 3 shape (version=0, variant=0)', TIER3_SHAPE_RE.test(payload),
    `payload '${payload}' does not match Tier 3 shape xxxxxxxx-xxxx-0xxx-0xxx-xxxxxxxxxxxx`);
  check('Test 3: version nibble is 0, not 4 (distinguishes from Tier 1/2 output)', payload[14] === '0',
    `expected '0' at version position (index 14, after the 2nd hyphen), got '${payload[14]}' in ${payload}`);
  check('Test 3: prefix segment byte-identical (no separator)', id[3] !== '-',
    `separator inserted after prefix: ${id}`);
  check('Test 3: exactly one Tier 3 warning fired', calls.warn.length === 1,
    `expected exactly 1 warning, got ${calls.warn.length}: ${JSON.stringify(calls.warn)}`);
}

// =============================================================================
// Test 4-A: Tier 3 burst, Date.now() frozen, Math.random/performance real
// =============================================================================
{
  const FIXED_MS = 1752470400000; // arbitrary fixed instant
  const { genId } = loadGenId({ crypto: undefined, Date: { now: () => FIXED_MS } });
  const ids = new Set();
  for (let i = 0; i < 1000; i++) ids.add(genId('A'));
  check('Test 4-A: 1000 Tier 3 IDs under frozen Date.now() are all unique', ids.size === 1000,
    `expected 1000 unique IDs, got ${ids.size} unique out of 1000 generated`);
}

// =============================================================================
// Test 4-B: Tier 3 full freeze — Date.now(), performance.now(), Math.random()
// all fixed. Only the monotonic counter can differentiate consecutive IDs.
// Per the STAGE 1 contract: this test failing while 4-A passes means the
// counter is not actually surviving encoding (§2.5) and the real
// collision-breaker was random/time, not the counter — that is a STAGE 1
// FAIL, not an environment quirk to wave off.
// =============================================================================
{
  const FIXED_MS = 1752470400000;
  const FIXED_PERF = 12345.6789;
  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0.123456789; // constant — every call returns the same value

  const { genId } = loadGenId({
    crypto: undefined,
    Date: { now: () => FIXED_MS },
    performance: { now: () => FIXED_PERF },
    Math: fixedMath,
  });
  const ids = [];
  for (let i = 0; i < 1000; i++) ids.push(genId('S'));
  const uniqueCount = new Set(ids).size;
  check('Test 4-B: 1000 Tier 3 IDs under FULLY frozen time+random are still all unique (counter-only differentiation)',
    uniqueCount === 1000,
    `only ${uniqueCount}/1000 unique — the monotonic counter is not surviving encoding as required by §2.5; ` +
    `with Date.now/performance.now/Math.random all frozen, the counter is the ONLY remaining source of ` +
    `difference between calls, so any collision here means counter contribution is being lost (e.g. masked, ` +
    `overwritten, or never actually reaching the final payload string).`);
}

// =============================================================================
// Test 5: prefix misuse (falsy prefix)
// =============================================================================
{
  const { genId, calls } = loadGenId({ crypto: { randomUUID: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } });
  let threw = false;
  let id;
  try {
    id = genId(undefined);
  } catch (e) {
    threw = true;
  }
  check('Test 5: genId(undefined) does not throw', !threw, 'genId threw on falsy prefix — must never throw');
  check('Test 5: falsy prefix falls back to UNK-prefixed id', !threw && id.startsWith('UNK'),
    `expected id to start with 'UNK', got '${id}'`);
  check('Test 5: UNK fallback is also bare-concatenated (no separator)', !threw && id[3] !== '-',
    `separator inserted after UNK fallback prefix: ${id}`);
  check('Test 5: console.error was called for the falsy-prefix case', calls.error.length === 1,
    `expected exactly 1 console.error call, got ${calls.error.length}`);
}

// =============================================================================
// Test 6: byte-identity full coverage across all 7 distinct call-site
// prefixes, under both Tier 1 and Tier 3 (the two structurally different
// payload generators — genId's `return prefix + _genIdPayload();` line is
// shared by all 3 tiers, so covering Tier 1 and Tier 3 payload shapes is
// sufficient to prove the bare-concatenation wrapper itself never varies).
// =============================================================================
function runByteIdentitySweep(label, cryptoOverride) {
  const { genId } = loadGenId({ crypto: cryptoOverride });
  for (const prefix of CALL_SITE_PREFIXES) {
    const legacySample = prefix + '123456';
    check(`Test 6 setup (${label}): legacy sample format sanity for '${prefix}'`, LEGACY_RE.test(legacySample),
      `constructed legacy sample doesn't match legacy pattern: ${legacySample}`);

    const newId = genId(prefix);
    check(`Test 6 (${label}, prefix='${prefix}'): prefix segment byte-identical to legacy prefix segment`,
      newId.slice(0, prefix.length) === legacySample.slice(0, prefix.length),
      `mismatch: newId='${newId}' legacySample='${legacySample}'`);
    check(`Test 6 (${label}, prefix='${prefix}'): no separator immediately after prefix`,
      newId[prefix.length] !== '-',
      `separator inserted right after prefix '${prefix}': ${newId}`);
  }
}
runByteIdentitySweep('Tier 1', { randomUUID: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
runByteIdentitySweep('Tier 3', undefined);

// =============================================================================
// Test 7: warn-flag independence. Tier 2 called twice (only 1st warns), then
// crypto is mutated mid-flight on the SAME live context to force Tier 3,
// called twice (only 1st warns) — proving the two flags are independent,
// not a single shared flag that would let an earlier Tier 2 warning
// silently suppress the more severe Tier 3 one. genId re-checks
// `typeof crypto` fresh on every call, so mutating sandbox.crypto between
// calls on the same context is a valid same-page-load Tier 2 -> Tier 3
// transition (this needs direct access to the live sandbox object, so it's
// built inline rather than via loadGenId()).
// =============================================================================
{
  const { console: mockConsole, calls } = makeMockConsole();
  const cryptoTier2 = {
    getRandomValues: (typedArray) => {
      for (let i = 0; i < typedArray.length; i++) typedArray[i] = Math.floor(Math.random() * 256);
      return typedArray;
    },
  };
  const sandbox = { console: mockConsole, crypto: cryptoTier2 };
  const context = vm.createContext(sandbox);
  vm.runInContext(GENID_SOURCE, context);

  context.genId('MTT'); // Tier 2, call 1 -> warn #1
  check('Test 7: Tier 2 first call warns', calls.warn.length === 1,
    `expected 1 warning after Tier 2 call 1, got ${calls.warn.length}`);

  context.genId('BCF'); // Tier 2, call 2 -> should NOT warn again
  check('Test 7: Tier 2 second call does not warn again', calls.warn.length === 1,
    `expected still 1 warning after Tier 2 call 2 (repeat suppression), got ${calls.warn.length}`);

  sandbox.crypto = undefined; // simulate crypto disappearing -> forces Tier 3
  context.genId('A'); // Tier 3, call 1 -> should warn (independent flag, NOT suppressed by Tier 2's flag)
  check('Test 7: Tier 3 first call warns independently of Tier 2 flag', calls.warn.length === 2,
    `expected 2 warnings total after first Tier 3 call (Tier 2 flag must not suppress Tier 3), got ${calls.warn.length}`);

  context.genId('IP'); // Tier 3, call 2 -> should NOT warn again
  check('Test 7: Tier 3 second call does not warn again', calls.warn.length === 2,
    `expected still 2 warnings after Tier 3 call 2 (repeat suppression), got ${calls.warn.length}`);
}

console.log();
if (failures > 0) {
  console.log(`${failures} genId tier-fallback contract check(s) failed.`);
  process.exit(1);
} else {
  console.log('All genId tier-fallback contract checks passed.');
  process.exit(0);
}
