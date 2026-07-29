#!/usr/bin/env python3
"""
Phase 6A Stage 3E — Validator Binding test matrix (SA plan §6).

Exercises the capability-scoped authority binding: patient wording is validated ONLY against the
FROZEN QB v1.0 SSOT; identity/class against the authority-split Registry v1.1; NPI v0.2 is a mapping
REFERENCE that must never validate wording and whose DRAFT status must not block the wording gate.

Synthetic environments in temp dirs; the REAL frozen QB (cd4525e6) + Registry v1.1 (7911a701) + KG +
NPI are the golden inputs. NEVER mutates real source artifacts. Content negatives recompute the file
hash into the synthetic manifest (loader passes, content invariant fails); hash negatives leave a wrong
manifest hash (loader HARD_FAILs). PG rerun is NOT performed here.
"""
import os, json, copy, hashlib, tempfile
import phase6a_validator as V

BASE = os.path.dirname(os.path.abspath(__file__))
def _loadj(n): return json.load(open(os.path.join(BASE, n), encoding="utf-8"))
def _bytes(n): return open(os.path.join(BASE, n), "rb").read()
def sha_b(b): return hashlib.sha256(b).hexdigest()

# Control files stay co-located with the validator/tests (bcf/validator/).
MDM   = _loadj("phase6a_required_metadata_manifest.json")
BASEMAN = _loadj("phase6a_validator_manifest.json")

# B+ii (SA ruling 2026-07-27/28): the frozen golden artifacts are NOT duplicated next to the tests;
# they are resolved through the runtime manifest — the single location-truth — so this suite runs
# unchanged in the repo layout (../qb/v1.0/, ../phase4/, ../reference/, ../core24/v1.0/) and in a flat
# layout alike. No hard-coded second location; raw bytes read for byte-exact fidelity.
# FAIL-CLOSED at import (SA condition 2026-07-28): golden bytes are hash-verified against the
# manifest-declared sha256 BEFORE they become the synthetic baseline, so wrong golden bytes can never
# be silently loaded and turned into a passing fixture. No fallback, no auto-update of expected hashes.
def _artifact_bytes(aid):
    spec = next(a for a in BASEMAN["artifacts"] if a["artifact_id"] == aid)
    path = os.path.normpath(os.path.join(BASE, spec["path"]))
    with open(path, "rb") as f:
        raw = f.read()
    actual = hashlib.sha256(raw).hexdigest()
    expected = spec["sha256"]
    if actual != expected:
        raise RuntimeError("golden artifact hash mismatch: %s: expected=%s actual=%s" % (aid, expected, actual))
    return raw

def _core24_bytes():
    b = BASEMAN["core24_binding"]
    path = os.path.normpath(os.path.join(BASE, b["path"]))
    with open(path, "rb") as f:
        raw = f.read()
    actual = hashlib.sha256(raw).hexdigest()
    expected = b["frozen_sha256"]
    if actual != expected:
        raise RuntimeError("golden artifact hash mismatch: CORE24_V1_0: expected=%s actual=%s" % (expected, actual))
    return raw

GQB   = json.loads(_artifact_bytes("L3_CANONICAL_WORDING_QB").decode("utf-8"))   # cd4525e6
GREG  = json.loads(_artifact_bytes("L3_ITEM_CLASS_REGISTRY").decode("utf-8"))    # 7911a701
GKG_B = _artifact_bytes("L3_KNOWLEDGE_GRAPH")                                    # c00b1744
GNPI_B= _artifact_bytes("L3_NPI_MAPPING_REFERENCE")                              # 0e55936e
GC24_B= _core24_bytes()                                                          # 7bfaf2dc (PG-6A-04 core24_binding)
QB_SHA = "cd4525e6052bf5be9e2c0102df6702aad7605314cd8de28b23d19cc390779bb6"


def build_env(tmp, qb_obj=None, reg_obj=None, npi_bytes=None,
              qb_hash_override=None, reg_hash_override=None,
              npi_permit_wording=False, wording_sources_override=None,
              qb_release_eligible=True, reg_release_eligible=True, npi_release_eligible=False,
              wording_auth_path=None, mapping_auth_path=None):
    """Write a Stage 3E 4-artifact env + manifest into tmp; return (manifest_path, mdm_path)."""
    qb_b  = json.dumps(GQB if qb_obj is None else qb_obj, ensure_ascii=False, indent=1).encode()
    reg_b = json.dumps(GREG if reg_obj is None else reg_obj, ensure_ascii=False, indent=1).encode()
    kg_b  = GKG_B
    npi_b = GNPI_B if npi_bytes is None else npi_bytes
    open(os.path.join(tmp, "qb.json"), "wb").write(qb_b)
    open(os.path.join(tmp, "reg.json"), "wb").write(reg_b)
    open(os.path.join(tmp, "kg.json"), "wb").write(kg_b)
    open(os.path.join(tmp, "npi.md"), "wb").write(npi_b)
    open(os.path.join(tmp, "core24.json"), "wb").write(GC24_B)   # PG-6A-04 (Stage-2) — kept intact
    json.dump(MDM, open(os.path.join(tmp, "mdm.json"), "w", encoding="utf-8"), ensure_ascii=False)

    man = copy.deepcopy(BASEMAN)
    # keep Stage-2 PG-6A-04 runnable in the synthetic env: point core24_binding at the temp Core-24
    if "core24_binding" in man:
        man["core24_binding"]["path"] = "core24.json"
    qb_sha  = qb_hash_override or sha_b(qb_b)
    reg_sha = reg_hash_override or sha_b(reg_b)
    man["artifacts"] = [
        {"artifact_id": "L3_CANONICAL_WORDING_QB", "path": "qb.json", "format": "json",
         "declared_version": "1.0-FROZEN", "sha256": qb_sha, "source_status": "FROZEN_RELEASE_ELIGIBLE_WORDING_SSOT",
         "release_eligible": qb_release_eligible, "authority_role": "PATIENT_WORDING_SSOT",
         "permitted_uses": ["PATIENT_WORDING_VALIDATION"], "forbidden_uses": []},
        {"artifact_id": "L3_ITEM_CLASS_REGISTRY", "path": "reg.json", "format": "json",
         "declared_version": "1.1", "sha256": reg_sha, "source_status": "AUTHORITY_SPLIT_RELEASE_ELIGIBLE",
         "release_eligible": reg_release_eligible, "authority_role": "IDENTITY_CLASS_AUTHORITY",
         "permitted_uses": ["ITEM_ID_VALIDATION", "ITEM_CLASS_VALIDATION", "AUTHORITY_POINTER_VALIDATION"],
         "forbidden_uses": ["PATIENT_WORDING_VALIDATION"]},
        {"artifact_id": "L3_KNOWLEDGE_GRAPH", "path": "kg.json", "format": "json",
         "declared_version": "phase4-v0.4", "sha256": sha_b(kg_b), "source_status": "PHASE4_FROZEN_BASELINE",
         "release_eligible": True, "authority_role": "MAPPING_EVIDENCE",
         "permitted_uses": ["MAPPING_REFERENCE", "KG_REFERENTIAL"], "forbidden_uses": ["PATIENT_WORDING_VALIDATION"]},
        {"artifact_id": "L3_NPI_MAPPING_REFERENCE", "path": "npi.md", "format": "markdown",
         "declared_version": "v0.2", "sha256": sha_b(npi_b), "source_status": "DRAFT_MAPPING_REFERENCE_ONLY",
         "release_eligible": npi_release_eligible, "authority_role": "MAPPING_REFERENCE",
         "permitted_uses": (["MAPPING_REFERENCE", "PATIENT_WORDING_VALIDATION"] if npi_permit_wording else ["MAPPING_REFERENCE"]),
         "forbidden_uses": ([] if npi_permit_wording else ["PATIENT_WORDING_VALIDATION"])},
    ]
    if wording_sources_override is not None:
        man["authority_binding"]["wording_evidence_sources"] = wording_sources_override
    # SA fix-A regression hooks: override authority_binding LOCATION fields to prove the validator
    # compares logical basenames, not raw paths (loader still uses artifacts[].path + sha256).
    if wording_auth_path is not None:
        man["authority_binding"]["patient_wording_validation_source"]["path"] = wording_auth_path
    if mapping_auth_path is not None:
        man["authority_binding"]["mapping_reference"]["path"] = mapping_auth_path
    json.dump(man, open(os.path.join(tmp, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False)
    return os.path.join(tmp, "manifest.json"), os.path.join(tmp, "mdm.json")


def run(mode="DEVELOPMENT", **kw):
    tmp = tempfile.mkdtemp(prefix="p6a3e_")
    man, mdm = build_env(tmp, **kw)
    return V.run_validation(man, mdm, tmp, execution_mode=mode, run_id="t3e", timestamp="T")

def res(r, inv): return next((a["result"] for a in r["audit_records"] if a["invariant_id"] == inv), None)
def gate(r, g): return r["gate_results"].get(g)

def reg_mutate(fn):
    r = copy.deepcopy(GREG); fn(r); return r

TESTS = []
def test(name):
    def deco(fn): TESTS.append((name, fn)); return fn
    return deco

# ---------------- POSITIVE ----------------
@test("POS all_four_authority_hashes_valid -> all gates PASS (incl PG-6A-04 Core-24 preserved)")
def p1():
    r = run()
    return all(gate(r, g) == "PASS" for g in ("PG-6A-01", "PG-6A-1B", "PG-6A-02", "PG-6A-03", "PG-6A-04"))

@test("POS frozen_QB_used_for_wording -> INV-WORDING-AUTH-1 PASS + wording source is frozen QB")
def p2():
    r = run()
    return (res(r, "INV-WORDING-AUTH-1") == "PASS"
            and r["authority_binding_status"]["patient_wording_validation_source"]["artifact_id"] == "L3_CANONICAL_WORDING_QB")

@test("POS registry_v1_1_used_for_identity_and_class -> INV-ID-1 + INV-CLASS-2 PASS")
def p3():
    r = run()
    return res(r, "INV-ID-1") == "PASS" and res(r, "INV-CLASS-2") == "PASS"

@test("POS NPI_used_only_as_mapping_reference -> INV-MAP-NOT-WORD-1 PASS")
def p4():
    r = run()
    return res(r, "INV-MAP-NOT-WORD-1") == "PASS"

@test("POS 48_of_48_QB_registry_alignment -> INV-QB-REG-IDENTITY-1 PASS + INV-REG-SPLIT-1 PASS")
def p5():
    r = run()
    return res(r, "INV-QB-REG-IDENTITY-1") == "PASS" and res(r, "INV-REG-SPLIT-1") == "PASS"

# ---------------- NEGATIVE ----------------
@test("NEG tampered_frozen_QB_hash -> HARD_FAIL (INV-RESOURCE-1 FAIL, gate01 FAIL)")
def n1():
    r = run(qb_hash_override="0" * 64)
    return res(r, "INV-RESOURCE-1") == "FAIL" and gate(r, "PG-6A-01") == "FAIL"

@test("NEG tampered_registry_v1_1_hash -> HARD_FAIL (INV-RESOURCE-1 FAIL)")
def n2():
    r = run(reg_hash_override="0" * 64)
    return res(r, "INV-RESOURCE-1") == "FAIL" and gate(r, "PG-6A-01") == "FAIL"

@test("NEG mapping_reference_used_for_wording -> INV-MAP-NOT-WORD-1 FAIL")
def n3():
    r = run(npi_permit_wording=True, wording_sources_override=["L3_CANONICAL_WORDING_QB", "L3_NPI_MAPPING_REFERENCE"])
    return res(r, "INV-MAP-NOT-WORD-1") == "FAIL" and gate(r, "PG-6A-1B") == "FAIL"

@test("NEG registry_wording_source_wrong_hash -> INV-REG-SPLIT-1 FAIL")
def n4():
    def m(r): r["items"][0]["wording_source"]["sha256"] = "deadbeef" * 8
    r = run(reg_obj=reg_mutate(m))
    return res(r, "INV-REG-SPLIT-1") == "FAIL"

@test("NEG missing_wording_source -> INV-REG-SPLIT-1 FAIL")
def n5():
    def m(r): del r["items"][3]["wording_source"]
    r = run(reg_obj=reg_mutate(m))
    return res(r, "INV-REG-SPLIT-1") == "FAIL"

@test("NEG duplicate_item_id -> HARD_FAIL (caught first by INV-REG-SPLIT-1 @PG-6A-1B; INV-ID-1 NOT PASS)")
def n6():
    def m(r): r["items"].append(copy.deepcopy(r["items"][0]))  # dup first item_id (49 items, non-unique)
    r = run(reg_obj=reg_mutate(m))
    # authority-split's 48-unique check catches it first and short-circuits; INV-ID-1 then NOT_RUN.
    return (res(r, "INV-REG-SPLIT-1") == "FAIL" and gate(r, "PG-6A-1B") == "FAIL"
            and res(r, "INV-ID-1") != "PASS")

@test("NEG class_mismatch (registry vs frozen QB) -> INV-QB-REG-IDENTITY-1 FAIL")
def n7():
    # flip a LOCALIZING item to IMPACT in the registry only; QB unchanged
    def m(r):
        for it in r["items"]:
            if it["item_class"] == "LOCALIZING": it["item_class"] = "IMPACT"; break
    r = run(reg_obj=reg_mutate(m))
    return res(r, "INV-QB-REG-IDENTITY-1") == "FAIL"

@test("NEG draft_mapping_reference_does_not_block_wording (PRODUCTION) -> gate PASS, RELEASE_ELIGIBLE_VALIDATED")
def n8():
    r = run(mode="PRODUCTION", npi_release_eligible=False)
    return (gate(r, "PG-6A-01") == "PASS" and gate(r, "PG-6A-1B") == "PASS"
            and r["resource_status"] == "RELEASE_ELIGIBLE_VALIDATED")

@test("NEG hash_failure_cannot_report_release_eligible -> resource_status INVALID_RESOURCE (fail-closed)")
def n9():
    r = run(qb_hash_override="0" * 64)  # tampered frozen QB manifest hash -> loader HARD_FAIL
    return (gate(r, "PG-6A-01") == "FAIL" and r["resource_status"] == "INVALID_RESOURCE"
            and r["resource_status"] != "RELEASE_ELIGIBLE_VALIDATED")

@test("NEG wrong_mapping_source_artifact (status REFERENCE) -> INV-REG-SPLIT-1 FAIL, PG-6A-1B FAIL")
def n10():
    def m(r): r["items"][0]["mapping_source"] = {"artifact": "BOGUS_MAPPING_DOC", "status": "REFERENCE"}
    r = run(reg_obj=reg_mutate(m))
    return res(r, "INV-REG-SPLIT-1") == "FAIL" and gate(r, "PG-6A-1B") == "FAIL"

@test("UNIT INV-ID-1 array-dup detection catches duplicate item_id in v1.1 items[] (direct predicate)")
def u1():
    items = [{"item_id": "QB-L3-VES-01", "item_class": "LOCALIZING"},
             {"item_id": "QB-L3-VES-01", "item_class": "LOCALIZING"}]  # duplicate value
    ctx = {"registry": {"declared": {"QB-L3-VES-01": "LOCALIZING"}}, "registry_items": items,
           "raw": {"L3_ITEM_CLASS_REGISTRY": json.dumps({"items": items})}}
    out = V.pred_unique_id(ctx)
    return any(f["result"] == "FAIL" and "duplicate item id" in f["message"] for f in out)

# ---------------- guard: FINAL stays blocked; read-only ----------------
@test("GUARD PG-6A-FINAL BLOCKED + read-only unchanged (positive run)")
def g1():
    r = run()
    return r["pg_6a_final"]["status"] == "BLOCKED" and r["read_only_evidence"]["all_unchanged"] is True

# ---------------- SA fix-A: logical-name authority comparison (path-agnostic, 2026-07-28) ----------------
@test("PATH repo-relative authority paths -> INV-REG-SPLIT-1 PASS (Option A semantics)")
def path1():
    r = run(wording_auth_path="../qb/v1.0/BCF_QUESTION_BANK_v1.0_FROZEN.json",
            mapping_auth_path="../reference/BCF_NPI_QUESTION_BANK_v0.2.md")
    return res(r, "INV-REG-SPLIT-1") == "PASS" and gate(r, "PG-6A-1B") == "PASS"

@test("PATH bare basename authority paths -> INV-REG-SPLIT-1 PASS (backward compatibility)")
def path2():
    r = run(wording_auth_path="BCF_QUESTION_BANK_v1.0_FROZEN.json",
            mapping_auth_path="BCF_NPI_QUESTION_BANK_v0.2.md")
    return res(r, "INV-REG-SPLIT-1") == "PASS" and gate(r, "PG-6A-1B") == "PASS"

@test("PATH wrong wording logical basename (right dir) -> INV-REG-SPLIT-1 FAIL (not fooled by path dir)")
def path3():
    r = run(wording_auth_path="../qb/v1.0/WRONG_QB_NAME.json")
    return res(r, "INV-REG-SPLIT-1") == "FAIL" and gate(r, "PG-6A-1B") == "FAIL"

@test("PATH wrong mapping logical basename (right dir) -> INV-REG-SPLIT-1 FAIL (not fooled by path dir)")
def path4():
    r = run(mapping_auth_path="../reference/WRONG_NPI_NAME.md")
    return res(r, "INV-REG-SPLIT-1") == "FAIL" and gate(r, "PG-6A-1B") == "FAIL"

if __name__ == "__main__":
    passed = failed = 0
    print("=== Phase 6A Stage 3E — Validator Binding test matrix ===")
    for name, fn in TESTS:
        try:
            ok = fn()
        except Exception as e:
            ok = False; name += "  [EXC: %s]" % e
        print(("  PASS  " if ok else "  FAIL  ") + name)
        passed += 1 if ok else 0; failed += 0 if ok else 1
    print("\n%d passed, %d failed, %d total" % (passed, failed, passed + failed))
    raise SystemExit(1 if failed else 0)
