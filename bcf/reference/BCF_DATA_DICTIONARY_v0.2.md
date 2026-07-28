# BCF DATA_DICTIONARY v0.2

**Date:** 2026-07-27 · **Author:** Claude Code
**治理狀態（四狀態模型，架構裁決 §③）：**

`DRAFT` → `FREEZE_CANDIDATE` → `FROZEN` → `PRODUCTION_AUTHORIZED`

| 標的 | 狀態 |
|---|---|
| Layer 4 RRS ／ Safety Gate | `FREEZE_CANDIDATE`（局部） |
| Clinical Flag `allowed_status[]` | `FREEZE_CANDIDATE`（局部） |
| **Clinical Flag Semantic Contract** | 🔴 `DRAFT` |
| **Layer 2 audit contract** | 🔴 `DRAFT` |
| **BCDM v1.1** | 🔴 `DRAFT` — **NOT FROZEN** |
| Production | 🔴 `NOT_AUTHORIZED` |

> 🔴 **局部模組通過，不代表整份 BCDM 可 freeze。**
> `FREEZE CANDIDATE = NO` · `FREEZE REVIEW READY = NO`
>
> **權威順序（架構裁決 §②）：**
> 1. 明確列出的 freeze admission criteria
> 2. 架構不變量與安全契約
> 3. 個別審查者的摘要句
>
> **摘要句不得覆蓋尚未完成的 required fields。**
**配套:** `BCF_QUESTION_BANK_v0.2.md`（題幹權威）· `BCF_Readiness_Prototype_v0.5.html`（可執行規格）

> ✅ 第六態 `ABSENT` 已納入；`AUTO_CLEARANCE_GRANTED` 可達性由 AT-L2-1／AT-L2-2 驗收通過（91/91）。
> 🔴 **Freeze admission criteria 10 項中，4–7 未完成** —— 見 §8.2。

---

## 1. 欄位定義規範（BCDM v1.1 Standard）

BCDM §五要求 **11 項**：`field_id` · `display_name` · `description` · `data_type` ·
`unit` · `valid_range` · `owner` · `update_frequency` · `clinical_purpose` · `ai_usage` · `version`

**BCDM v1.1 增補 3 項**（架構裁決 §④ 正式納入）：

| 欄位 | 治理層級 |
|---|---|
| `missing_policy` | **production schema 必填** |
| `provisional` | **production schema 必填** |
| `admission_test` | **governance metadata 必填**，存於 DATA_DICTIONARY / Schema Registry，**不重複寫入每筆病人紀錄** |

### 1.1 `data_type`
`int` · `decimal` · `bool` · `string` · `enum` · `enum[]` · `date` · `datetime` · `derived` · `pending`

### 1.2 `missing_policy`

| 值 | 行為 |
|---|---|
| `ESCALATE_ON_MISSING` | 缺答 → 升級／REVIEW（🔴 安全關鍵） |
| `REJECT_WRITE_ON_MISSING` | 缺值 → 拒絕寫入 |
| `NOT_EVALUABLE_EXCLUDE_FROM_DENOMINATOR` | 缺答同時退出分子與分母 |
| `NOT_EVALUABLE_BLOCK_SCORE` | 缺答超過門檻 → 整個量表不可評估 |
| `DERIVED_NEVER_MISSING` | 推導值，永不為空 |
| `OPTIONAL_NO_EFFECT` | 缺答無影響 |
| `PENDING_SPEC` | 規格未定 |

🚫 **禁用：** `DEFAULT_TO_ZERO` · `DEFAULT_TO_MEAN` · `IMPUTE`

> 🔴 `NOT_EVALUABLE_EXCLUDE_FROM_DENOMINATOR` **只有在計分式真的有分母時才成立**。
> 用在「原始總和 + 絕對分界」上，等同 `DEFAULT_TO_ZERO`（缺答貢獻 0，把病人推向寬鬆分級）。
> 現行 RBM 為**已答題平均分**，分母 = 已答題數，本 policy 名實相符。

### 1.3 哨兵值

```
❌ 禁用：'' / null / undefined
✅ 'NOT_ANSWERED'    使用者未作答
✅ 'NOT_EVALUABLE'   推導值資料不足
```
🔴 **驗收條件：** 讀取問卷欄位或推導分數的程式碼，**不得**出現 `if (value)` / `if (!value)`，
必須顯式列舉比對。（`btri/rbm = null` 與 `= 0` 在 truthiness 下同分支 —— SG-2 的全部意義就是這兩者不可混淆。）

---

## 2. 不變量登錄

| ID | 規則 |
|---|---|
| `SG-1` | 安全關鍵欄位缺答 → fail-open 指向升級 |
| `SG-2` | 缺答計為 NOT_EVALUABLE，不計 0 |
| `INV-RRS-1` | `RRS_BAND` 只由**未四捨五入的 RBM** 判定 |
| `INV-L2-1` | 沒有完成 Layer 2 評估，絕不得被詮釋為沒有 Clinical Flag |
| `INV-1` | `SYMPTOM → TRAINING_MODULE` 路徑必經 `OBJECTIVE_TEST` 或 `CLINICAL_REVIEW`（Phase 4：ARCHITECTURALLY SATISFIED by construction） |
| `INV-1-RUNTIME` | 🔵 **Phase 6 節點** —— 對完整圖跑 traversal；任何繞過 `VERIFIED_BY` 直達 `TRAINING_MODULE` 立即 FAIL |
| `INV-CLASS-1` | 🟣 宣告的 `item_class` 必須與凍結 mapping 一致：`LOCALIZING` ⟺ ≥1 解剖 PRIMARY；非定位類 ⟹ 0 PRIMARY；不得缺宣告 |
| `INV-P5-1` | 🟣 **Phase 5 節點** —— Core-24 選題不得使任何 substrate 的 PRIMARY 覆蓋由 >0 降為 0；例外 `ACCEPT_ZERO_COVERAGE = {BG, CERV}`（Layer-5 Exclusive Substrates，PM 裁決 2026-07-27） |
| `INV-5` | Layer 7 推論不得回寫覆蓋 Layer 1–6 原始觀察 |
| `REG` | `registry.length ≠ schema.expected_item_count` → `SPEC_REGISTRY_MISMATCH`，抑制 RRS |
| `INV-L2-2` | 完成的評估必須為每個必填 flag 提供合法非缺失狀態，無病史者填 `ABSENT` |
| `INV-L2-3` | `ABSENT` 絕不得由缺資料／`UNKNOWN`／無紀錄自動推導 |
| `AT-L2-1` | 必須存在至少一組臨床真實的 Layer 2 賦值可達 `AUTO_CLEARANCE_GRANTED` |
| `AT-L2-2` | 每個必填 flag 都須有「對從未罹病者為真且不阻塞」的狀態 |
| `INV-L2-AUDIT-1` | 每次狀態轉換產生**恰好一筆** append-only audit event |
| `INV-L2-AUDIT-2` | Audit event 絕不得經一般流程修改或刪除 |
| `INV-L2-AUDIT-3` | snapshot 須可由 audit history 重建，或標記 legacy pre-audit |
| `INV-L2-AUDIT-4` | 轉 `ABSENT` 須有已認證行為者 + reason code |
| `INV-L2-AUDIT-5` | 🔴 state update 與 audit append **原子性**同成功／同失敗 |

---

## 3. Identity Header

| field_id | type | valid_range | owner | missing_policy |
|---|---|---|---|---|
| `PATIENT_ID` | string | 非空；opaque（WP §4.3 不得由格式推斷語意） | System | `REJECT_WRITE_ON_MISSING` |
| `SESSION_ID` | string | 非空 \| `NOT_APPLICABLE`（Form B） | System | `REJECT_WRITE_ON_MISSING` |
| `FORM_TYPE` | enum | `BCF_READINESS` \| `BCF_NPI` \| `BCF_OUTCOME` | System | `REJECT_WRITE_ON_MISSING` |
| `FORM_VERSION` | string | semver-like | System | `REJECT_WRITE_ON_MISSING` |
| `ASSESSMENT_DATE` | date | ISO-8601 | Clinician | `REJECT_WRITE_ON_MISSING` |
| `CREATED_AT` | datetime | ISO-8601 UTC，server 產生 | System | `REJECT_WRITE_ON_MISSING` |

> 🔴 **`SESSION_ID` 為必要** —— Form A（治療前）與 Form C（治療後）以此綁定同一場次。
> 缺此鍵會在全新寫入路徑上重演 7/25 的 `BTRACKS_LATEST_RECORD_SELECTION_NONDETERMINISTIC`（同日多筆取值不定）。
>
> 🔴 **`ASSESSMENT_DATE` 與 `CREATED_AT` 必須分離** —— 7/25 §六記載真實受害記錄
> （`MTT409499fa-…` 存入療程日 06-24、實際操作 07-2X，**資料端不可辨識**，靠 PM 記憶發現）。
> 有 server 端 `CREATED_AT` 才能在資料端偵測回溯填寫。⚠️ 這**不取代** Commit A 的根治。
>
> ⚠️ `FORM_TYPE = BCF_NPI` 會**持久化進資料庫**。BCF-NPI（問卷）與 NPR（指標）已於本版分離命名，
> 但 enum 值本身建議在第一筆記錄寫入前最終確認。

---

## 4. Layer 4 — Readiness

### 4.1 安全閘門

| field_id | type | valid_range | missing_policy | provisional |
|---|---|---|---|---|
| `L4_SAFETY_FLAGS` | enum[] | EMERGENCY 7 + RED 8 + YELLOW 9 + `NONE_OF_THE_ABOVE` \| `NOT_ANSWERED` | `ESCALATE_ON_MISSING` | false |
| `L4_SAFETY_GATE` | derived | `EMERGENCY` \| `RED` \| `YELLOW` \| `GREEN` | `DERIVED_NEVER_MISSING`（無輸入 = YELLOW） | false |
| `L4_SAFETY_GATE_BASIS` | derived | `EXPLICIT_DENIAL` \| `FLAGGED` \| `SECTION_NOT_ANSWERED` | `DERIVED_NEVER_MISSING` | false |

🔴 `NONE_OF_THE_ABOVE` 與其他值**互斥**；同時出現 = 資料驗證錯誤。
🔴 `L4_SAFETY_GATE` 值域**不含** `NOT_ANSWERED` —— 缺答由規則轉 YELLOW，事實記在 `_BASIS`。
🔴 UI 禁用「安全」「通過」「無風險」。

### 4.2 Recovery Reserve 題目（12，代表 Q2-1；其餘同結構）

```yaml
field_id:         "L4_RRS_Q2_1_SLEEP_RECOVERY"
display_name:     "昨晚的睡眠品質差、或起床後感覺沒有恢復"
description:      "burden 計分：0 = 完全沒有，4 = 非常嚴重。"
data_type:        "int"
unit:             "Likert 0-4"
valid_range:      "0|1|2|3|4|'NOT_ANSWERED'"
owner:            "Patient"
update_frequency: "每次治療前"
clinical_purpose: "今日恢復儲備之睡眠面向"
ai_usage:         "RBM → RRS。EXCLUDED_FROM_LOCALIZATION"
version:          "0.2"
missing_policy:   "NOT_EVALUABLE_EXCLUDE_FROM_DENOMINATOR"
provisional:      false        # 題幹已 Gemini 核准
admission_test:
  improves_clinical_decision: "是 —— 睡眠剝奪直接降低訓練耐受"
  improves_ai_or_research:    "是 —— RRS 主要輸入"
  patient_burden_justified:   "是 —— 單題 Likert"
```

**全部 12 題共通：** `ai_usage` 皆含 `EXCLUDED_FROM_LOCALIZATION`；
`missing_policy` 皆為 `NOT_EVALUABLE_EXCLUDE_FROM_DENOMINATOR`；`provisional: false`。
題幹全文見 Question Bank v0.2 §2.2。

### 4.3 RRS 推導欄位

| field_id | type | valid_range | missing_policy | provisional |
|---|---|---|---|---|
| `L4_RRS_EXPECTED_COUNT` | derived | int，**由 versioned item registry 推導** | `DERIVED_NEVER_MISSING` | false |
| `L4_RRS_ANSWERED_COUNT` | derived | `0 … expected` | `DERIVED_NEVER_MISSING` | false |
| `L4_RRS_MISSING_ITEM_IDS` | string[] | 題號陣列 | `DERIVED_NEVER_MISSING` | false |
| `L4_RRS_COMPLETENESS_STATUS` | derived | `FULL` \| `PARTIAL_MAX_2_MISSING` \| `INSUFFICIENT` \| `SPEC_REGISTRY_MISMATCH` | `DERIVED_NEVER_MISSING` | false |
| `L4_RBM` | derived | `0.00–4.00` \| `'NOT_EVALUABLE'` | `NOT_EVALUABLE_BLOCK_SCORE` | **true** |
| `L4_RRS` | derived | `0–100` \| `'NOT_EVALUABLE'` | `NOT_EVALUABLE_BLOCK_SCORE` | **true** |
| `L4_RRS_BAND` | derived | `HIGH_RESERVE` \| `MODERATE_RESERVE` \| `LOW_RESERVE` \| `'NOT_EVALUABLE'` | `DERIVED_NEVER_MISSING` | **true** |

```
RBM = 已答負擔總和 ÷ 已答題數
RRS = 25 × (4 − RBM)
band: rbm < 1.0 → HIGH_RESERVE | rbm < 2.0 → MODERATE_RESERVE | else LOW_RESERVE
```

🔴 **INV-RRS-1** —— 只維護這一份權威判定。禁止由 RRS 反推、禁止用四捨五入後的 RBM、禁止雙分界表。
🔴 `L4_RRS_MISSING_ITEM_IDS` 為**必要**欄位 —— 人工複核須知道少的是哪幾題。
🔴 **`L4_BTRI_SUM_ANSWERED` 不列為持久化核心欄位**（裁決 §④）——
可由 `RBM × answered_count` 重建；`EXCLUDED_FROM_DECISION_ENGINE` / `NOT_PERSISTED_AS_SSOT`。

### 4.4 藥物／物質（不進 RBM）

| field_id | valid_range | missing_policy |
|---|---|---|
| `L4_SUBSTANCE_OR_MEDICATION_CHANGE` | 10 值 enum（見 QB §2.5） | `OPTIONAL_NO_EFFECT` |
| `L4_CHANGE_CLINICAL_IMPACT` | `NONE`\|`MILD`\|`MODERATE`\|`SIGNIFICANT`\|`NOT_ANSWERED` | `OPTIONAL_NO_EFFECT` |

🚫 不進 RBM／RRS · 不改 `answered_count` · 不出現在 `missing_item_ids`。

### 4.5 Clearance

| field_id | type | valid_range |
|---|---|---|
| `TRAINING_ELIGIBILITY` | derived | `PROHIBITED` \| `REVIEW_REQUIRED` \| `CONDITIONAL` \| `POTENTIALLY_ELIGIBLE` |
| `CLEARANCE_STATUS` | derived | `AUTO_CLEARANCE_GRANTED` \| `AUTO_CLEARANCE_WITHHELD` \| `TRAINING_PROHIBITED` |
| `CLEARANCE_REASON_CODES` | string[] | 見 QB §2.6（可疊加） |

🚫 **不得**再輸出泛用 `CLINICAL_FLAG_UNRESOLVED`（可暫留為上層分類，但下游與 UI 必須讀細項）。
🔴 `AUTO_CLEARANCE_WITHHELD` **不得**顯示為系統故障，**不得**詮釋為絕對禁止訓練。

---

## 5. Layer 2 — Clinical Flags

### 5.1 評估狀態與稽核（與個別 flag 值分離）

**權限（Gemini 裁決 2026-07-27）：** 不強制醫師層級數位簽章；
受完整 BCF 訓練之資深物理治療師或臨床專員可於 UI 變更狀態。
每次變更**必須**寫入 `L2_ASSESSMENT_VERSION` 與 `L2_ASSESSED_BY`。

> 🔴 **稽核軌跡缺口（Claude 提報，待裁決）：**
> `L2_ASSESSED_BY` 與 `L2_ASSESSMENT_VERSION` 是**可覆寫的單值欄位** ——
> 它們只留得住**最後一次**變更者，不是軌跡。
> 「保留稽核軌跡」需要 **append-only 變更紀錄**（who / when / from / to / flag_id），
> 否則「某人把 STROKE 從 PRESENT 改成 ABSENT」這件事在下一次變更後就消失了。
> 依 White Paper §4.4 快照凍結與 §4.2 破壞性刪除禁令，建議新增
> `l2_flag_change_log[]`（append-only，不可修改、不可刪除）。

| field_id | type | valid_range | missing_policy |
|---|---|---|---|
| `L2_ASSESSMENT_STATUS` | enum | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `REVIEW_REQUIRED` | `ESCALATE_ON_MISSING` |
| `L2_ASSESSMENT_VERSION` | string | semver-like | `ESCALATE_ON_MISSING` |
| `L2_ASSESSED_AT` | datetime | ISO-8601 UTC | `ESCALATE_ON_MISSING` |
| `L2_ASSESSED_BY` | string | clinician id | `ESCALATE_ON_MISSING` |

> 🔴 **必須獨立於個別 flag 值** —— 否則無法區分「評估尚未開始」與
> 「評估完成，但所有 flag 均為 INACTIVE／RESOLVED」。
> **自動 clearance 最低條件：`L2_ASSESSMENT_STATUS = COMPLETED`。**

### 5.2 六態模型（ChatGPT 架構裁決 + Gemini 臨床核准 2026-07-27）

| 狀態 | 定義 | Auto-clearance | Modifier |
|---|---|---|---|
| **`ABSENT`** | **已完成評估，確認目前及既往均無此狀況** | **不阻塞** | **不啟動** |
| `PRESENT` | 目前存在或具臨床活動性 | 進 modifier／review | 啟動 |
| `INACTIVE` | **已知病史存在**，但目前無活動性表現 | 原則上不直接阻塞 | 降級啟動 |
| `RESOLVED` | 過去存在，目前已確認解除 | 原則上不阻塞 | active 解除，歷史保留 |
| `UNKNOWN` | 已評估，但現有證據不足以確認 | 🔴 保守阻塞（待逐 flag `unknown_behavior`） | 待定義 |
| `NOT_ANSWERED` | 欄位未完成（流程／資料品質缺口） | 🔴 阻塞 | 資料品質缺口 |

🔴 **`ABSENT` ≠ `INACTIVE` ≠ `RESOLVED`** —— `ABSENT` 是「沒有這個病史」，
`INACTIVE` 是「有病史但目前不活躍」，`RESOLVED` 是「曾經存在現已解除」。三者不可混用。
🔴 `UNKNOWN` 與 `NOT_ANSWERED` **決策上皆保守，但不得合併** —— 前者是臨床資訊，後者是流程缺口。

**新增不變量：**
| ID | 規則 |
|---|---|
| `INV-L2-2` | 完成的 Clinical Flag 評估必須為每個必填 flag 提供合法的非缺失狀態，無病史者填 `ABSENT` |
| `INV-L2-3` | 🔴 `ABSENT` **絕不得**由缺資料、`UNKNOWN` 或無紀錄自動推導。必須來自明確的評估行為 |
| `AT-L2-1` | 必須存在至少一組臨床上真實的 Layer 2 賦值可達 `AUTO_CLEARANCE_GRANTED` |
| `AT-L2-2` | 每個必填 flag 都必須有「對從未罹病者為真且不阻塞」的狀態 |

任一驗收失敗 → `SCHEMA_STATE_SPACE_DEADLOCK`，**不得 freeze**。

### 5.3 `allowed_status[]` 🟢 六態版，雙邊核准 2026-07-27

| flag_id | allowed_status |
|---|---|
| `BPPV` | **ABSENT** · PRESENT · INACTIVE · UNKNOWN · NOT_ANSWERED |
| `VESTIBULAR_MIGRAINE` | **ABSENT** · PRESENT · INACTIVE · UNKNOWN · NOT_ANSWERED |
| `STROKE` | **ABSENT** · PRESENT · UNKNOWN · NOT_ANSWERED |
| `PARKINSON_DISEASE` | **ABSENT** · PRESENT · UNKNOWN · NOT_ANSWERED |
| `PPPD` | **ABSENT** · PRESENT · INACTIVE · RESOLVED · UNKNOWN · NOT_ANSWERED |
| `DIABETES` | **ABSENT** · PRESENT · INACTIVE · UNKNOWN · NOT_ANSWERED |
| `PERIPHERAL_NEUROPATHY` | **ABSENT** · PRESENT · INACTIVE · RESOLVED · UNKNOWN · NOT_ANSWERED |
| `CERVICAL_SURGERY` | **ABSENT** · PRESENT · NOT_ANSWERED |

🔴 **每 flag 需六項規格，目前只完成 `allowed_status[]`。仍缺五項：**
`absent_definition`（新增為必要）· `inactive_definition` · `resolved_definition` ·
`modifier_behavior` · `review_requirement` · `unknown_behavior`
（`unknown_behavior` 需含 `clearance_effect` / `review_level` / `required_action`）

**→ Clinical Flag matrix 治理狀態：🟡 `REOPENED`。此為 freeze 未達成的兩項之一。**

⚠️ **`PRESENT` 一律阻塞為過渡** —— Phase 6 須由 `Clinical Flag Modifier Resolver` 輸出
`allowed_modes[]` / `restricted_modes[]` / `required_precautions[]` / `review_level`。

---

## 6. Layer 2 — 稽核契約（Audit Contract）🔴 DRAFT

### 6.1 Snapshot Metadata ≠ Audit Trail

**`L2_ASSESSMENT_VERSION` / `L2_ASSESSED_AT` / `L2_ASSESSED_BY` 的正式定位：**

```
Current Snapshot Metadata
```

它們回答：目前這份評估是哪個版本？最後一次由誰、何時確認？

**它們回答不了：** 誰曾經修改 `STROKE`？從什麼狀態改成什麼？何時？理由是什麼？是否經 override？

→ 這三個欄位**只留得住最後一次**。歷史稽核需要獨立的 append-only 記錄。

### 6.2 `l2_flag_change_log` — Append-only Audit Log

⚠️ **本文件中以 `l2_flag_change_log[]` 表示者為 `Logical model only`。**
**Production 儲存偏好獨立 collection：`bcf_l2_flag_change_log`。**

理由（架構裁決 §⑤）：
1. 病人主紀錄不應隨修改次數無限膨脹
2. Audit entry 必須能獨立索引與查詢
3. Append-only server guard 較容易實作
4. 可限制一般 UI 只能讀，不能覆寫
5. 可分離 assessment snapshot 與 history event 的責任

### 6.3 Audit Entry Schema

```yaml
event_id:             "opaque UUID"                    # 必填
patient_id:           "opaque patient id"              # 必填
assessment_id:        "Layer 2 assessment id"          # 必填
flag_id:              "STROKE"                         # 必填
from_status:          "PRESENT"                        # 必填
to_status:            "ABSENT"                         # 必填
changed_at:           "server-generated UTC datetime"  # 必填
changed_by:           "authenticated user id"          # 必填
changed_by_role:      "clinician role snapshot"        # 必填
change_reason_code:   "CLINICAL_REASSESSMENT"          # 必填
source:               "CLINICIAN_UI | MIGRATION | SYSTEM_CORRECTION"   # 必填
assessment_version:   "version active at change"       # 必填
change_note:          "optional bounded text"          # 選填
request_id:           "server request trace id"        # 選填
reviewed_by:          null      # OPTIONAL_PENDING_GOVERNANCE
reviewed_at:          null      # OPTIONAL_PENDING_GOVERNANCE
review_status:        null      # OPTIONAL_PENDING_GOVERNANCE
```

**`change_reason_code` 值域：**
`INITIAL_ASSESSMENT` · `CLINICAL_REASSESSMENT` · `NEW_DOCUMENTATION` ·
`PATIENT_CORRECTION` · `DATA_ENTRY_CORRECTION` · `STATUS_RESOLUTION` ·
`STATUS_REACTIVATION` · `AUTHORIZED_OVERRIDE` · `MIGRATION`

🔴 **自由文字只能補充，不能取代 reason code。**

> **與 Gemini 核准欄位的對照**（Gemini 要求六欄，架構 schema 為其超集）：
> `timestamp → changed_at` · `clinician_id → changed_by` · `flag_id → flag_id` ·
> `old_value → from_status` · `new_value → to_status` · `assessment_version → assessment_version`
> 六項全數涵蓋，欄位名以架構 schema 為準。

### 6.4 不變量

| ID | 規則 |
|---|---|
| `INV-L2-AUDIT-1` | 每一次 Clinical Flag 狀態轉換，必須產生**恰好一筆** append-only audit event |
| `INV-L2-AUDIT-2` | Audit event **絕不得**經由一般應用流程被修改或刪除 |
| `INV-L2-AUDIT-3` | 目前 snapshot 必須能由有序 audit history 重建，或明確標記為 legacy pre-audit snapshot |
| `INV-L2-AUDIT-4` | 轉換為 `ABSENT` 必須記錄**已認證的行為者**與 **reason code**。`ABSENT` 絕不得由預設值或 migration 推論靜默產生 |
| `INV-L2-AUDIT-5` | 🔴 **state update 與 audit append 必須同成功或同失敗（原子性）** |

> 🔴 **INV-L2-AUDIT-5 最容易被默默犧牲。** 禁止：
> 「flag 更新成功但 audit 寫入失敗」（風險被降低卻無紀錄）
> 「audit 寫入成功但 snapshot 沒更新」（紀錄與現況不符）
> Production 須使用 transaction，或可證明等價的原子寫入策略。
>
> ⚠️ **此不變量無法由 client-side 原型證明** —— 它是儲存層性質。
> 實作時必須有一個「注入 audit 寫入失敗，驗證 flag 未被更新」的測試。**列為實作驗收條件。**

### 6.5 `ABSENT` 轉換的高稽核強度

`ABSENT` 是唯一明確表示「已評估，確認沒有此病史」且通常**不阻塞** auto-clearance 的狀態。
因此以下轉換具高度治理意義：

```
PRESENT      → ABSENT
UNKNOWN      → ABSENT
NOT_ANSWERED → ABSENT
```

**`PRESENT → ABSENT` 不得視為一般欄位修改。** 它可能代表先前誤登、診斷被推翻、
資料歸屬錯誤，**或不當降低風險**。

正式規則：
```
PRESENT → ABSENT
  requires change_reason_code
  requires authenticated actor
  requires non-empty structured justification
  requires append-only event
```

第二人覆核**暫不強制**，但保留 `reviewed_by` / `reviewed_at` / `review_status`，
標記 `OPTIONAL_PENDING_GOVERNANCE`。待 Gemini／PM 裁決。

### 6.6 Initial Assessment 也必須有 audit event

第一次建立 Layer 2 時，**每個 required flag** 都須產生：

```yaml
from_status:        "UNINITIALIZED"
to_status:          "ABSENT | PRESENT | INACTIVE | RESOLVED | UNKNOWN | NOT_ANSWERED"
change_reason_code: "INITIAL_ASSESSMENT"
```

🔴 **`UNINITIALIZED` 只允許出現在 audit event 的 `from_status`，
不得成為 Clinical Flag 可儲存的當前狀態。**

如此才回答得了「某 flag 最初由誰評估？初始判斷是什麼？」

### 6.7 Legacy 資料

既有記錄在 audit 上線前沒有完整歷史。🚫 **不得偽造歷史事件。**

建立一筆 migration baseline：
```yaml
from_status:        "LEGACY_UNKNOWN"
to_status:          "<current snapshot value>"
source:             "MIGRATION"
change_reason_code: "MIGRATION"
changed_by:         "SYSTEM_MIGRATION"
```
並標記 `history_completeness = PARTIAL_PRE_AUDIT`。

🚫 **禁止把 migration time 當作原始臨床評估時間。**

### 6.8 Authorization ≠ Auditability

Gemini 核准受訓資深物理治療師／臨床專員可變更 flag。架構接受此權限方向，但：

> **有權修改不代表可以不留歷史。**

```
每次變更皆記錄 authenticated user id
每次變更皆記錄 role snapshot
每次變更皆記錄 server timestamp
```

🔴 **`changed_by` 必須由伺服器認證 context 取得，不得由 UI 自由填寫。**
（同 White Paper §4.5 三層責任模型：client 傳入值不是 guard。）

### 6.9 Clinical Flag Semantic Contract（原「六欄」正式更名）

每個 flag 的完整規格：

```yaml
flag_id:
display_name:
allowed_status:          # ✅ 已完成
absent_definition:       # 🔴 待 Gemini
inactive_definition:     # 🔴 待 Gemini（不適用須填 NOT_APPLICABLE）
resolved_definition:     # 🔴 待 Gemini（不適用須填 NOT_APPLICABLE）
present_behavior:        # 🔴 待 Gemini
unknown_behavior:        # 🔴 待 Gemini（含 clearance_effect / review_level / required_action）
modifier_behavior:       # 🔴 待 Gemini
review_requirement:      # 🔴 待 Gemini
evidence_requirement:    # 🔴 待 Gemini
audit_sensitivity:       # 🔴 待 Gemini
version:
```

🔴 **`inactive_definition` / `resolved_definition` 若不適用，必須明確填 `NOT_APPLICABLE`，不得留白** ——
否則無法區分「不適用」與「尚未完成」。

**8 個 required flag × 13 項，目前完成 3 項（flag_id / display_name / allowed_status）。**

---

## 7. Layer 3 / Layer 6（未受本輪影響）

### 6.0 `L3_ITEM_CLASS`（PM 裁決 2026-07-27，三分類）

| 值 | Core-24 | localization | 用途 | 成員 |
|---|---|---|---|---|
| `LOCALIZING` | ✓ | ✓ | 腦區定位 | 有 ≥1 解剖 PRIMARY 的 36 題 |
| `NON_LOCALIZING_PHENOTYPE` | ✓ | ✗ | 神經表現型（評估入口） | OCM-04 複視 / OCM-08 畏光 / COG-08 用腦後加重 / BSA-08 打鼾呼吸中止 |
| `IMPACT` | ✗ | ✗ | 功能衝擊追蹤 | DAILY_FUNCTION 八題 → BCF Impact/Severity 子量表 |

> **宣告制（PM 裁決 2026-07-27，升格）：** `item_class` 為題庫**直接宣告的必填 metadata**，不再由「是否有 PRIMARY / 是否 DFN」反推。
> Knowledge Graph 反過來**驗證**宣告（`INV-CLASS-1`）：declared `LOCALIZING` ⟺ ≥1 解剖 PRIMARY。
> 來源：`BCF_L3_item_class_registry.json`（seed 48 題已驗證一致）。
> **Core-24 定位 = Localization + Neural Phenotype**（不是 Localization only）。
> ⚠️ 「DFN=IMPACT」為現行等價規則；未來若出現會定位的 DFN 題或非 DFN 的純 impact 題，須重審。

**L3：** 48 題 × `int 0-4`，`missing_policy = NOT_EVALUABLE_EXCLUDE_FROM_DENOMINATOR`，`provisional: true`（Core-24 未定）。
domain 分數採**平均**（同 RBM 理由）；各 domain **獨立**判定可評估性（門檻 ≥5/8，PROVISIONAL）。
`L3_SEVERITY_INDEX` / `L3_LOCALIZATION_CANDIDATES` 維持 `PENDING_PHASE_4`。

🔴 側化鐵律：OD/OS 不側化 · 中腦與皮質同側、小腦對側 · OPN 中線不側化 ·
WP §3.1.3 雙候選禁硬指 · CBL-03 單題不得產生側化輸出。

**L6：** `L6_REC_*`（Recovery Outcome）與 `L6_RETENTION_*` **必須分開儲存**（Principle 4）。
`L6_SIDE_EFFECT_SEVERITY` = `ESCALATE_ON_MISSING`。
`L6_SATISFACTION` → `ai_usage: SERVICE_EXPERIENCE_METRIC / EXCLUDED_FROM_CLINICAL_INDEX`。
`AVI` 需 ≥2 visits，否則 `AVI_NOT_EVALUABLE`。

**跨層命名（BCDM v1.1）：**
`BCF-NPI` = Neural Phenotype Inventory（問卷）· `NPR` = Neuroplasticity Rating（指標，原 NPI）
`L4_TRR` = Training Recovery Readiness · `L6_REC` = Recovery Outcome
🚫 不得再以裸字串 `NPI` 混用。🚫 滿意度不得稱為 `NPS`。

---

## 8. Layer 7 — Learning and Inference Layer

**Owner:** System / AI（唯一非 patient/clinician/device 擁有的層）

**獨立命名空間** —— 不得使用與 L1–L6 相同的 field ID：
```
ai_inference.*        prediction / pattern
ai_confidence.*       confidence / feature_importance
ai_recommendation.*   recommendation
ai_decision_trace.*   decision trace / model_version
```

**允許：** `Layer 1–6 → Layer 7`
**禁止：** `Layer 7 → 覆蓋 L1–6 原始欄位` · `偽裝成 patient-reported fact` · `偽裝成 objective measurement`

> 🔴 **INV-5 的理由：** AI 預測若寫回 L3，下次會被當成病人自陳的事實讀出來，
> 模型用自己的輸出訓練自己 —— confidence 上升，但沒有任何新資訊進來。
> 這是 White Paper §4.1「虛高%」的機器學習版本：**分母沒變，分子自己長大。**

**驗收（正式納入架構驗收）：** 刪除或停用整個 Layer 7 後 ——
L1–L6 臨床資料仍完整 · 歷史紀錄仍可讀 · 安全判斷不失效 · 客觀測試不失去原始值。

---

## 9. Freeze Admission Criteria

### 8.1 ✅ 原 BLOCKER 已解除

第六態 `ABSENT` 經雙邊核准納入。AT-L2-1／AT-L2-2 驗收通過（原型 v0.5，91/91）。

### 8.2 🔴 Freeze Admission Criteria（架構裁決 §⑬ 最終版）

| # | 條件 | 狀態 |
|---|---|---|
| 1 | `ABSENT` 已正式納入 | ✅ |
| 2 | AT-L2-1 auto-clearance 可達性通過 | ✅ |
| 3 | AT-L2-2 每 flag truthful non-blocking state 通過 | ✅ |
| 4 | 所有 required flag 的 Semantic Contract 完成 | 🔴 |
| 5 | `PRESENT`／`UNKNOWN` 的 modifier 與 review 行為完成 | 🔴 |
| 6 | Layer 2 append-only audit schema 核准 | 🔴 |
| 7 | Audit 原子性與不可修改契約寫入 Data Dictionary | 🟡 已撰寫（§6），待核准 |
| 8 | Gemini 臨床審完成 | 🟡 |
| 9 | PM 最終核准 | 🟡 |
| 10 | QB／DD／BCDM／Knowledge Graph 交叉一致 | 🟡 |

**→ `FREEZE_CANDIDATE = NO`。10 項中 4–6 明確未完成。**

Freeze 通過後仍**不等於** production authorization。

### 8.3 其他過渡項

- `PRESENT` 一律阻塞 = `PROVISIONAL_CONSERVATIVE_BEHAVIOR`，Phase 6 由 Modifier Resolver 差異化
- `UNKNOWN` 統一保守阻塞，最終由逐 flag `unknown_behavior` 決定
- 稽核軌跡需 append-only 變更紀錄（§5.1）

---

## 10. 實作前硬性前置

```
🔴 §9.3   BCDM 核准前不得開始 production 實作
🔴 §4.6   Recon-First —— 涉及身份關聯／同步契約／臨床判定，必須先唯讀 recon
🔴 GATE-2 bcf_readiness 獨立 collection，原生 patient-ownership
🔴 §7.1   BLOCKER 未解前不得進 production
```

**尚未執行的 recon（實作前必做）：**
1. `server.js` 的 BTracks patient-ownership 實碼（GATE-2 要沿用）
2. `assessments` collection schema 與 `strict:false` 行為
3. `genId()` 現況（7/25 稱 `41d873a` 已改 UUID，本 session 未 grep）
4. `TOTAL_PCT_MILD/MODERATE` placeholder 實際措辭
5. WP Open Items「§3 雙候選 / mechanismModel enum 未實作」是否仍成立

> 🔴 7/25 §九：「引用實碼須 grep 原文，禁止從記憶／他人摘要重建。」
> **本文件所有關於現行程式行為的敘述都來自文件，非 grep。實作前必須實碼驗證。**
