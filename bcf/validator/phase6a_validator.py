#!/usr/bin/env python3
"""
BCF Phase 6A — Clinical Build Validator (Stage 1 + Stage 2)

Authorized scope: ReadOnlyLoader, Artifact Manifest, PG-6A-01/02/03 (Stage 1),
PG-6A-04 (Stage 2: INV-CORE24-1 Core-24 integrity + INV-P5-1 coverage preservation),
negative tests, Build Audit Record.

NOT authorized: PG-6A-05, PG-6A-06 completion, PG-6A-FINAL green, production server.js
audit, runtime Decision Engine, TREATED_BY/VERIFIED_BY edges, Phase-5/Core-24 modification.

Hard rules honoured:
  - Read-only on all inputs (incl. frozen Core-24); sha256 verified before AND after; never writes back.
  - No autofix, no silent repair, no enum normalization, no default backfill.
  - Explicit sentinels only (no truthiness on clinical values).
  - Prior FATAL -> later gates recorded NOT_RUN_DUE_TO_PRIOR_FATAL (never false PASS).
  - Build Audit Record produced on PASS and FAIL alike.
"""
import json, hashlib, os
from collections import defaultdict

VALIDATOR_VERSION = "phase6a-validator-stage2-0.1"

# result sentinels
R_PASS = "PASS"; R_FAIL = "FAIL"; R_NA = "NOT_APPLICABLE"; R_NOT_RUN = "NOT_RUN_DUE_TO_PRIOR_FATAL"
# failure classes
FC_FATAL = "FATAL"; FC_ERROR = "ERROR"; FC_WARNING = "WARNING"; FC_INFO = "INFO"; FC_CONFIG = "CONFIGURATION_ERROR"


def sha256_of_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _safe_sha(path):
    """sha256 of a possibly-missing/unreadable file; None (never raises) on any failure."""
    try:
        return sha256_of_file(path) if path and os.path.isfile(path) else None
    except Exception:
        return None


def _logical_artifact_name(path, *, strip_extension=False):
    """Logical artifact NAME (basename) for registry-pointer identity comparison ONLY (SA fix A,
    2026-07-28). A manifest `path` is a filesystem location (repo-relative loader path); the frozen
    Registry v1.1 `wording_source.artifact` / `mapping_source.artifact` are LOGICAL artifact names.
    The two must not be compared as raw strings (repo-relative path != basename). This normalization is
    used solely for the pointer-identity check: loading + integrity always use the full repo-relative
    path + exact sha256 (ReadOnlyLoader). NEVER used for loading, and never enables basename-only
    loading or fallback search — so it does not weaken fail-closed behavior."""
    name = os.path.basename(os.path.normpath(path))
    if strip_extension:
        name = os.path.splitext(name)[0]
    return name


def find_duplicate_keys(raw):
    """Detect duplicate object keys at any level (json.loads would otherwise collapse them)."""
    dups = []
    def hook(pairs):
        ks = [k for k, _ in pairs]
        for k in ks:
            if ks.count(k) > 1 and k not in dups:
                dups.append(k)
        return dict(pairs)
    json.loads(raw, object_pairs_hook=hook)
    return dups


def _f(result, failure_class, entity_id, actual, expected, message, vacuous=False, exercised=True):
    return {"result": result, "failure_class": failure_class, "entity_id": entity_id,
            "actual": actual, "expected": expected, "message": message,
            "vacuous": vacuous, "exercised": exercised}


class ReadOnlyLoader:
    """Opens artifacts read-only, verifies declared hash, parses. Never writes to inputs."""
    def __init__(self, base_dir, artifacts):
        self.base_dir = base_dir
        self.artifacts = {a["artifact_id"]: a for a in artifacts}
        self.load_hashes = {}     # artifact_id -> sha at load
        self.parsed = {}          # artifact_id -> parsed json / raw text
        self.raw = {}             # artifact_id -> raw text
        self.provenance = []      # list of provenance dicts

    def load_all(self):
        findings = []
        for aid, a in self.artifacts.items():
            path = os.path.join(self.base_dir, a["path"])
            rec = {"artifact_id": aid, "path": a["path"], "declared_version": a.get("declared_version"),
                   "declared_sha256": a.get("sha256"), "source_status": a.get("source_status"),
                   "release_eligible": a.get("release_eligible", None), "load_result": None, "load_sha256": None}
            if not os.path.exists(path):
                rec["load_result"] = "MISSING"; self.provenance.append(rec)
                findings.append(_f(R_FAIL, FC_FATAL, aid, "missing", "exists", "artifact %s missing at %s" % (aid, a["path"])))
                continue
            if not os.path.isfile(path):
                rec["load_result"] = "NOT_REGULAR_FILE"; self.provenance.append(rec)
                findings.append(_f(R_FAIL, FC_FATAL, aid, "not_regular_file", "regular_file", "%s not a regular file" % aid))
                continue
            try:
                actual_sha = sha256_of_file(path)
            except Exception as e:
                rec["load_result"] = "UNREADABLE"; self.provenance.append(rec)
                findings.append(_f(R_FAIL, FC_FATAL, aid, "unreadable", "readable", "%s unreadable: %s" % (aid, e)))
                continue
            self.load_hashes[aid] = actual_sha
            rec["load_sha256"] = actual_sha
            if a.get("sha256") is not None and actual_sha != a["sha256"]:
                rec["load_result"] = "HASH_MISMATCH"; self.provenance.append(rec)
                findings.append(_f(R_FAIL, FC_FATAL, aid, actual_sha, a["sha256"],
                                   "%s sha256 mismatch: declared %s.. actual %s.." % (aid, a["sha256"][:12], actual_sha[:12])))
                continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    raw = f.read()
                self.raw[aid] = raw
                self.parsed[aid] = json.loads(raw) if a.get("format") == "json" else raw
            except Exception as e:
                rec["load_result"] = "PARSE_ERROR"; self.provenance.append(rec)
                findings.append(_f(R_FAIL, FC_FATAL, aid, "parse_error", "parseable", "%s parse error: %s" % (aid, e)))
                continue
            rec["load_result"] = "LOADED"
            self.provenance.append(rec)
        return findings

    def verify_unchanged(self):
        out = []
        for aid, load_sha in self.load_hashes.items():
            path = os.path.join(self.base_dir, self.artifacts[aid]["path"])
            after = sha256_of_file(path)
            out.append({"artifact_id": aid, "before": load_sha, "after": after, "unchanged": after == load_sha})
        return out


# ------------------------- predicates -------------------------

def pred_resource_present(ctx):
    findings = list(ctx["loader_findings"])
    if ctx["execution_mode"] == "PRODUCTION":
        # Stage 3E: capability-scoped. Only the wording_release_gate artifacts (frozen QB + Registry v1.1)
        # must be release-eligible; the DRAFT NPI mapping reference must NOT block the wording gate.
        amap = {a["artifact_id"]: a for a in ctx["manifest"]["artifacts"]}
        wording_req = ctx["manifest"].get("authority_binding", {}).get("wording_release_gate", {}) \
            .get("requires_release_eligible", ["L3_CANONICAL_WORDING_QB", "L3_ITEM_CLASS_REGISTRY"])
        for aid in wording_req:
            a = amap.get(aid, {})
            if a.get("release_eligible") is not True:
                findings.append(_f(R_FAIL, FC_FATAL, aid, a.get("source_status"), "RELEASE_ELIGIBLE",
                                   "PRODUCTION: wording_release_gate artifact %s is NON_RELEASE_ELIGIBLE (CL-4)." % aid))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "all_loaded", "all_loaded", "all required artifacts present, hash-verified, parsed")]
    return findings


def pred_version_identity(ctx):
    findings = []
    # every bound artifact must carry a resolvable version identity (declared_version + sha256);
    # derived from the manifest so the predicate is binding-agnostic (works for any manifest).
    required = tuple(a["artifact_id"] for a in ctx["manifest"]["artifacts"])
    amap = {a["artifact_id"]: a for a in ctx["manifest"]["artifacts"]}
    for aid in required:
        a = amap.get(aid)
        if a is None:
            findings.append(_f(R_FAIL, FC_FATAL, aid, "unbound", "manifest_binding", "%s not bound in manifest" % aid)); continue
        has_ver = a.get("declared_version") not in (None, "")
        has_sha = a.get("sha256") not in (None, "")
        if not (has_ver and has_sha):
            findings.append(_f(R_FAIL, FC_FATAL, aid,
                               "version=%s sha256=%s" % (a.get("declared_version"), "present" if has_sha else "MISSING"),
                               "declared_version + sha256",
                               "%s lacks resolvable version identity (filename-only insufficient, CL-3/CL-5)" % aid))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "bound", "bound", "all required artifacts have declared_version + sha256")]
    return findings


def pred_unique_id(ctx):
    reg = ctx["registry"]
    if reg is None:
        return [_f(R_FAIL, FC_CONFIG, "L3_ITEM_CLASS_REGISTRY", "unloaded", "loaded", "registry not loaded")]
    findings = []
    raw = ctx["raw"].get("L3_ITEM_CLASS_REGISTRY", "")
    dups = find_duplicate_keys(raw)
    declared = reg.get("declared", {})
    for k in dups:
        if k in declared:
            findings.append(_f(R_FAIL, FC_FATAL, k, "duplicate", "single_occurrence", "duplicate item id '%s' in registry" % k))
    # Stage 3E: authority-split Registry v1.1 stores items in an array; JSON-key dup detection cannot
    # catch a repeated item_id VALUE across array objects, so check the array explicitly.
    reg_items = ctx.get("registry_items")
    if reg_items is not None:
        seen = {}
        for it in reg_items:
            iid = it.get("item_id")
            seen[iid] = seen.get(iid, 0) + 1
        for iid, n in seen.items():
            if n > 1:
                findings.append(_f(R_FAIL, FC_FATAL, iid, "%d occurrences" % n, "single_occurrence",
                                   "duplicate item id '%s' in Registry v1.1 items[]" % iid))
    for iid in declared.keys():
        if iid is None or str(iid).strip() == "":
            findings.append(_f(R_FAIL, FC_FATAL, repr(iid), "empty", "non_empty", "empty item id"))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "%d unique" % len(declared), "unique", "all item ids non-empty and unique")]
    return findings


def pred_required_metadata(ctx):
    reg = ctx["registry"]
    if reg is None:
        return [_f(R_FAIL, FC_CONFIG, "L3_ITEM_CLASS_REGISTRY", "unloaded", "loaded", "registry not loaded")]
    mm = ctx["metadata_manifest"]
    et = next((e for e in mm["entity_types"] if e["entity_type"] == "QUESTION_ITEM"), None)
    if et is None:
        return [_f(R_FAIL, FC_CONFIG, "metadata_manifest", "no QUESTION_ITEM", "defined", "metadata manifest missing QUESTION_ITEM")]
    req = et["required_fields"]
    declared = reg.get("declared", {})
    findings = []
    for iid, cls in declared.items():
        row = {"item_id": iid, "item_class": cls}
        for fld in req:
            name = fld["name"]; val = row.get(name, None)
            if val is None or (fld.get("nullable") is False and str(val).strip() == ""):
                findings.append(_f(R_FAIL, FC_FATAL, iid, "%s=missing" % name, "%s present" % name,
                                   "item %s missing required metadata '%s'" % (iid, name)))
            elif fld.get("type") == "string" and not isinstance(val, str):
                findings.append(_f(R_FAIL, FC_FATAL, iid, "%s type=%s" % (name, type(val).__name__), "string",
                                   "item %s field '%s' wrong type" % (iid, name)))
    note = "INV-META-1 Stage 1 fixture only; NOT production-complete until metadata manifest approved (CL-7 rule 5)."
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "%d items" % len(declared), "required fields present", note)]
    for f in findings:
        f["message"] += " | " + note
    return findings


def pred_item_class_enum(ctx):
    reg = ctx["registry"]
    if reg is None:
        return [_f(R_FAIL, FC_CONFIG, "L3_ITEM_CLASS_REGISTRY", "unloaded", "loaded", "registry not loaded")]
    accepted = ctx["manifest"]["enums"]["item_class_accepted"]
    declared = reg.get("declared", {})
    findings = []
    for iid, cls in declared.items():
        if cls not in accepted:
            findings.append(_f(R_FAIL, FC_FATAL, iid, cls, "one of %s" % accepted,
                               "item %s item_class '%s' not an accepted enum value (no alias/normalization, CL-3)" % (iid, cls)))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "%d items" % len(declared), "enum-valid", "all item_class values in accepted enum")]
    return findings


def _edge_arrays(kg):
    return {k: v for k, v in kg.items() if k.endswith("_edges") and isinstance(v, list)}


def pred_kg_referential(ctx):
    kg = ctx["kg"]; reg = ctx["registry"]
    if kg is None or reg is None:
        return [_f(R_FAIL, FC_CONFIG, "L3_KNOWLEDGE_GRAPH", "unloaded", "loaded", "kg/registry not loaded")]
    schema = ctx["manifest"]["graph_schema"]
    items = set(reg.get("declared", {}).keys())
    substrates = set(schema["substrate_all"])
    domains = set(schema["domains"])
    findings = []
    for arr_name, arr in _edge_arrays(kg).items():
        for e in arr:
            src = e.get("from"); dst = e.get("to"); typ = e.get("type")
            if src not in items:
                findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (src, dst), src, "declared item",
                                   "edge source '%s' does not resolve to a declared item (%s)" % (src, arr_name)))
            if typ == "LOCALIZES_TO":
                if dst not in substrates:
                    findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (src, dst), dst, "declared substrate",
                                       "LOCALIZES_TO target '%s' does not resolve to a substrate node" % dst))
            elif typ == "SUGGESTS":
                if dst not in domains:
                    findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (src, dst), dst, "declared domain",
                                       "SUGGESTS target '%s' does not resolve to a domain node" % dst))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "all endpoints resolve", "resolve", "every edge endpoint resolves to a declared node")]
    return findings


def pred_kg_schema(ctx):
    kg = ctx["kg"]
    if kg is None:
        return [_f(R_FAIL, FC_CONFIG, "L3_KNOWLEDGE_GRAPH", "unloaded", "loaded", "kg not loaded")]
    schema = ctx["manifest"]["graph_schema"]
    permitted = schema["edge_types_permitted_stage1"]
    absent = set(schema.get("edge_types_absent_until_phase6", []))
    levels = set(ctx["manifest"]["enums"]["localizes_to_levels"])
    findings = []
    for arr_name, arr in _edge_arrays(kg).items():
        for e in arr:
            typ = e.get("type"); dst = e.get("to")
            if typ in absent:
                findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (e.get("from"), dst), typ, "not-yet-permitted",
                                   "premature edge type '%s' present (absent_until_phase6) — clinical edge not authorized" % typ))
                continue
            if typ not in permitted:
                findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (e.get("from"), dst), typ, "permitted edge type",
                                   "unsupported edge type '%s' (%s)" % (typ, arr_name)))
                continue
            if typ == "LOCALIZES_TO":
                lvl = e.get("level")
                if lvl not in levels:
                    findings.append(_f(R_FAIL, FC_FATAL, "%s->%s" % (e.get("from"), dst), lvl, "one of %s" % sorted(levels),
                                       "LOCALIZES_TO edge has invalid level '%s'" % lvl))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "schema-legal", "schema-legal", "all edge types/combos/levels permitted by frozen KG schema")]
    return findings


def pred_class_consistency_bidirectional(ctx):
    """CL-1: item_class==LOCALIZING IFF >=1 anatomical LOCALIZES_TO edge with level==PRIMARY.
    NONLOC (and any non-anatomical target) never qualifies. Both directions checked."""
    kg = ctx["kg"]; reg = ctx["registry"]
    if kg is None or reg is None:
        return [_f(R_FAIL, FC_CONFIG, "INV-CLASS-1", "unloaded", "loaded", "kg/registry not loaded")]
    anatomical = set(ctx["manifest"]["graph_schema"]["anatomical_targets"])
    declared = reg.get("declared", {})
    anat_prim = defaultdict(int)
    for e in kg.get("localizes_to_edges", []):
        if e.get("level") == "PRIMARY" and e.get("to") in anatomical:
            anat_prim[e.get("from")] += 1
    findings = []
    # Direction A: declared LOCALIZING must have >=1 anatomical PRIMARY
    for iid, cls in declared.items():
        n = anat_prim.get(iid, 0)
        if cls == "LOCALIZING" and n == 0:
            findings.append(_f(R_FAIL, FC_FATAL, iid, "declared=LOCALIZING anat_primary=0", "anat_primary>=1",
                               "false-positive declaration: %s declared LOCALIZING but has 0 anatomical PRIMARY" % iid))
    # Direction B: >=1 anatomical PRIMARY must be declared LOCALIZING (and must be declared)
    for iid in anat_prim.keys():
        if iid not in declared:
            findings.append(_f(R_FAIL, FC_FATAL, iid, "anat_primary>=1 declared=MISSING", "declared LOCALIZING",
                               "missing declaration: %s has anatomical PRIMARY but is absent from registry" % iid))
        elif declared[iid] != "LOCALIZING":
            findings.append(_f(R_FAIL, FC_FATAL, iid, "anat_primary>=1 declared=%s" % declared[iid], "declared LOCALIZING",
                               "false-negative declaration: %s has anatomical PRIMARY but declared %s" % (iid, declared[iid])))
    if not findings:
        nloc = sum(1 for c in declared.values() if c == "LOCALIZING")
        return [_f(R_PASS, FC_FATAL, "*", "%d LOCALIZING consistent" % nloc, "bidirectional-consistent",
                   "INV-CLASS-1 holds both directions (anatomical PRIMARY; NONLOC excluded)")]
    return findings


# ------------------------- Stage 2 predicates (PG-6A-04) -------------------------
# Core-24 is owned entirely by INV-CORE24-1 (existence/parse/hash/integrity) so it does NOT
# route through the Stage-1 loader / INV-RESOURCE-1. Additive: no Stage-1 predicate changed.

def _load_core24(ctx):
    """Load + parse Core-24 via core24_binding. Returns (parsed, actual_sha, error_finding_or_None)."""
    b = ctx["manifest"].get("core24_binding")
    if b is None:
        return None, None, _f(R_FAIL, FC_CONFIG, "CORE24_V1_0", "no_binding", "core24_binding", "manifest lacks core24_binding")
    path = os.path.join(ctx["base_dir"], b["path"])
    if not os.path.exists(path) or not os.path.isfile(path):
        return None, None, _f(R_FAIL, FC_FATAL, "CORE24_V1_0", "missing", "exists", "Core-24 artifact missing at %s" % b["path"])
    try:
        actual_sha = sha256_of_file(path)
        with open(path, "r", encoding="utf-8") as f:
            parsed = json.loads(f.read())
    except json.JSONDecodeError as e:
        return None, None, _f(R_FAIL, FC_FATAL, "CORE24_V1_0", "parse_error", "parseable", "Core-24 parse error: %s" % e)
    except Exception as e:
        return None, None, _f(R_FAIL, FC_FATAL, "CORE24_V1_0", "unreadable", "readable", "Core-24 unreadable: %s" % e)
    return parsed, actual_sha, None


def pred_core24_integrity(ctx):
    """INV-CORE24-1: frozen Core-24 build-artifact integrity (NOT a clinical rule)."""
    b = ctx["manifest"]["core24_binding"]
    exp = b["expected"]
    reg = ctx["registry"]
    accepted = ctx["manifest"]["enums"]["item_class_accepted"]
    core, actual_sha, err = _load_core24(ctx)
    if err is not None:
        return [err]
    findings = []
    if actual_sha != b.get("frozen_sha256"):
        findings.append(_f(R_FAIL, FC_FATAL, "CORE24_V1_0", actual_sha[:12], (b.get("frozen_sha256") or "")[:12],
                           "Core-24 frozen_sha256 mismatch"))
    if core.get("version") != exp["version"]:
        findings.append(_f(R_FAIL, FC_FATAL, "version", core.get("version"), exp["version"], "Core-24 version mismatch"))
    if core.get("status") != exp["status"]:
        findings.append(_f(R_FAIL, FC_FATAL, "status", core.get("status"), exp["status"], "Core-24 status != FROZEN"))
    if core.get("authority") != exp["authority"]:
        findings.append(_f(R_FAIL, FC_FATAL, "authority", core.get("authority"), exp["authority"], "Core-24 authority mismatch"))
    items = core.get("items", [])
    ids = [it.get("item_id") for it in items]
    if len(ids) != exp["item_count"]:
        findings.append(_f(R_FAIL, FC_FATAL, "item_count", len(ids), exp["item_count"], "Core-24 item_count != %d" % exp["item_count"]))
    seen = set(); dups = set()
    for i in ids:
        if i in seen:
            dups.add(i)
        seen.add(i)
    for d in sorted(dups):
        findings.append(_f(R_FAIL, FC_FATAL, d, "duplicate", "unique", "Core-24 duplicate item id %s" % d))
    if reg is not None:
        declared = reg.get("declared", {})
        for i in ids:
            if i not in declared:
                findings.append(_f(R_FAIL, FC_FATAL, i, "not_in_registry", "in_registry", "Core-24 item %s not in Registry" % i))
    dist = {}
    for it in items:
        c = it.get("item_class")
        dist[c] = dist.get(c, 0) + 1
        if c not in accepted:
            findings.append(_f(R_FAIL, FC_FATAL, it.get("item_id"), c, "canonical enum",
                               "Core-24 item %s non-canonical item_class '%s'" % (it.get("item_id"), c)))
        if c == "IMPACT":
            findings.append(_f(R_FAIL, FC_FATAL, it.get("item_id"), "IMPACT", "no IMPACT",
                               "Core-24 contains IMPACT item %s" % it.get("item_id")))
    exp_dist = exp["class_distribution"]
    if {k: dist.get(k, 0) for k in exp_dist} != exp_dist:
        findings.append(_f(R_FAIL, FC_FATAL, "class_distribution", str(dist), str(exp_dist), "Core-24 class distribution != 22/2/0"))
    for m in exp["mandatory"]:
        if m not in ids:
            findings.append(_f(R_FAIL, FC_FATAL, m, "missing", "present", "Core-24 mandatory item %s missing" % m))
    if not findings:
        f = _f(R_PASS, FC_FATAL, "*", "integrity OK", "integrity OK",
               "Core-24 v%s FROZEN integrity verified (sha256 %s.., %d items)" % (core.get("version"), actual_sha[:12], len(ids)))
        f["evidence"] = {"version": core.get("version"), "status": core.get("status"), "sha256": actual_sha,
                         "authority": core.get("authority"), "item_count": len(ids), "class_distribution": dist,
                         "registry_identity": "all %d Core-24 IDs present in Registry" % len(ids)}
        return [f]
    return findings


def pred_core24_coverage_preservation(ctx):
    """INV-P5-1: coverage preservation ONLY. Coverage recomputed from frozen KG (never trust manifest)."""
    reg = ctx["registry"]; kg = ctx["kg"]
    if reg is None or kg is None:
        return [_f(R_FAIL, FC_CONFIG, "INV-P5-1", "unloaded", "loaded", "registry/kg not loaded")]
    core, _sha, err = _load_core24(ctx)
    if err is not None:
        return [_f(R_FAIL, FC_CONFIG, "CORE24_V1_0", "unavailable", "loaded", "INV-P5-1 cannot run: %s" % err["message"])]
    inv = next((i for i in ctx["manifest"]["invariants"] if i["invariant_id"] == "INV-P5-1"), {})
    exceptions = set(inv.get("exceptions", ["BG", "CERV"]))
    anatomical = set(ctx["manifest"]["graph_schema"]["anatomical_targets"])
    anat_prim = defaultdict(set)
    for e in kg.get("localizes_to_edges", []):
        if e.get("level") == "PRIMARY" and e.get("to") in anatomical:
            anat_prim[e.get("to")].add(e.get("from"))
    declared = reg.get("declared", {})
    core_ids = set(it.get("item_id") for it in core.get("items", []))
    base_cov = {s: len([i for i in anat_prim.get(s, set()) if i in declared]) for s in anatomical}
    core_cov = {s: len([i for i in anat_prim.get(s, set()) if i in core_ids]) for s in anatomical}
    violations = [s for s in sorted(anatomical) if base_cov[s] > 0 and core_cov[s] == 0 and s not in exceptions]
    evidence = {"kg_recomputed": True, "manifest_declared_coverage_ignored": True,
                "baseline_primary": base_cov, "core24_primary": core_cov,
                "exceptions": sorted(exceptions), "zeroed_non_exempt": violations}
    if violations:
        out = []
        for s in violations:
            f = _f(R_FAIL, FC_FATAL, s, "baseline=%d core24=0" % base_cov[s], "core24>0",
                   "INV-P5-1: substrate %s PRIMARY coverage reduced >0 -> 0 (non-exempt)" % s)
            f["evidence"] = evidence
            out.append(f)
        return out
    f = _f(R_PASS, FC_FATAL, "*", "0 violations", "0 violations",
           "INV-P5-1 PASS: no non-exempt substrate reduced >0->0 (coverage recomputed from frozen KG; BG/CERV exempt)")
    f["evidence"] = evidence
    return [f]


# ------------------------- Stage 3E authority-binding predicates (PG-6A-1B) -------------------------
# Additive: none of the Stage-1/Stage-2 predicates (incl. Core-24) are changed.

def _amap(ctx):
    return {a["artifact_id"]: a for a in ctx["manifest"]["artifacts"]}


def pred_qb_resource(ctx):
    """INV-QB-RESOURCE-1: frozen QB is the release-eligible wording SSOT (hash loader-verified),
    status FROZEN, release_eligible True, item_count 48, authority_role PATIENT_WORDING_SSOT."""
    qb = ctx.get("frozen_qb"); a = _amap(ctx).get("L3_CANONICAL_WORDING_QB")
    if qb is None or a is None:
        return [_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", "unloaded/unbound", "loaded+bound",
                   "frozen QB not loaded or not bound in manifest")]
    findings = []
    if qb.get("status") != "FROZEN":
        findings.append(_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", qb.get("status"), "FROZEN", "frozen QB status is not FROZEN"))
    if a.get("release_eligible") is not True:
        findings.append(_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", a.get("release_eligible"), True, "frozen QB not release_eligible in manifest"))
    n = len(qb.get("items", []))
    if n != 48:
        findings.append(_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", n, 48, "frozen QB item_count != 48"))
    if a.get("authority_role") != "PATIENT_WORDING_SSOT":
        findings.append(_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", a.get("authority_role"), "PATIENT_WORDING_SSOT", "frozen QB authority_role wrong"))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "L3_CANONICAL_WORDING_QB", "FROZEN/48/release-eligible", "wording SSOT bound",
                   "frozen QB is the hash-verified, release-eligible patient-wording SSOT (48 items)")]
    return findings


def pred_registry_authority_split(ctx):
    """INV-REG-SPLIT-1: Registry v1.1 has 48 unique items; every item has wording_source AND
    mapping_source; every wording_source points to the frozen QB artifact+sha256; every
    mapping_source is a REFERENCE to the authorized NPI mapping artifact."""
    items = ctx.get("registry_items"); a = _amap(ctx).get("L3_CANONICAL_WORDING_QB")
    if items is None:
        return [_f(R_FAIL, FC_FATAL, "L3_ITEM_CLASS_REGISTRY", "no items[]", "authority-split v1.1",
                   "Registry is not authority-split (no items[]); Stage 3E requires Registry v1.1")]
    qb_sha = (a or {}).get("sha256")
    # Expected authority artifacts DERIVED from manifest authority_binding as LOGICAL artifact NAMES
    # (SA fix A 2026-07-28): compare logical basenames, never raw repo-relative paths vs the frozen
    # Registry's basename pointers. Loading/integrity still uses the full repo-relative path + sha256.
    ab = ctx["manifest"].get("authority_binding", {})
    exp_wording_artifact = _logical_artifact_name(
        ab.get("patient_wording_validation_source", {}).get("path") or "BCF_QUESTION_BANK_v1.0_FROZEN.json")
    exp_mapping_artifact = _logical_artifact_name(
        ab.get("mapping_reference", {}).get("path") or "BCF_NPI_QUESTION_BANK_v0.2.md", strip_extension=True)
    findings = []
    ids = [it.get("item_id") for it in items]
    if len(items) != 48 or len(set(ids)) != 48:
        findings.append(_f(R_FAIL, FC_FATAL, "L3_ITEM_CLASS_REGISTRY", "%d items / %d unique" % (len(items), len(set(ids))),
                           "48/48", "Registry v1.1 is not 48 unique items"))
    for it in items:
        iid = it.get("item_id")
        ws = it.get("wording_source"); ms = it.get("mapping_source")
        if not isinstance(ws, dict) or ws.get("artifact") != exp_wording_artifact or ws.get("sha256") != qb_sha:
            findings.append(_f(R_FAIL, FC_FATAL, iid, ws, "wording_source->%s sha256 %s" % (exp_wording_artifact, (qb_sha or "?")[:12]),
                               "item %s wording_source not bound to the authorized frozen QB" % iid))
        if not isinstance(ms, dict) or ms.get("status") != "REFERENCE" or ms.get("artifact") != exp_mapping_artifact:
            findings.append(_f(R_FAIL, FC_FATAL, iid, ms, "mapping_source->%s status=REFERENCE" % exp_mapping_artifact,
                               "item %s mapping_source not a REFERENCE to the authorized NPI mapping reference" % iid))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "48/48 wording_source+mapping_source", "authority-split",
                   "Registry v1.1 authority-split valid: wording_source->frozen QB, mapping_source=REFERENCE->authorized NPI")]
    return findings


def pred_patient_wording_authority(ctx):
    """INV-WORDING-AUTH-1: patient wording read-only from frozen QB; Registry holds a POINTER, never a
    duplicated copy of patient wording."""
    items = ctx.get("registry_items"); qb = ctx.get("frozen_qb")
    if items is None or qb is None:
        return [_f(R_FAIL, FC_FATAL, "wording_authority", "unloaded", "loaded", "Registry v1.1 / frozen QB not loaded")]
    findings = []
    wording_fields = ("patient_wording_zh", "patient_wording", "wording", "zh", "label_en", "stem", "text")
    for it in items:
        embedded = [k for k in wording_fields if k in it]
        if embedded:
            findings.append(_f(R_FAIL, FC_FATAL, it.get("item_id"), "embeds %s" % embedded, "pointer only",
                               "Registry item %s embeds patient wording (must be a pointer, not a copy)" % it.get("item_id")))
    if not all("patient_wording_zh" in i for i in qb.get("items", [])):
        findings.append(_f(R_FAIL, FC_FATAL, "L3_CANONICAL_WORDING_QB", "missing patient_wording_zh", "present on all items",
                           "frozen QB items missing patient_wording_zh (wording SSOT must hold the wording)"))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "pointer-only registry / wording in frozen QB", "read-only from frozen QB",
                   "patient wording sourced only from frozen QB; Registry holds pointers, no duplicated wording")]
    return findings


def pred_mapping_not_wording(ctx):
    """INV-MAP-NOT-WORD-1: mapping reference is never a wording source; its forbidden_uses contains
    PATIENT_WORDING_VALIDATION (and permitted_uses does not); wording_evidence_sources is exactly the
    frozen QB, never the mapping reference."""
    npi = _amap(ctx).get("L3_NPI_MAPPING_REFERENCE")
    ab = ctx["manifest"].get("authority_binding", {})
    findings = []
    if npi is None:
        findings.append(_f(R_FAIL, FC_FATAL, "L3_NPI_MAPPING_REFERENCE", "unbound", "bound as mapping reference",
                           "NPI mapping reference not bound in manifest"))
    else:
        if "PATIENT_WORDING_VALIDATION" not in npi.get("forbidden_uses", []):
            findings.append(_f(R_FAIL, FC_FATAL, "L3_NPI_MAPPING_REFERENCE", npi.get("forbidden_uses"),
                               "forbidden_uses contains PATIENT_WORDING_VALIDATION", "NPI forbidden_uses missing PATIENT_WORDING_VALIDATION"))
        if "PATIENT_WORDING_VALIDATION" in npi.get("permitted_uses", []):
            findings.append(_f(R_FAIL, FC_FATAL, "L3_NPI_MAPPING_REFERENCE", npi.get("permitted_uses"),
                               "permitted_uses excludes PATIENT_WORDING_VALIDATION", "NPI permitted_uses must not include PATIENT_WORDING_VALIDATION"))
    wes = ab.get("wording_evidence_sources")
    if wes != ["L3_CANONICAL_WORDING_QB"]:
        findings.append(_f(R_FAIL, FC_FATAL, "wording_evidence_sources", wes, "['L3_CANONICAL_WORDING_QB']",
                           "wording_evidence_sources must be exactly the frozen QB (never the mapping reference)"))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "mapping-reference != wording-source", "separated",
                   "mapping reference forbidden for patient-wording validation; wording bound only to frozen QB")]
    return findings


def pred_qb_registry_identity(ctx):
    """INV-QB-REG-IDENTITY-1: frozen QB item_ids == Registry v1.1 item_ids (48/48 set equality);
    item_class matches 48/48."""
    items = ctx.get("registry_items"); qb = ctx.get("frozen_qb")
    if items is None or qb is None:
        return [_f(R_FAIL, FC_FATAL, "qb_registry_identity", "unloaded", "loaded", "Registry v1.1 / frozen QB not loaded")]
    reg_class = {it.get("item_id"): it.get("item_class") for it in items}
    qb_class = {i.get("item_id"): i.get("item_class") for i in qb.get("items", [])}
    reg_ids = set(reg_class); qb_ids = set(qb_class)
    findings = []
    if reg_ids != qb_ids:
        findings.append(_f(R_FAIL, FC_FATAL, "*", "reg_only=%s qb_only=%s" % (sorted(reg_ids - qb_ids), sorted(qb_ids - reg_ids)),
                           "identical 48 id sets", "frozen QB / Registry item_id sets differ"))
    else:
        mm = [i for i in reg_ids if reg_class[i] != qb_class[i]]
        if mm:
            findings.append(_f(R_FAIL, FC_FATAL, "*", "class mismatch %s" % mm, "48/48 item_class match",
                               "frozen QB / Registry item_class mismatch"))
    if not findings:
        return [_f(R_PASS, FC_FATAL, "*", "48/48 id+class identical", "identical",
                   "frozen QB and Registry v1.1 share identical 48 item_ids + item_class")]
    return findings


PREDICATES = {
    "pred_resource_present": pred_resource_present,
    "pred_version_identity": pred_version_identity,
    "pred_unique_id": pred_unique_id,
    "pred_required_metadata": pred_required_metadata,
    "pred_item_class_enum": pred_item_class_enum,
    "pred_kg_referential": pred_kg_referential,
    "pred_kg_schema": pred_kg_schema,
    "pred_class_consistency_bidirectional": pred_class_consistency_bidirectional,
    "pred_core24_integrity": pred_core24_integrity,
    "pred_core24_coverage_preservation": pred_core24_coverage_preservation,
    "pred_qb_resource": pred_qb_resource,
    "pred_registry_authority_split": pred_registry_authority_split,
    "pred_patient_wording_authority": pred_patient_wording_authority,
    "pred_mapping_not_wording": pred_mapping_not_wording,
    "pred_qb_registry_identity": pred_qb_registry_identity,
}


def _inv_result(findings):
    if all(f["result"] == R_NOT_RUN for f in findings):
        return R_NOT_RUN
    if any(f["result"] == R_FAIL for f in findings):
        return R_FAIL
    return R_PASS


def _artifact_versions(manifest, evidence_ids):
    amap = {a["artifact_id"]: a for a in manifest["artifacts"]}
    b = manifest.get("core24_binding")
    if b:  # Core-24 is bound via core24_binding, not artifacts[]; expose for audit evidence
        amap[b["artifact_id"]] = {"declared_version": b.get("declared_version"),
                                  "sha256": b.get("frozen_sha256"), "source_status": b.get("source_status")}
    return [{"artifact_id": aid, "declared_version": amap.get(aid, {}).get("declared_version"),
             "sha256": amap.get(aid, {}).get("sha256"), "source_status": amap.get(aid, {}).get("source_status")}
            for aid in evidence_ids]


def run_validation(manifest_path, metadata_manifest_path, base_dir,
                   execution_mode="DEVELOPMENT", run_id=None, timestamp=None):
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    metadata_manifest = json.load(open(metadata_manifest_path, encoding="utf-8"))
    run_id = run_id or "run-unstamped"
    timestamp = timestamp or "UNSTAMPED"

    loader = ReadOnlyLoader(base_dir, manifest["artifacts"])
    loader_findings = loader.load_all()

    # Stage 3E: normalize the authority-split Registry v1.1 (items[]) into a backward-compatible
    # `declared` (item_id -> item_class) view so existing identity/class/KG/Core-24 predicates run
    # unchanged, while exposing the raw items[] for the new authority-split invariants. No content altered.
    reg_parsed = loader.parsed.get("L3_ITEM_CLASS_REGISTRY")
    reg_items = None
    if isinstance(reg_parsed, dict) and "items" in reg_parsed and "declared" not in reg_parsed:
        reg_items = reg_parsed.get("items") or []
        reg_norm = dict(reg_parsed)
        reg_norm["declared"] = {it.get("item_id"): it.get("item_class") for it in reg_items}
        reg_parsed = reg_norm

    ctx = {
        "manifest": manifest, "metadata_manifest": metadata_manifest,
        "loader_findings": loader_findings, "execution_mode": execution_mode,
        "registry": reg_parsed,
        "registry_items": reg_items,
        "frozen_qb": loader.parsed.get("L3_CANONICAL_WORDING_QB"),
        "kg": loader.parsed.get("L3_KNOWLEDGE_GRAPH"),
        "raw": loader.raw,
        "base_dir": base_dir,
    }

    # Core-24 read-only evidence (SA Stage-2 closeout): capture hash at validation load.
    _c24b = manifest.get("core24_binding")
    _core24_path = os.path.join(base_dir, _c24b["path"]) if _c24b else None
    core24_before = _safe_sha(_core24_path)

    inv_by_id = {i["invariant_id"]: i for i in manifest["invariants"]}
    audit_records = []
    gate_results = {}
    prior_fatal = False
    prior_fatal_source = None

    for gate in manifest["gate_order"]:
        gate_fatal = False
        gate_inv_results = []
        for inv_id in manifest["gate_invariants"][gate]:
            inv = inv_by_id[inv_id]
            if prior_fatal:
                findings = [_f(R_NOT_RUN, inv["failure_class"], "*", "not_run", "run",
                               "skipped: prior FATAL at %s" % prior_fatal_source, exercised=False)]
            else:
                findings = PREDICATES[inv["predicate_id"]](ctx)
            result = _inv_result(findings)
            gate_inv_results.append(result)
            audit_records.append({
                "run_id": run_id, "timestamp": timestamp, "validator_version": VALIDATOR_VERSION,
                "gate_id": gate, "invariant_id": inv_id, "result": result,
                "failure_class": inv["failure_class"], "blocking_scope": inv["blocking_scope"],
                "predicate_id": inv["predicate_id"], "normative_source": inv["normative_source"],
                "evidence_artifacts": _artifact_versions(manifest, inv.get("evidence_sources", [])),
                "vacuous": all(f.get("vacuous") for f in findings) if findings else False,
                "exercised": any(f.get("exercised") for f in findings),
                "production_complete": inv.get("production_complete", True),
                "findings": findings,
            })
            if result == R_FAIL and inv["failure_class"] == FC_FATAL:
                gate_fatal = True
        if gate_inv_results and all(x == R_NOT_RUN for x in gate_inv_results):
            gate_results[gate] = R_NOT_RUN
        elif gate_fatal:
            gate_results[gate] = R_FAIL
        else:
            gate_results[gate] = R_PASS
        if gate_fatal and not prior_fatal:
            prior_fatal = True
            prior_fatal_source = gate

    unchanged = loader.verify_unchanged()
    # Core-24 (owned by INV-CORE24-1, not the loader) read-only evidence: recompute after all gates.
    core24_after = _safe_sha(_core24_path)
    core24_unch = (core24_before == core24_after) if (core24_before is not None and core24_after is not None) else None
    unchanged.append({"artifact_id": "CORE24_V1_0", "before": core24_before, "after": core24_after, "unchanged": core24_unch})
    # all_unchanged: a read-only VIOLATION is a touched artifact that CHANGED; a missing/null Core-24
    # (unchanged=None) is not a violation, so it does not force all_unchanged False, but a False does.
    all_unchanged = all(u["unchanged"] is True for u in unchanged if u["unchanged"] is not None)

    # Stage 3E: capability-scoped, FAIL-CLOSED resource status. Separate the governance DECLARATION
    # (manifest release_eligible booleans) from the VALIDATED status. A declared-eligible resource is
    # only RELEASE_ELIGIBLE_VALIDATED if the integrity/authority gates actually PASSED and no source
    # changed; any hash mismatch / missing / parse error / authority failure => INVALID_RESOURCE. Never
    # emit an eligible label on a failed run (PEC: no silent failure, fail-closed).
    amap = {a["artifact_id"]: a for a in manifest["artifacts"]}
    ab = manifest.get("authority_binding", {})
    wording_req = ab.get("wording_release_gate", {}).get("requires_release_eligible",
                                                         ["L3_CANONICAL_WORDING_QB", "L3_ITEM_CLASS_REGISTRY"])
    wording_declared_eligible = all(amap.get(a, {}).get("release_eligible") is True for a in wording_req)
    _req_gates = [g for g in ("PG-6A-01", "PG-6A-1B") if g in set(manifest["gate_order"])]
    required_integrity_ok = all(gate_results.get(g) == R_PASS for g in _req_gates) and all_unchanged
    if not required_integrity_ok:
        resource_status = "INVALID_RESOURCE"
    elif wording_declared_eligible:
        resource_status = "RELEASE_ELIGIBLE_VALIDATED"
    else:
        resource_status = "NON_RELEASE_ELIGIBLE"
    wording_release_eligible = (resource_status == "RELEASE_ELIGIBLE_VALIDATED")
    mapping_gate_status = ab.get("mapping_release_gate", {}).get("status", "DEFERRED_OR_SEPARATE")
    authority_binding_status = {
        "wording_release_gate": {"requires_release_eligible": wording_req,
                                 "declared_eligible": wording_declared_eligible,
                                 "integrity_ok": required_integrity_ok,
                                 "validated_release_eligible": wording_release_eligible},
        "mapping_release_gate": {"status": mapping_gate_status,
                                 "note": "NPI mapping content NOT production-released; does not block wording gate; not a claim of full mapping verification"},
        "patient_wording_validation_source": ab.get("patient_wording_validation_source"),
        "registry_authority_source": ab.get("registry_authority_source"),
        "mapping_reference": ab.get("mapping_reference"),
    }

    # PG-6A-FINAL: structurally BLOCKED (PG-6A-05/06 not implemented/authorized; formal PG rerun not
    # authorized in this workspace reconstruction). Capability-scoped wording eligibility does NOT unblock.
    final_reasons = []
    if not wording_release_eligible:
        final_reasons.append("wording_release_gate not validated-eligible: resource_status=%s (declared_eligible=%s, integrity_ok=%s)"
                             % (resource_status, wording_declared_eligible, required_integrity_ok))
    final_reasons.append("PG-6A-05 / PG-6A-06 not implemented or not authorized")
    final_reasons.append("mapping_release_gate=%s (NPI mapping content not production-released; does not block wording gate)" % mapping_gate_status)
    if not all_unchanged:
        final_reasons.append("source artifact changed during validation (read-only violation)")
    pg_final = {"status": "BLOCKED", "release_eligible": False, "reasons": final_reasons}

    # control-manifest provenance (ruling §4, MINOR; required_before_pg_6a_06_completion):
    # prove which predicate/metadata manifest version drove this run, not just that clinical inputs are unchanged.
    def _file_sha(p):
        h = hashlib.sha256()
        with open(p, "rb") as fh:
            h.update(fh.read())
        return h.hexdigest()
    control_manifests = [
        {"artifact_id": "VALIDATOR_MANIFEST", "path": os.path.basename(manifest_path),
         "manifest_version": manifest.get("manifest_version"), "manifest_status": manifest.get("manifest_status"),
         "sha256": _file_sha(manifest_path)},
        {"artifact_id": "REQUIRED_METADATA_MANIFEST", "path": os.path.basename(metadata_manifest_path),
         "manifest_version": metadata_manifest.get("manifest_version"), "manifest_status": metadata_manifest.get("manifest_status"),
         "review_status": metadata_manifest.get("review_status"), "sha256": _file_sha(metadata_manifest_path)},
    ]

    return {
        "run_id": run_id, "timestamp": timestamp, "validator_version": VALIDATOR_VERSION,
        "execution_mode": execution_mode, "release_scope": "BUILD_ONLY",
        "resource_status": resource_status,
        "authority_binding_status": authority_binding_status,
        "loader_provenance": loader.provenance,
        "control_manifests": control_manifests,
        "gate_order": manifest["gate_order"], "gate_results": gate_results,
        "prior_fatal_source": prior_fatal_source,
        "read_only_evidence": {"unchanged": unchanged, "all_unchanged": all_unchanged},
        "pg_6a_final": pg_final,
        "audit_records": audit_records,
        "decisions": manifest.get("decisions", []),
        "open_issues": manifest.get("open_issues", []),
    }


def summarize(report):
    lines = []
    lines.append("=== BCF Phase 6A Validator (Stage 1+2) — %s ===" % report["validator_version"])
    lines.append("execution_mode=%s  resource_status=%s  release_scope=%s"
                 % (report["execution_mode"], report["resource_status"], report["release_scope"]))
    for g in report["gate_order"]:
        lines.append("  %s: %s" % (g, report["gate_results"][g]))
    for r in report["audit_records"]:
        n_fail = sum(1 for f in r["findings"] if f["result"] == R_FAIL)
        tag = r["result"] + (" (%d fail)" % n_fail if n_fail else "")
        pc = "" if r.get("production_complete", True) else "  [NOT production-complete]"
        lines.append("    [%s] %s = %s%s" % (r["gate_id"], r["invariant_id"], tag, pc))
    lines.append("  read-only unchanged: %s" % report["read_only_evidence"]["all_unchanged"])
    lines.append("  PG-6A-FINAL: %s — %s" % (report["pg_6a_final"]["status"], "; ".join(report["pg_6a_final"]["reasons"])))
    return "\n".join(lines)


if __name__ == "__main__":
    import sys, datetime
    mode = sys.argv[1] if len(sys.argv) > 1 else "DEVELOPMENT"
    base = os.path.dirname(os.path.abspath(__file__))
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    rid = "run-" + hashlib.sha256((mode + ts).encode()).hexdigest()[:12]
    rep = run_validation(os.path.join(base, "phase6a_validator_manifest.json"),
                         os.path.join(base, "phase6a_required_metadata_manifest.json"),
                         base, execution_mode=mode, run_id=rid, timestamp=ts)
    print(summarize(rep))
    out = os.path.join(base, "phase6a_audit_%s.json" % rid)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)
    print("\nwrote audit:", os.path.basename(out))
