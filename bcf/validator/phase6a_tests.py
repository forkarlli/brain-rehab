#!/usr/bin/env python3
"""
Phase 6A Validator — Stage 1 + Stage 2 negative + positive test suite.

Uses synthetic fixtures in temp dirs. NEVER mutates the real frozen artifacts (incl. Core-24).
Covers: Stage-1 21 tests (loader/PG-01/02/03) + Stage-2 20 tests (PG-6A-04: INV-CORE24-1 integrity,
INV-P5-1 coverage) + Core-24 read-only before/after evidence tests.
Each test asserts gate result, invariant result, failure class, evidence, and audit presence.
"""
import os, json, copy, hashlib, tempfile
import phase6a_validator as V

BASE = os.path.dirname(os.path.abspath(__file__))

def _loadj_path(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def _resolve(rel_path):
    return os.path.normpath(os.path.join(BASE, rel_path))

# B+ii resolver pattern preserved (SA ruling 2026-07-27): fixture LOCATIONS stay declarative — never
# hard-coded in Python. SA ruling 2026-07-28 (Option D): the legacy Stage-1+2 seed fixtures resolve
# through a SEPARATE test-only fixture manifest (this suite's single fixture-location truth), NOT the
# runtime authority manifest — so the Stage-3E rebind (L3_ITEM_CLASS_REGISTRY->v1.1) and rename
# (L3_NPI_QUESTION_BANK->L3_NPI_MAPPING_REFERENCE) cannot perturb these v0.1-seed fixtures.
# Fail-closed: every fixture is hash-verified against its declared sha256 BEFORE parse; no fallback to
# the runtime manifest, no bare-filename search, no auto-update of expected hashes.
TEST_FIXTURE_MANIFEST = _loadj_path(os.path.join(BASE, "phase6a_test_fixture_manifest.json"))

def _fixture_bytes(fixture_id):
    spec = TEST_FIXTURE_MANIFEST["fixtures"][fixture_id]
    path = _resolve(spec["path"])
    with open(path, "rb") as f:
        raw = f.read()
    actual = hashlib.sha256(raw).hexdigest()
    if actual != spec["sha256"]:
        raise RuntimeError("fixture hash mismatch: %s: expected=%s actual=%s"
                           % (fixture_id, spec["sha256"], actual))
    return raw

# The runtime authority manifest is still loaded, but ONLY as the template make_env() clones to build
# each synthetic per-test manifest — never as a legacy fixture source.
BASEMAN = _loadj_path(os.path.join(BASE, "phase6a_validator_manifest.json"))

REG0 = json.loads(_fixture_bytes("LEGACY_L3_ITEM_CLASS_REGISTRY").decode("utf-8"))
KG0 = json.loads(_fixture_bytes("L3_KNOWLEDGE_GRAPH").decode("utf-8"))
QB0 = _fixture_bytes("LEGACY_NPI_QUESTION_BANK").decode("utf-8")
MDM = _loadj_path(os.path.join(BASE, "phase6a_required_metadata_manifest.json"))
CORE24_FROZEN = json.loads(_fixture_bytes("CORE24_V1_0").decode("utf-8"))

def sha_b(b): return hashlib.sha256(b).hexdigest()

# ---- Core-24 fixture mutators (never touch the real frozen Core-24) ----
def c24_top(**changes):
    c = copy.deepcopy(CORE24_FROZEN); c.update(changes); return c

def c24_items(fn):
    c = copy.deepcopy(CORE24_FROZEN); c["items"] = fn([copy.deepcopy(i) for i in c["items"]]); return c

def _drop(items, iid): return [i for i in items if i["item_id"] != iid]
def _swap(items, out_id, in_item): return [in_item if i["item_id"] == out_id else i for i in items]
def _item(iid, cls, dom): return {"item_id": iid, "item_class": cls, "domain": dom, "anat_primary": [], "is_phenotype": cls == "NON_LOCALIZING_PHENOTYPE", "mandatory": False}

def make_env(tmp, registry_obj=None, registry_raw=None, kg_obj=None, qb_text=None,
             break_hash=None, drop_version=None, missing=None,
             core24_obj=None, core24_raw=None, core24_missing=False, core24_break_hash=False):
    reg_bytes = registry_raw.encode() if registry_raw is not None else \
        json.dumps(REG0 if registry_obj is None else registry_obj, ensure_ascii=False, indent=1).encode()
    kg_bytes = json.dumps(KG0 if kg_obj is None else kg_obj, ensure_ascii=False, indent=1).encode()
    qb_bytes = (QB0 if qb_text is None else qb_text).encode()
    core_bytes = core24_raw.encode() if core24_raw is not None else \
        json.dumps(CORE24_FROZEN if core24_obj is None else core24_obj, ensure_ascii=False, indent=1).encode()
    open(os.path.join(tmp, "registry.json"), "wb").write(reg_bytes)
    open(os.path.join(tmp, "kg.json"), "wb").write(kg_bytes)
    open(os.path.join(tmp, "qb.md"), "wb").write(qb_bytes)
    open(os.path.join(tmp, "core24.json"), "wb").write(core_bytes)
    json.dump(MDM, open(os.path.join(tmp, "mdm.json"), "w", encoding="utf-8"), ensure_ascii=False)
    man = copy.deepcopy(BASEMAN)
    arts = [
        {"artifact_id": "L3_ITEM_CLASS_REGISTRY", "path": "registry.json", "format": "json",
         "declared_version": "test", "sha256": sha_b(reg_bytes),
         "source_status": "VERIFIED_SEED_NON_RELEASE_ELIGIBLE", "release_eligible": False},
        {"artifact_id": "L3_KNOWLEDGE_GRAPH", "path": "kg.json", "format": "json",
         "declared_version": "test", "sha256": sha_b(kg_bytes),
         "source_status": "PHASE4_FROZEN_BASELINE", "release_eligible": True},
        {"artifact_id": "L3_NPI_QUESTION_BANK", "path": "qb.md", "format": "markdown",
         "declared_version": "v0.2", "sha256": sha_b(qb_bytes),
         "source_status": "DRAFT_PINNED_RECON_FIXTURE", "release_eligible": False},
    ]
    if break_hash:
        for a in arts:
            if a["artifact_id"] == break_hash: a["sha256"] = "0" * 64
    if drop_version:
        for a in arts:
            if a["artifact_id"] == drop_version: a["declared_version"] = None
    if missing:
        for a in arts:
            if a["artifact_id"] == missing: a["path"] = "does_not_exist.json"
    man["artifacts"] = arts
    # Core-24 binding (owned by INV-CORE24-1, not the loader). frozen_sha256 defaults to the
    # fixture's own hash so semantic mutations isolate their check; core24_break_hash forces mismatch.
    man["core24_binding"]["path"] = "core24_missing.json" if core24_missing else "core24.json"
    man["core24_binding"]["frozen_sha256"] = ("0" * 64) if core24_break_hash else sha_b(core_bytes)
    # --- Stage-3E legacy scoping (SA 2026-07-28): this suite exercises the Stage-1+2 engine only.
    # Scope the cloned runtime manifest back to the Stage-1+2 gate/invariant set so PG-6A-1B and the
    # Stage-3E authority binding do not run against these v0.1-seed synthetic fixtures. Operates ONLY
    # on the per-test synthetic manifest; the production runtime manifest is never modified. ---
    man["gate_order"] = ["PG-6A-01", "PG-6A-02", "PG-6A-03", "PG-6A-04"]
    man["gate_invariants"] = {
        "PG-6A-01": ["INV-RESOURCE-1", "INV-VERSION-1"],
        "PG-6A-02": ["INV-ID-1", "INV-META-1", "INV-CLASS-2", "INV-KG-1", "INV-KG-2"],
        "PG-6A-03": ["INV-CLASS-1"],
        "PG-6A-04": ["INV-CORE24-1", "INV-P5-1"],
    }
    _keep = {"INV-RESOURCE-1", "INV-VERSION-1", "INV-ID-1", "INV-META-1", "INV-CLASS-2",
             "INV-KG-1", "INV-KG-2", "INV-CLASS-1", "INV-CORE24-1", "INV-P5-1"}
    man["invariants"] = [i for i in man["invariants"] if i["invariant_id"] in _keep]
    man.pop("authority_binding", None)
    json.dump(man, open(os.path.join(tmp, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False)
    return os.path.join(tmp, "manifest.json"), os.path.join(tmp, "mdm.json")

def run(mode="DEVELOPMENT", **kw):
    tmp = tempfile.mkdtemp(prefix="p6a_")
    man, mdm = make_env(tmp, **kw)
    return V.run_validation(man, mdm, tmp, execution_mode=mode, run_id="test", timestamp="T")

def rec(report, inv_id):
    return next((r for r in report["audit_records"] if r["invariant_id"] == inv_id), None)

def res(report, inv_id):
    r = rec(report, inv_id); return r["result"] if r else None

def gate(report, g): return report["gate_results"].get(g)

# ---- mutators ----
def reg_with(**changes):
    r = copy.deepcopy(REG0); r["declared"].update(changes); return r

def kg_add(*edges, arr="localizes_to_edges"):
    k = copy.deepcopy(KG0); k.setdefault(arr, list(k.get(arr, []))); k[arr] = list(k[arr]) + list(edges); return k

# ---------------- tests ----------------
TESTS = []
def test(name):
    def deco(fn): TESTS.append((name, fn)); return fn
    return deco

@test("01 missing artifact -> INV-RESOURCE-1 FATAL, gate01 FAIL")
def t01():
    r = run(missing="L3_KNOWLEDGE_GRAPH")
    return res(r, "INV-RESOURCE-1") == "FAIL" and gate(r, "PG-6A-01") == "FAIL"

@test("02 hash mismatch -> INV-RESOURCE-1 FAIL")
def t02():
    r = run(break_hash="L3_ITEM_CLASS_REGISTRY")
    return res(r, "INV-RESOURCE-1") == "FAIL"

@test("03 parse error -> INV-RESOURCE-1 FAIL")
def t03():
    r = run(registry_raw="{ not valid json ")
    return res(r, "INV-RESOURCE-1") == "FAIL"

@test("04 duplicate item id -> INV-ID-1 FAIL")
def t04():
    raw = json.dumps(REG0, ensure_ascii=False)
    raw = raw.replace('"declared": {', '"declared": {"QB-L3-VES-01": "LOCALIZING", ', 1)
    r = run(registry_raw=raw)
    return res(r, "INV-ID-1") == "FAIL"

@test("05 empty item id -> INV-ID-1 FAIL")
def t05():
    r = run(registry_obj=reg_with(**{"": "IMPACT"}))
    return res(r, "INV-ID-1") == "FAIL"

@test("06 illegal item_class -> INV-CLASS-2 FAIL")
def t06():
    r = run(registry_obj=reg_with(**{"QB-L3-VES-01": "BOGUS"}))
    return res(r, "INV-CLASS-2") == "FAIL"

@test("07 spelling variant LOCALISING -> INV-CLASS-2 FAIL")
def t07():
    r = run(registry_obj=reg_with(**{"QB-L3-VES-01": "LOCALISING"}))
    return res(r, "INV-CLASS-2") == "FAIL"

@test("08 LOCALIZING but no anatomical PRIMARY -> INV-CLASS-1 FAIL")
def t08():
    r = run(registry_obj=reg_with(**{"QB-L3-OCM-04": "LOCALIZING"}))
    return res(r, "INV-CLASS-1") == "FAIL" and gate(r, "PG-6A-03") == "FAIL"

@test("09 NON_LOCALIZING_PHENOTYPE with anatomical PRIMARY -> INV-CLASS-1 FAIL")
def t09():
    r = run(registry_obj=reg_with(**{"QB-L3-VES-01": "NON_LOCALIZING_PHENOTYPE"}))
    return res(r, "INV-CLASS-1") == "FAIL"

@test("10 dangling KG source -> INV-KG-1 FAIL")
def t10():
    r = run(kg_obj=kg_add({"from": "QB-L3-XXX-99", "to": "PVES", "level": "PRIMARY", "type": "LOCALIZES_TO"}))
    return res(r, "INV-KG-1") == "FAIL"

@test("11 dangling KG target -> INV-KG-1 FAIL")
def t11():
    r = run(kg_obj=kg_add({"from": "QB-L3-VES-01", "to": "ZZZ", "level": "SECONDARY", "type": "LOCALIZES_TO"}))
    return res(r, "INV-KG-1") == "FAIL"

@test("12 unsupported edge type -> INV-KG-2 FAIL")
def t12():
    r = run(kg_obj=kg_add({"from": "QB-L3-VES-01", "to": "QB-L3-VES-02", "type": "BOGUS_EDGE"}, arr="extra_edges"))
    return res(r, "INV-KG-2") == "FAIL"

@test("13a NONLOC PRIMARY not counted (LOCALIZING+NONLOC-only -> FAIL)")
def t13a():
    reg = reg_with(**{"QB-L3-OCM-04": "LOCALIZING"})
    kg = kg_add({"from": "QB-L3-OCM-04", "to": "NONLOC", "level": "PRIMARY", "type": "LOCALIZES_TO"})
    r = run(registry_obj=reg, kg_obj=kg)
    return res(r, "INV-CLASS-1") == "FAIL"

@test("13b NONLOC PRIMARY legal-but-not-counted (NON_LOCALIZING_PHENOTYPE stays PASS)")
def t13b():
    kg = kg_add({"from": "QB-L3-OCM-04", "to": "NONLOC", "level": "PRIMARY", "type": "LOCALIZES_TO"})
    r = run(kg_obj=kg)  # OCM-04 stays NON_LOCALIZING_PHENOTYPE
    return res(r, "INV-CLASS-1") == "PASS" and res(r, "INV-KG-2") == "PASS"

@test("14 prior FATAL -> later gates NOT_RUN (never false PASS, invariant AND gate level)")
def t14():
    r = run(missing="L3_KNOWLEDGE_GRAPH")
    later = [res(r, i) for i in ("INV-ID-1", "INV-CLASS-2", "INV-KG-1", "INV-CLASS-1")]
    gates_later = [gate(r, g) for g in ("PG-6A-02", "PG-6A-03")]
    return (all(x == "NOT_RUN_DUE_TO_PRIOR_FATAL" for x in later) and "PASS" not in later
            and all(g == "NOT_RUN_DUE_TO_PRIOR_FATAL" for g in gates_later))

@test("15 FAIL run still builds complete Audit Record (10 = 8 stage1 + 2 stage2, additive)")
def t15():
    r = run(registry_obj=reg_with(**{"QB-L3-OCM-04": "LOCALIZING"}))
    need = {"run_id", "gate_id", "invariant_id", "result", "failure_class",
            "blocking_scope", "normative_source", "evidence_artifacts", "findings"}
    return len(r["audit_records"]) == 10 and all(need.issubset(a.keys()) for a in r["audit_records"])

@test("16 source artifacts unchanged before/after validation")
def t16():
    r = run()
    return r["read_only_evidence"]["all_unchanged"] is True

@test("P0 positive run -> all gates PASS, INV-CLASS-1 PASS, NON_RELEASE_ELIGIBLE, FINAL BLOCKED")
def tP0():
    r = run()
    return (gate(r, "PG-6A-01") == "PASS" and gate(r, "PG-6A-02") == "PASS" and gate(r, "PG-6A-03") == "PASS"
            and res(r, "INV-CLASS-1") == "PASS" and r["resource_status"] == "NON_RELEASE_ELIGIBLE"
            and r["pg_6a_final"]["status"] == "BLOCKED")

@test("P1 PRODUCTION mode -> INV-RESOURCE-1 FAIL (NON_RELEASE_ELIGIBLE), gate01 FAIL")
def tP1():
    r = run(mode="PRODUCTION")
    return res(r, "INV-RESOURCE-1") == "FAIL" and gate(r, "PG-6A-01") == "FAIL"

@test("E1 drop version identity -> INV-VERSION-1 FAIL")
def tE1():
    r = run(drop_version="L3_ITEM_CLASS_REGISTRY")
    return res(r, "INV-VERSION-1") == "FAIL"

@test("E2 premature TREATED_BY edge -> INV-KG-2 FAIL (INV-1-RUNTIME structural guard)")
def tE2():
    r = run(kg_obj=kg_add({"from": "QB-L3-VES-01", "to": "M3", "type": "TREATED_BY"}, arr="extra_edges"))
    return res(r, "INV-KG-2") == "FAIL"

# ============ Stage 2 tests: PG-6A-04 (INV-CORE24-1 + INV-P5-1) ============

@test("S2-P positive frozen Core-24 -> PG-6A-04 PASS, INV-CORE24-1 PASS, INV-P5-1 PASS, FINAL BLOCKED")
def s2p():
    r = run()
    return (gate(r, "PG-6A-04") == "PASS" and res(r, "INV-CORE24-1") == "PASS" and res(r, "INV-P5-1") == "PASS"
            and r["resource_status"] == "NON_RELEASE_ELIGIBLE" and r["pg_6a_final"]["status"] == "BLOCKED")

# ---- INV-CORE24-1 integrity (12) ----
@test("I1 Core-24 missing -> INV-CORE24-1 FATAL, PG-6A-04 FAIL")
def i1():
    r = run(core24_missing=True)
    return res(r, "INV-CORE24-1") == "FAIL" and gate(r, "PG-6A-04") == "FAIL"

@test("I2 Core-24 hash mismatch -> INV-CORE24-1 FAIL")
def i2():
    r = run(core24_break_hash=True)
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I3 Core-24 parse error -> INV-CORE24-1 FAIL")
def i3():
    r = run(core24_raw="{ not valid json ")
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I4 status != FROZEN -> INV-CORE24-1 FAIL")
def i4():
    r = run(core24_obj=c24_top(status="DRAFT"))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I5 version != 1.0 -> INV-CORE24-1 FAIL")
def i5():
    r = run(core24_obj=c24_top(version="0.9"))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I6 item count 23 -> INV-CORE24-1 FAIL")
def i6():
    r = run(core24_obj=c24_items(lambda it: _drop(it, "QB-L3-VES-08")))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I7 duplicate item id -> INV-CORE24-1 FAIL")
def i7():
    r = run(core24_obj=c24_items(lambda it: it + [copy.deepcopy(it[0])]))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I8 unknown item id -> INV-CORE24-1 FAIL")
def i8():
    def fn(it): it[0]["item_id"] = "QB-L3-ZZZ-99"; return it
    r = run(core24_obj=c24_items(fn))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I9 non-canonical item_class -> INV-CORE24-1 FAIL")
def i9():
    def fn(it): it[0]["item_class"] = "LOCALISING"; return it
    r = run(core24_obj=c24_items(fn))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I10 mandatory OCM-07 missing -> INV-CORE24-1 FAIL")
def i10():
    r = run(core24_obj=c24_items(lambda it: _swap(it, "QB-L3-OCM-07", _item("QB-L3-OCM-03", "LOCALIZING", "OCULOMOTOR"))))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I11 mandatory CBL-01 missing -> INV-CORE24-1 FAIL")
def i11():
    r = run(core24_obj=c24_items(lambda it: _swap(it, "QB-L3-CBL-01", _item("QB-L3-CBL-04", "LOCALIZING", "CEREBELLAR"))))
    return res(r, "INV-CORE24-1") == "FAIL"

@test("I12 IMPACT item present -> INV-CORE24-1 FAIL")
def i12():
    def fn(it): it[0]["item_class"] = "IMPACT"; return it
    r = run(core24_obj=c24_items(fn))
    return res(r, "INV-CORE24-1") == "FAIL"

# ---- INV-P5-1 coverage preservation (8) ----
@test("C13 remove OCM-07 -> PONS 1->0 -> INV-P5-1 FAIL")
def c13():
    r = run(core24_obj=c24_items(lambda it: _drop(it, "QB-L3-OCM-07")))
    return res(r, "INV-P5-1") == "FAIL"

@test("C14 remove CBL-01 -> OMV 1->0 -> INV-P5-1 FAIL")
def c14():
    r = run(core24_obj=c24_items(lambda it: _drop(it, "QB-L3-CBL-01")))
    return res(r, "INV-P5-1") == "FAIL"

@test("C15 MIDB 2->0 clean swap (OCM-02->OCM-05) -> INV-CORE24-1 PASS, INV-P5-1 FAIL")
def c15():
    r = run(core24_obj=c24_items(lambda it: _swap(it, "QB-L3-OCM-02", _item("QB-L3-OCM-05", "LOCALIZING", "OCULOMOTOR"))))
    return res(r, "INV-CORE24-1") == "PASS" and res(r, "INV-P5-1") == "FAIL"

@test("C16C17 BG=0 and CERV=0 not misreported (frozen) -> INV-P5-1 PASS")
def c1617():
    r = run()
    ev = rec(r, "INV-P5-1")["findings"][0]["evidence"]
    return res(r, "INV-P5-1") == "PASS" and ev["core24_primary"]["BG"] == 0 and ev["core24_primary"]["CERV"] == 0

@test("C18 SECONDARY/SUPPORTIVE not counted as PRIMARY (MIDB swap: OCM-07 SUPPORTIVE ignored)")
def c18():
    r = run(core24_obj=c24_items(lambda it: _swap(it, "QB-L3-OCM-02", _item("QB-L3-OCM-05", "LOCALIZING", "OCULOMOTOR"))))
    ev = rec(r, "INV-P5-1")["findings"][0]["evidence"]
    return ev["core24_primary"]["MIDB"] == 0

@test("C19 fake declared coverage, IDs unchanged -> validator recomputes -> INV-P5-1 PASS (not fooled)")
def c19():
    fake = c24_top(coverage_primary={"PVES":0,"VNUC":0,"VCBL":0,"OMV":0,"cFN":0,"CBH":0,"MIDB":0,"PONS":0,"MEDU":0,"FEF":0,"PAR":0,"TEMP":0,"BG":0,"AUTO":0,"CERV":0})
    r = run(core24_obj=fake)
    ev = rec(r, "INV-P5-1")["findings"][0]["evidence"]
    return res(r, "INV-P5-1") == "PASS" and ev["manifest_declared_coverage_ignored"] is True and ev["core24_primary"]["PONS"] == 1

@test("C20 prior FATAL -> PG-6A-04 invariants and gate NOT_RUN")
def c20():
    r = run(missing="L3_KNOWLEDGE_GRAPH")
    return (res(r, "INV-CORE24-1") == "NOT_RUN_DUE_TO_PRIOR_FATAL"
            and res(r, "INV-P5-1") == "NOT_RUN_DUE_TO_PRIOR_FATAL"
            and gate(r, "PG-6A-04") == "NOT_RUN_DUE_TO_PRIOR_FATAL")

# ---- Core-24 read-only before/after evidence (SA Stage-2 closeout) ----
def _ro(report, aid):
    return next((u for u in report["read_only_evidence"]["unchanged"] if u["artifact_id"] == aid), None)

@test("RO1 normal -> read_only_evidence has CORE24_V1_0, before==after, unchanged=true, all_unchanged=true")
def ro1():
    r = run()
    c = _ro(r, "CORE24_V1_0")
    return (c is not None and c["before"] is not None and c["before"] == c["after"]
            and c["unchanged"] is True and r["read_only_evidence"]["all_unchanged"] is True)

@test("RO2 Core-24 changed during validation -> unchanged=False, all_unchanged=False, FINAL BLOCKED, violation logged")
def ro2():
    tmp = tempfile.mkdtemp(prefix="p6a_")
    man, mdm = make_env(tmp)                      # valid fixture; temp only
    core_path = os.path.join(tmp, "core24.json")
    orig = V.PREDICATES["pred_core24_coverage_preservation"]
    def hook(ctx):                                # controlled hook: simulate a write DURING validation
        with open(core_path, "a", encoding="utf-8") as f:
            f.write(" ")
        return orig(ctx)
    V.PREDICATES["pred_core24_coverage_preservation"] = hook
    try:
        r = V.run_validation(man, mdm, tmp, run_id="ro2", timestamp="T")
    finally:
        V.PREDICATES["pred_core24_coverage_preservation"] = orig
    c = _ro(r, "CORE24_V1_0")
    violation_logged = any("read-only" in x for x in r["pg_6a_final"]["reasons"])
    return (c is not None and c["unchanged"] is False
            and r["read_only_evidence"]["all_unchanged"] is False
            and r["pg_6a_final"]["status"] == "BLOCKED" and violation_logged)

if __name__ == "__main__":
    passed = 0; failed = 0
    print("=== Phase 6A Validator Stage 1+2 — test suite ===")
    for name, fn in TESTS:
        try:
            ok = fn()
        except Exception as e:
            ok = False; name += "  [EXC: %s]" % e
        print(("  PASS  " if ok else "  FAIL  ") + name)
        passed += 1 if ok else 0; failed += 0 if ok else 1
    print("\n%d passed, %d failed, %d total" % (passed, failed, passed + failed))
    raise SystemExit(1 if failed else 0)
