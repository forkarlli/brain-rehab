# Saccade / Fastigial / Dentate Rx pipeline — golden baseline

## Purpose

Frozen, pre-P0-A golden baseline for the fastigial/dentate-nucleus-triggered Rx
pipeline in `app.js`. Exists so P0-C through P0-F (and any later phase touching
`normalizeBrainRegion()`, the `EYERX_ALIASES` expansion, or `computeEyeMachineRx`)
can be regression-checked against known-good clinical output instead of relying on
manual code review alone.

## Files

| File | Contents |
|---|---|
| `rx_baseline_pre_schema_v2.json` | The frozen baseline data (7 scenarios: S1–S7). |
| `rx_baseline_pre_schema_v2.sha256` | SHA-256 of the JSON above (`sha256sum -c rx_baseline_pre_schema_v2.sha256` to verify integrity). |
| `harness/dump_baseline.js` | The runtime harness that produced this file. Also used to re-dump and compare against any other commit. |

## Generated from

**Runtime dump, not a manual code trace.** `harness/dump_baseline.js` extracts the
real source text of the relevant functions verbatim from `git show <ref>:app.js`
(via string/brace matching — never retyped or reimplemented), loads them into an
isolated Node `vm` context, and invokes them with synthetic inputs. The JSON below
is literally what those functions returned.

An earlier manual-code-trace attempt at this same baseline missed two entries that
only real execution caught: a generic `M1｜Pursuit均速` addRx row in
`computeRightEyeRx` (fires on `(intAbn||syncAbn) && !spHAbn && !spVAbn`, unrelated
to Fastigial specifically) and the same `M1｜Pursuit均速` row inside
`computeEyeMachineRx` (fires on `hasAnyEye`, independent of the `hasCB` gates that
carry the Fastigial-specific M3/M4 logic). Both are present in this baseline. The
Fastigial-specific values predicted by manual trace (M3 angle
`R0/L0（上下，雙側）`, M4 angle `R45/L45（雙側 CB）`, M8 correctly absent) were
independently confirmed correct by the real run.

## Source commit

`0a27543` (= `ddd14b4^`, the immediate parent of the P0-A commit `ddd14b4`).
Confirmed byte-identical `app.js` blob back through `ae57d37` / `5a693fc`
(SHA-256 of that `app.js` blob: `1dc7f95fd544a743df4d3bcbe30c18c1bda9e729f23a3aeda9d32ac9a5afe157`).
This is the "post-P0-alias-fix / pre-P0-A" state — the alias split (Fastigial vs.
Dentate as separate canonicals) is already in effect; `normalizeBrainRegion()`
still returns a bare string (pre-schema).

## SHA-256 (full)

```
182e25bd8cc0b6175fa84e5eb26a8f9794627e726ad97c9fd28e48881035be12  rx_baseline_pre_schema_v2.json
```

## Covered layers

1. **Intrusion layer** (`computeRightEyeRx`) — `rx_scenarios.S1`–`S4b`. Direct
   addRx generation from RightEye intrusion readings (horizontal/up/down ×
   large/medium/small amplitude).
2. **Cross-module normalization layer** (`runIntegratedAnalysis` brainRegionMap
   loop, `computeConsistency`, `extractDomainRegions`) —
   `integration_scenarios.S5`–`S7`. This is the layer P0-A actually changed
   (`normalizeBrainRegion()` return type). Confirms no `[object Object]` key
   collapse and correct `regionId`/`legacyRegionLabel` behavior downstream.
3. **EYERX / `computeEyeMachineRx` layer** — the `eyerx_layer` field nested in
   each `integration_scenarios.S5`–`S7` entry. `EYERX_ALIASES` expansion (adds
   `Right CB`/`Left CB` when Fastigial is present; does **not** expand Dentate)
   feeding the `hasCB`-gated M3/M4/M8 addRx rules. This is the layer P0-D is
   expected to change (`resolveEyeRxRegions`) — not touched by P0-A.

## Node version

Captured with `v24.17.0`. The harness has no external dependencies (Node core
`fs`/`child_process`/`vm` only), so any reasonably current Node should reproduce
identical output, but v24.17.0 is the version of record if a discrepancy ever
needs to be triaged.

## Rerun command

```
node tests/baselines/saccade_pipeline/harness/dump_baseline.js 0a27543
```

Run from the repo root. Prints the freshly-dumped JSON to stdout (does **not**
touch the committed baseline file).

## Compare command

```
node tests/baselines/saccade_pipeline/harness/dump_baseline.js <ref> --compare tests/baselines/saccade_pipeline/rx_baseline_pre_schema_v2.json
```

Dumps the pipeline at `<ref>` (e.g. `HEAD`, or a P0-C/D/E/F feature branch tip)
and diffs each scenario against the committed baseline. Prints `PASS`/`FAIL` per
scenario and exits non-zero on any mismatch.

## Expected policy

P0-C through P0-F must reproduce **zero clinical diff** against this baseline via
the compare command above, unless a diff is explicitly approved by PM/ChatGPT as
an intended behavior change for that phase — in which case a new baseline version
is committed (see anti-overwrite clause below), not a silent update to this one.

## Anti-overwrite clause

**This file must never be silently regenerated or overwritten by a test run.**
It is a frozen snapshot, not a live fixture. `harness/dump_baseline.js` writes to
stdout only — it never writes to `rx_baseline_pre_schema_v2.json` directly, by
design, so that running the harness can never accidentally clobber the golden
baseline it's being compared against. Any intentional update to the baseline
itself requires: a new PM-approved packet, a PHI hard-check re-run, a new
independent commit, and a freshly computed SHA-256 recorded in a new version of
this README — never an in-place overwrite of the existing file.

## PHI/PII

All scenario inputs are synthetic literals (`S1`–`S7` defined directly in
`harness/dump_baseline.js`), never sourced from `DB.assessments`/`getPatient` or
any real patient record. Verified via grep (email pattern, phone-number pattern,
`patientId`/病歷/身分證/姓名/DOB/electron/address keywords, real-looking dates) —
zero matches other than the harness's own `_meta` generation timestamps.
