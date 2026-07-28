# BCF Core-24 v1.0 — Freeze Record

**Date:** 2026-07-27 · **Status:** 🟢 **FROZEN** · **Authority:** Phase 5 Core-24 Clinical Content SSOT
**Recorded by:** Claude Code — Implementation Engineer

---

## 1. Freeze 觸發

**PM (Karl Li) 明確核准：**「核准 Core-24 v1.0 凍結（B1.1）」（2026-07-27）。
此為治理鏈最終決策 gate；收到後 Claude Code 產出本套凍結產物。

---

## 2. Selection lineage（B1 → B1.1）

| 階段 | 內容 | 結果 |
|---|---|---|
| **P5-R1** | 交接稱有「現有 24 題 v0.2 選題」 | Claude 對帳三 worksheet：實際僅 2 INCLUDE（OCM-07/CBL-01）+ 8 IMPACT 鎖定 + 34 未決 → **該 24 題不存在**；不重建（BLOCKED，客觀 groundwork 交付）|
| **P5-S1 / B1** | SA 給 provisional 清單 | Claude 逐字 materialize → 重算得 **25 題**（BSA=6）與 target 24 矛盾 → **REJECTED_ON_COUNT**（不自行刪題）|
| **Gemini challenge** | 獨立審查 | 獨立確認 25 題錯誤；提 B1-Revised（剔 BSA-06、CBL-05→COG-03）|
| **Claude 校正** | mapping 事實核對 | Gemini 兩處援引不符：FEF 在選集由 **COG-01+COG-02** 覆蓋（非只 COG-02）；CBL-05/CBL-02 PRIMARY = **CBH**（非 VCBL/Vermis）|
| **SA 最終裁決** | B1.1 | **OUT `BSA-07`**（保留 BSA-06：清醒呼吸症狀，與 BSA-08 睡眠呼吸互補）；Gemini swap `CBL-05→COG-03` **NOT ADOPTED**（FEF 已=2、COG-03≡COG-05 冗餘、CBL-05 錨定小腦構音）；採信 Gemini mapping correction |
| **B1.1 驗證** | Claude | 15 項 objective 全 PASS |
| **Gemini final challenge** | 針對實際 24 ID、用校正後 mapping | **CHALLENGE_COMPLETE_APPROVED**，無臨床異議 |
| **PM final approval** | Karl Li | **核准凍結** |

**Reviewer scenario 未採納（保留供 v1.1）：** Gemini B1-Revised（OUT CBL-05 / IN COG-03）。

---

## 3. Freeze Gate（19/19 全綠）

| 條件 | 結果 |
|---|---|
| exact_item_count = 24 | ✅ |
| item_ids_unique | ✅ |
| class_distribution 22/2/0 | ✅ |
| mandatory_items_present（OCM-07/CBL-01）| ✅ |
| inv_p5_1_violations = 0 | ✅ |
| non_exempt_primary_zero_count = 0 | ✅ |
| only BG/CERV zero | ✅ |
| item_class_valid（canonical token）| ✅ |
| impact_items_in_core24 = 0 | ✅ |
| domain 5/5/5/4/5 | ✅ |
| dual_candidate 7/7 | ✅ |
| pair_constraints（VNUC/MIDB）| ✅ |
| eligible_pool_membership | ✅ |
| neural_phenotype_reviewed | ✅ |
| machine_readable_manifest | ✅ |
| source_hashes_recorded | ✅ |
| source_artifacts_unchanged | ✅ |
| gemini_independent_review = PASS | ✅ |
| **pm_clinical_approval = APPROVED** | ✅ |

---

## 4. Source artifacts（凍結、未變更）

| Artifact | sha256 |
|---|---|
| `BCF_L3_item_class_registry.json` | `2fd9d9f2f7c70343f264644e0f17858ed7d7c678870e6bd4fb5290fdbcc54d79` |
| `BCF_KnowledgeGraph_L3_localizes_to.json`（`graph_version phase4-v0.4`）| `c00b17443da296d245cbf80cfb74f698b5dd437e54bba85cea5e21420b1c5f56` |

Core-24 選定**不修改** Phase-4 凍結的 48 題候選池；未入選題保留於池中。

---

## 5. Schema hygiene（§④）

Core-24 v1.0 所有機讀產物的 `item_class` 一律採 canonical **`NON_LOCALIZING_PHENOTYPE`**。
舊 worksheet v0.3 的簡寫 `NON_LOC_PHENOTYPE` 未被沿用；`BCF_Core24_Selection_Worksheet_v1.0.xlsx` 為**新檔**，未覆寫既有 frozen-candidate worksheet。

---

## 6. Frozen 產物

- `BCF_Core24_v1.0.md`（spec）
- `BCF_Core24_v1.0.json`（machine-readable manifest, `status: FROZEN`）
- `BCF_Core24_Selection_Worksheet_v1.0.xlsx`
- `BCF_Core24_Coverage_Report_v1.0.json`
- `BCF_Core24_Freeze_Record_v1.0.md`（本檔）

---

## 7. 下游狀態（凍結後）

```yaml
phase_5_core24: FROZEN (v1.0)
pg_6a_04: BLOCKED — 需另行授權
phase_6a: modification PROHIBITED
phase_6a_stage_2: NOT_AUTHORIZED — 待另行交接
```

Core-24 v1.0 已凍結為 Phase 5 Core-24 Clinical Content SSOT。進入 PG-6A-04 / Phase 6A Stage 2 需 PM／SA 另行授權。

*Claude Code 不做臨床或選題裁決。本 freeze record 為 PM 核准後的凍結存證。*
