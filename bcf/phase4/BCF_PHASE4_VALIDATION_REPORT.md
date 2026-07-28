# BCF Phase 4 — Neural Mapping Validation Report

**Date:** 2026-07-27 · **Author:** Claude Code（Implementation & Documentation）
**Input:** `BCF_Neural_Mapping_Matrix_v0.3_filled.xlsx`（ChatGPT + 臨床專家填寫）
**Output:** `BCF_Neural_Mapping_Matrix_v0.4.xlsx`（含 OCM-04 裁決修正）·
`BCF_KnowledgeGraph_L3_localizes_to.json`
**方法:** 所有檢查以 Python **獨立重算**，不讀試算表自身公式（那些公式是 Claude 寫的，不能拿它驗它自己）

> 🟢 **PHASE 4 — COMPLETE（架構＋PM 裁決 2026-07-27）。** 矩陣與 Knowledge Graph 已凍結為基準；Phase 5 已授權。

---

## 0. 結論先行

| 項目 | 結果 |
|---|---|
| OCM-04 裁決（Option B）落地 | ✅ 已修正並驗證 |
| §⑫ 七道硬檢查 | 🟢 **全部 0 違規** |
| 48/48 mapping 完整 | ✅ |
| Knowledge Graph `LOCALIZES_TO` 匯入 | ✅ 110 邊 |
| 圖不變量 INV-2 / INV-4 / §⑨C | 🟢 全過 |
| **INV-1 可達性** | 🟢 **架構滿足（by construction）；runtime 驗證遞延 Phase 6（§5）** |
| Phase 4 完成條件（§⑫ 十二項） | 🟢 **1–12 全數滿足 → Phase 4 COMPLETE**（架構＋PM 裁決 2026-07-27） |

**一句話：** 矩陣結構與臨床安全不變量全部通過，Knowledge Graph 已匯入，Phase 4 正式結案。
INV-1 的定調：**架構滿足（by construction）** —— 目前架構保證不存在違規路徑；
真正的圖路徑驗證（`INV-1-RUNTIME`）遞延至 Phase 6。

---

## 1. OCM-04 裁決落地（Option B）

**PM 裁決（2026-07-27）：** 移除 OCM-04 的 `MIDB`／`PONS` PRIMARY，改 `NONLOC = PRIMARY`，
維持 `review_reason = TOO_BROAD` / `action = KEEP_AS_NON_LOCALIZING`。

| | 修正前（v0.3） | 修正後（v0.4） |
|---|---|---|
| 對映 | MIDB PRIMARY, PONS PRIMARY, FEF SUPPORTIVE | FEF SUPPORTIVE, **NONLOC PRIMARY** |
| 解剖 PRIMARY 數 | 2 | **0** |
| 內部一致性 | 🔴 disposition 與 mapping 打架 | 🟢 與 OCM-08／COG-08／BSA-08 同型 |

**副作用（已確認符合預期）：** 雙候選題數 **8 → 7** —— OCM-04 原本是 MIDB+PONS 雙候選，
降為非定位後正好少一個。數字自洽。

> ⚠️ **過程中攔到一個自身缺陷（誠實記錄）：** 第一次用 `ws.cell(r,c,None)` 清 MIDB/PONS
> **沒有生效** —— openpyxl 對 `cell(r,c,None)` 是「讀取」不是「寫入」，儲存格沒被清掉。
> 靠修正後的 verify-print 當場發現（印出來還是 PRIMARY），改用 `ws.cell(r,c).value=None`
> 並**從乾淨的 v0.3 原檔重做**（避免用到「NONLOC 已加、MIDB/PONS 未清」的壞中間檔）。
> 若只看「recalc 零錯誤」不會發現 —— 那是公式錯誤檢查，不是內容正確性檢查。

---

## 2. §⑫ 硬檢查（獨立重算，v0.4）

| 檢查 | 違規數 |
|---|---|
| ① 未填 mapping | **0** |
| ③ 3+ PRIMARY 未標 review | **0** |
| REVIEW 缺理由／處置 | **0** |
| ④ OCM 側化違規 | **0** |
| ⑤ DFN 進 localization | **0** |
| ⑥ 無任何 PRIMARY（靜默空白） | **0** |
| 未知系統代碼 | **0** |

`ITEM_REVIEW_REQUIRED` = 4：`OCM-04`（TOO_BROAD）· `OCM-08`（NON_LOCALIZING）·
`COG-08`（NON_LOCALIZING）· `BSA-08`（REQUIRES_OBJECTIVE_TEST）——
四題 action 皆 `KEEP_AS_NON_LOCALIZING`，**無任何 `REWRITE`／`SPLIT`／`REMOVE`**，
故**無待 PM 核准的題目改寫**（§⑥）。

---

## 3. Knowledge Graph `LOCALIZES_TO` 匯入

**檔案：** `BCF_KnowledgeGraph_L3_localizes_to.json`

| 邊型 | 數量 |
|---|---|
| `LOCALIZES_TO`（症狀 → 神經系統） | **110**（PRIMARY 43 / SECONDARY 37 / SUPPORTIVE 30） |
| `SUGGESTS`（症狀 → domain） | 48 |
| 非定位題（`NONLOC` 有值） | **12** |

**非定位 12 題** = DFN 全 8 題 + `OCM-04` + `OCM-08` + `COG-08` + `BSA-08`。
這些題**不產生任何解剖 PRIMARY 邊** —— NONLOC 是非定位哨兵節點，
下游不得把它當定位訊號（符合 §⑨A / §⑪ / INV-4）。

**雙候選 7 題（≥2 解剖 PRIMARY，符合 WP §3.1.3 primary + alternative）：**

| 題目 | 雙候選 |
|---|---|
| VES-03 | VNUC + VCBL |
| VES-05 | PVES + VNUC |
| OCM-06 | PAR + TEMP |
| CBL-01 | OMV + cFN |
| CBL-03 | VCBL + cFN（+ `laterality = REQUIRES_OBJECTIVE_CONFIRMATION`） |
| COG-02 | FEF + PAR |
| BSA-05 | MEDU + AUTO |

---

## 4. 圖不變量（Phase 4 可查部分）

| 不變量 | 結果 |
|---|---|
| **INV-2** OCM 八題任何側化邊 | 🟢 **0**（`NO LATERALITY FROM QUESTIONNAIRE`，§⑩） |
| **INV-4** DFN 八題解剖 `LOCALIZES_TO` 邊 | 🟢 **0**（只有 NONLOC，§⑨A） |
| **§⑨C** CBL-03 | 🟢 `laterality = REQUIRES_OBJECTIVE_CONFIRMATION`、雙候選 VCBL+cFN、單題不輸出 lesion side |
| 系統代碼合法性 | 🟢 110 邊全部指向 16 個合法 substrate |
| 無靜默空白 | 🟢 48 題每題至少 1 個 PRIMARY（解剖或 NONLOC） |

---

## 5. 🟢 INV-1 狀態：架構滿足（by construction）—— 這一節請務必讀

**INV-1（Knowledge Graph）：** 任何 `SYMPTOM → TRAINING_MODULE` 路徑必須經過
`OBJECTIVE_TEST` 或 `CLINICAL_REVIEW` 節點。

**現況：圖裡目前只有 `SUGGESTS` 與 `LOCALIZES_TO` 兩種邊。**
`VERIFIED_BY`（substrate → objective test）、`TREATED_BY`（substrate → training module）、
`DELIVERED_ON` 都還不存在 —— 它們需要 M1–M8 的作用機轉定義與裝置清單，屬 **Phase 6**。

→ **目前 `SYMPTOM → TRAINING_MODULE` 的路徑數 = 0。**
→ INV-1 **空真（vacuously true）**：沒有任何路徑，所以沒有任何路徑違反它。

> 🟢 **正式治理狀態（架構裁決 2026-07-27）：`ARCHITECTURALLY SATISFIED (by construction)`。**
> **不是** `PASSED`（runtime 未驗證）、**不是** `FAILED`（設計未違反）——
> 而是「目前架構保證不存在違規路徑；真正的圖路徑驗證待 Phase 6」。
> 這個措辭刻意避開「空真＝真驗證」的語意混淆，與 White Paper §4.1
> 「測試 stub 完整性會掩蓋真實環境缺失」的治理精神一致。

**真正的 INV-1 測試 = 新治理節點 `INV-1-RUNTIME`（Phase 6）。** 屆時對每條
`SYMPTOM → LOCALIZES_TO → VERIFIED_BY → TREATED_BY → TRAINING_MODULE` 跑 graph traversal，
**任何繞過 `VERIFIED_BY` 直達 `TRAINING_MODULE` 立即 FAIL。**

**Phase 6 前置義務清單** —— 以下每個「收到 PRIMARY」的 substrate，
在能連到任何 training module 前，都必須先接一個 `VERIFIED_BY`（objective test）：

```
PVES 5 · PAR 5 · FEF 5 · AUTO 5 · VCBL 4 · TEMP 4 · cFN 3 · CBH 3 ·
MEDU 3 · VNUC 2 · MIDB 2 · PONS 1 · OMV 1
```

**目前 INV-1 由建構保證（by construction）—— 這就是上述 `ARCHITECTURALLY SATISFIED` 的依據：** 因為（a）圖裡沒有任何 `TREATED_BY` 邊，
且（b）§⑪ 規定所有 Phase 4 輸出都是「phenotype candidate，須客觀確認」——
所以現在**沒有任何問卷 PRIMARY 可能到達訓練模組**。這是安全的，但安全來自「路還沒接」，
不是來自「守門已建好」。

---

## 6. Phase 4 完成條件對帳（架構裁決 §⑫）

| # | 條件 | 狀態 |
|---|---|---|
| 1 | 48 題均完成 mapping 或標 NON-LOCALIZING | ✅ |
| 2 | 無未解空白 mapping | ✅ |
| 3 | 所有多 PRIMARY 均有理由 | ✅（7 雙候選 + 3+ 者皆標 review） |
| 4 | OCM 無側化違規 | ✅ |
| 5 | DFN 不進 localization | ✅ |
| 6 | CBL-03 雙候選／需客觀確認 | ✅ |
| 7 | HC-BPPV 不由問卷側化或分類 | ✅（VES-02/07 僅 phenotype，附註在案） |
| 8 | INV-1 可達性 | 🟢 **ARCHITECTURALLY SATISFIED**（by construction）；`INV-1-RUNTIME` 遞延 Phase 6（§5） |
| 9 | Gemini 獨立臨床審 | ✅ 已完成（本輪 OCM-04 裁決為其產物） |
| 10 | 需改寫題目已回寫 | ✅ **無題目需改寫** |
| 11 | PM 核准 Phase 4 | ✅（Option B 裁決 + 雙重核准） |
| 12 | 進入 Phase 5 Core-24 | 🟢 **PM 正式授權（2026-07-27）** |

> ✅ **架構端已拍板（2026-07-27）：** 接受 Phase 4 的 INV-1 為 `ARCHITECTURALLY SATISFIED`，
> runtime 路徑檢查遞延 `INV-1-RUNTIME`（Phase 6）。§⑫ 12 項全數滿足。

---

## 7. 治理狀態

| 標的 | 狀態 |
|---|---|
| `BCF_Neural_Mapping_Matrix_v0.4.xlsx` | 🟢 **FROZEN — Phase 4 基準**（結構與不變量通過，OCM-04 已修正） |
| Layer 3 Question Bank | 🔴 仍 `DRAFT` —— Phase 4 mapping 通過 ≠ Layer 3 題庫 freeze；Core-24（Phase 5）未選 |
| Knowledge Graph | 🟢 **FROZEN — Phase 4 基準**（110 `LOCALIZES_TO` + 48 `SUGGESTS`）；`VERIFIED_BY`/`TREATED_BY` 待 Phase 6 |
| Production | 🔴 `NOT_AUTHORIZED` |

---

## 8. 下一步（Phase 4 結案後）

1. ✅ **架構端已定調** —— INV-1 = `ARCHITECTURALLY SATISFIED`；`INV-1-RUNTIME` 遞延 Phase 6。
2. ✅ **PM 已授權 Phase 5 Core-24** —— 見 `BCF Core-24 Selection Framework v0.1`。
3. ⏳ **Phase 6 開工首要任務（已登記）：** 為 §5 清單上的 13 個 substrate 接 `VERIFIED_BY`，
   讓 `INV-1-RUNTIME` 從架構保證變成真路徑檢查。

⚠️ 本報告所有關於矩陣內容的斷言均來自對 v0.4 的獨立重算；
關於現行 production 程式行為的任何敘述**仍未經 grep**，實作前必須實碼驗證（7/25 §九）。

---

*Claude Code 不做臨床或架構裁決。§⑫ 第 8 項與第 12 項刻意留給架構端與 PM。*
