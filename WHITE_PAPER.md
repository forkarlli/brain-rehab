# BCF White Paper
Version: 1.6
Date: 2026-07-12
Status: SSOT
Governance: ChatGPT架構審 ✔ / Gemini獨立審 ✔ / PM(Karl)核准 ✔
Authoring: Claude(策略/文件)

---

## §1 BPPV 診斷矩陣

### §1.1 PC（後半規管，Dix-Hallpike）
- Canalithiasis：潛伏 5–20s／持續 <60s／疲勞性；
  Up-beating + 同側扭轉；坐起反向。
- Cupulolithiasis：無潛伏／持續 >60s／低疲勞；
  持續 Up-beating + 同側扭轉。

### §1.2 HC（水平半規管，Supine Roll）
- Geotropic（管結石）：強側 = 患側（向壺腹興奮）
- Apogeotropic（嵴頂結石）：弱側 = 患側（離壺腹抑制）

### §1.3 強制紅旗
- 持續 Down-beating + 扭轉 → 疑中線小腦(Nodulus/Uvula)
  或低位腦幹 → 強制暫停耳石復位處方
- Light Cupula / Pseudo-BPPV：無潛伏、無疲勞、有 Null Point
  → 觸發中樞警示

---

## §2 OTR（Ocular Tilt Reaction）矩陣

### §2.1 側化鐵律（graviceptive 於 Pons 交叉）
- 交叉以下（Utricle/前庭神經/延髓前庭核）→ 同側 OTR
- 交叉以上（MLF/INC/中腦）→ 對側 OTR

### §2.2 Left OTR Triad
- Skew：左眼低、右眼高
- Head Tilt：左傾
- Torsion：上極向左（左眼內旋、右眼外旋）

### §2.3 中樞 vs 周邊 鑑別
- 伴複視／吞嚥困難 → 傾向中樞
- 純 Skew 無 Head Tilt → 多為中樞

---

## §3 小腦側化

[權威] §3.2 為唯一側化來源，且為「雙候選」結構。
§3.1 僅機制說明，禁止單獨用於側化。

### §3.1.1 OMV/Purkinje dysfunction
單側 OMV Purkinje 輸出↓ → 同側 cFN 去抑制/時序異常。
臨床表型「高度關聯於(strongly associated with)」
同側掃視欠距(Ipsiversive Hypometria)。
※ 不寫成線性公式（Gemini 措辭裁定；Takagi/Zee 1998）。

### §3.1.2 Fastigial output lesion
單側 cFN/FOR 輸出受損 → Ipsipulsion：
同側 Hypermetria + 對側 Hypometria。
（Robinson/Straube 1993 muscimol）

### §3.1.3 BCF operational limitation
單一 dysmetria 無法區分 lesion level。
證據不足 → 輸出 primary+alternative 雙候選，
或降級 UNSPECIFIED_CEREBELLAR_DYSMETRIA。禁硬指。

### §3.2 方向性對映（權威，雙候選）
- Right Hypermetria → ↓R Fastigial 或 ↓L Purkinje
- Right Hypometria  → ↓L Fastigial 或 ↓R Purkinje
（左向鏡像）

mechanismModel 列舉：
- OMV_PURKINJE_DYSFUNCTION
- FASTIGIAL_OUTPUT_DYSFUNCTION
- UNSPECIFIED_CEREBELLAR_DYSMETRIA

---

## §4 資料與呈現治理通則

### §4.1 SEMANTIC GOVERNANCE：不可評估 ≠ 0% ≠ 100%
任何一致性、交叉驗證或自我一致性指標，在可比較觀察數
低於最低門檻（跨模組 ≥2）時，必須回傳 NOT_EVALUABLE／N/A，
**不得以 0% 或 100% 代替。**
適用：CVAL(虛高)、computeConsistency(虛低)、未來 CLSCI
及所有跨模組指標。

### §4.2 破壞性刪除禁令
**任何未被明確點名的紀錄，不得因為缺席於一次同步請求而被刪除。**
- 同步端點(POST)僅允許 upsert，不得以缺席推導刪除意圖
- 刪除必須是明確命令(DELETE /:id)
- Client snapshot 無「已完整載入伺服器權威資料」保證，
  server 不得信任其完整性宣告
- Server 修復必須能保護尚未更新快取的舊 client

### §4.3 ID 為 opaque string
不得以 ID 字串格式(長度／前綴／regex)推斷紀錄類型或新舊 provenance。
判斷新舊須依顯式欄位(如 idVersion、consistencyStatus 是否存在)。

### §4.4 快照凍結
歷史紀錄為當時快照。不得以「現在重算」改寫歷史顯示值。
（v1.6 據此駁回 computeConsistency 歷史重算方案 H4）

---

## Changelog
- v1.0 (2026-07-10) SSOT 首次落地
  [NEW]    §1 BPPV 矩陣 + 強制紅旗
  [NEW]    §2 OTR 矩陣 + 中樞/周邊鑑別
  [NEW]    §3 小腦側化雙模型（3.1.1/.2/.3 + 3.2 雙候選）
  [ADOPT]  phenotype-first + lesion-level 雙模型
  [REJECT] 全系統單一「過早煞車模型」（原提案已撤回）
  [PURGE]  偽造引用「國立衛生研究院公共醫學中心」
- v1.1 (2026-07-10) P0 alias normalization 落地
  [FIX] 雙側齒狀核(dentate) 從 Fastigial alias 移除，
        自成 Bilateral Dentate Nucleus canonical
        （實測 normalize 確認不再誤映 Fastigial，4/4 通過）
  [ADD] Fastigial alias 補齊：Fastigial / Fastigial Nucleus /
        cFN / Fastigial Oculomotor Region
        （app.js 另含 FOR；server.js 刻意省 FOR — 該表為
        case-sensitive substring 掃描，全大寫 FOR 會誤命中）
  commits: 5a693fc[app.js] / ae57d37[server.js]
  deployed: /api/version = ae57d37 ✔
- v1.2 (2026-07-10) P0-C CLOSED as no-op + FP contract
  [NO-OP] P0-C 標記 ARCHITECTURALLY INAPPLICABLE
    原因：BILATERAL_REGIONS.has() 對 fastigial 是 dead code
    （真正放行的是 !REGION_SIDE_TYPE[r]）；且 fastigial
    結構上不進 legacy form pipeline 的 affectedBrainRegions
  [CONTRACT] 新增 FP-1/2/3 邊界契約：
    FP-1 fastigial candidates（R/L/Bilateral/unspecified）
      在 FORM_PIPELINE 整合前不得 merge 進 legacy form
      pipeline 的 affectedBrainRegions
    FP-2 intrusion/saccade 產生的 fastigial 候選只可進
      analysis result / diagnostic DTO / narrative /
      經核准的 EyeRx resolver；不得自動進 legacy 三函式
    FP-3 若未來 fastigial 即將 merge 進 legacy form
      pipeline → HARD STOP，須先完成 structured schema
      接入 + side-aware resolver + 單側 Rx validation +
      R1 regression + PM 核准
  [TEST] contract test 固化（commit b5551bd）：
    T-FP-A REGION_SIDE_TYPE 禁含 fastigial（static assertion，
      未來若有人加入→測試失敗提示須先做 pipeline 整合）
    T-FP-B fastigial 不進 legacy affectedBrainRegions
      （source-contract 掃描，非 DOM 執行；mutation 驗證非 vacuous）
    app.js 架構註解（commit c5e1776）：REGION_SIDE_TYPE 定義處
  [FIX-DOC] P0-C recon 更正：saveBCFAssessment 為獨立
    top-level async 函式（非早前描述的 nested closure）；
    substantive finding（fastigial 到不了）不變
- v1.3 (2026-07-10) P0-D/E 收尾 + open items
  [CLOSED] P0-D1 bilateral fastigial EyeRx 既有行為
    （Bilateral Fastigial Nucleus → ['Right CB','Left CB']）
    baseline v2 S5/S7 覆蓋、--compare 8/8 驗證
  [CLOSED] P0-E Rx literal 相容：已被 P0-A baseline 吸收，
    5 個 fastigial 字面值（intrusion 指標 brain/note、
    M7 addRx、vertical domain bucket）全在 S1/S2/S3/S5/S6/S7
    覆蓋內、無 gap、無死碼污染。不需寫 code。
  [DEFER] P0-D2 unilateral → open item（見下）
  [SAFETY] 單側 fastigial 維持 RX_MAPPING_PENDING_LATERAL_
    VALIDATION，禁自動生單側 Rx（顯示層有候選≠處方層授權）
  [FIX-DOC] P0-C site 2（BILATERAL_REGIONS.has() @舊5128）
    位於 5021 死碼內、runtime 不可達；P0-C no-op 結論更強化
- v1.4 (2026-07-11) 壞按鈕 hotfix + F2 降級 open item
  [HOTFIX] 壞按鈕「產生整合處方」已移除並部署
    （commit 576c2ca，/api/version 確認、production app.js
    實體驗證按鈕 0 命中）。該按鈕 100% 靜默失敗(TypeError，
    重複宣告覆蓋)、底層功能(EEG/一致性%/side-aware 訓練過濾)
    在 generateBCFResults 正常顯示，移除零臨床損失。
  [DECISION] PM 選路 B：止血優先，F2 完整合併視圖復活降為
    需求驅動 open item（死碼期間無臨床反映、急迫性低）。
- v1.5 (2026-07-11) CVAL 虛高% 止血 + 語義重定義
  [HOTFIX] computeCrossValidation 虛高% 已止血並部署
    （commit 9a17eea，/api/version 確認、production 舊
    pill「N/M 項一致(XX%)」0 命中）。renderCrossValidation
    Section 改中性文字「原計算在資料不完整時可能高估」，
    computeCrossValidation 計算留背景不動（純顯示層）。
  [SEMANTIC] Gemini 裁定：此指標本質為「邏輯矛盾檢查器」
    （只在邏輯崩潰報錯、平時安靜的 QC），非統計交叉驗證。
    · side 保留（同功能區左右矛盾=邏輯互斥）
    · severity 移出跨區（跨區不同嚴重度是正常；僅同區
      時序追蹤有意義）
    · type 移除（生理結構屬性，非邏輯一致性）
  [BUG] 原 bug：分母固定=3、缺維度當一致累加、資料不足
    虛高%、缺值納入一致率。
    · 甲（pairwise 跨系統驗證）裁定不存在此機制
    · 丙（真跨系統驗證）= Phase 2 新功能
- v1.6 (2026-07-12) computeConsistency 虛低% 止血 + patients 刪除路徑止血

  ### A1 — computeConsistency 不可評估虛低% (CLINICAL-SAFETY HOTFIX)
  [BUG] computeConsistency(app.js:8687) 算出 latStatus='insufficient'
    (sides.length<2) 後丟棄該狀態，只送 pct=0 → 「模組不足(不可評估)」
    與「模組充足但真矛盾」畫面皆顯示紅色 0%，臨床端無法區分 → 假警報。
  [CLARIFY] 與 CVAL 為「同一治理病灶的反向表現」，非同一計算實作 bug：
    · CVAL        = 固定分母 → 虛高% → 假安心 (v1.5 已止血)
    · Consistency = 無固定分母，但不可評估仍吐 0% → 虛低% → 假警報
  [NOT-FOUND] 排除 CVAL 型 bug：三層分母皆動態、null 正確排除、
    無 ||100 fallback、與 computeCrossValidation 不共用 helper。
  [HOTFIX] 方案 H3（commits 20ba250 / bfb0e00 / b97f414）
    · 存檔補 additive 欄位 consistencyStatus / consistencyModules
    · 4 處 patient-facing 依 status 分流（renderZone5 / renderRxHistoryView
      / showIntegratedPrescriptionDetail / renderPrescriptions）
    · 舊記錄(無欄位) → 「無法回溯驗證」，不印%
    · insufficient  → 「不可評估（僅 N 個可比較模組，至少需要 2 個）」
    · 2 模組 → provisional：不套綠 + 強制揭露模組名（Gemini G4）
    · 3 模組 → 原色階；真實 0% 維持紅色 —— 真警報保留
  [GATE] H3_GATE_COUNT_SOURCE_VERIFIED → GATE_COUNT_MISMATCH
    effectiveModuleCount(8858) = out && weakRegions.length>0（不檢查
    abnormalCount）；computeConsistency L1 = out && abnormalCount>0
    && weakRegions.length>0 → 母體不同。沿用前者當 gate 會在
    「abnormalCount=0 但 weakRegions 非空」放行 insufficient 分數。
    → gate 改用既有回傳鏈上的 consistencyLat.status，
      不新增 evaluableModuleCount（答案本就在回傳鏈上，只是沒人讀）。
  [REJECT] H4 歷史重算 —— 違反 §4.4 快照凍結
  [VERIFIED] PM production 人工驗收：
    · 1 模組(Li,Wen Chi) → 「不可評估（僅 1 個）」✔
    · 2 模組(Li,Karl)    → 59%（肌肉張力 + RightEye）中性色 ✔
    · 3 模組真矛盾(Dong) → 20%（3 模組）紅色 ✔ 真警報保留
    · 舊記錄 → 待補確認（低風險，保守失敗方向）

  ### X-ZERO-0A — patients 隱式差異刪除 (P0-EMERGENCY)
  [CRITICAL] POST /api/patients(server.js:269) 曾以傳入清單為完整
    權威集合，deleteMany 所有「未出現在清單中」的病人。
    唯一檢查為 Array.isArray()，無數量／比例／確認 guard。
    · 空陣列推演(確定性)：incomingIds=[] → toDelete=全部 → 刪光 collection
    · 觸發鏈：loadPatientsFromServer 的 catch 靜默 fallback 到 6 筆內建
      示範病人 → 使用者做一次正常寫入(新增／刪除／匯入) → 全量同步
      → 其餘真實病人全刪
    · 不需 ID 碰撞、不需惡意輸入。一次網路瞬斷 + 一次日常操作即可。
  [HOTFIX] deleteMany 已移除（commit 5ec1db1，/api/version 確認）
    · POST /api/patients 現為 UPSERT-ONLY，回傳帶 deletionDisabled: true
    · server 端防線，保護尚未更新快取的舊 client
  [REGRESSION-ACCEPTED] 「刪除病人」按鈕暫時靜默失效（本機刪除，
    下次同步復現）。治理原則：Temporary loss of delete capability
    is preferable to irreversible clinical data loss.
  [AUDIT] X-ZERO-0D Atlas 唯讀稽查（PM 執行）：
    · patients = 10 筆，全為真實病人，無 P001-P006 示範資料
    · →「退回示範資料」的災難跡象未發生
    · PATIENT_DATA_LOSS: NOT FOUND（無證據，但不等於確定未發生；
      100% 確認需比對 Atlas backup 歷史 count）
    · 副產物：assessments 內存有示範資料 A001-A006（繞過前端
      SAMPLE_ASSESSMENT_IDS 排除）；home_training_sessions 的
      patientId 為小寫 'p001' → 皆為 orphan，但屬示範/測試資料，
      非真實病人遺失。
  [CONCLUSION] 我們是在預防，不是善後。X-ZERO-0A 止血及時。

## Open Items（未解，實作前處理）
- [PARTIAL] Fastigial alias 已補齊(v1.1)；CAUDAL/單側
  fastigial canonical 命名 scheme 退 P1（bilateral≠caudal、
  白皮書需單側候選但現表僅 bilateral）由 ChatGPT 併 P1 設計
- [RESOLVED v1.1] 雙側齒狀核→fastigial 誤映 已修
- [CONFIRMED GAP] §3 雙候選/mechanismModel enum/CAUDAL_FASTIGIAL_NUCLEUS
  於 server.js 均未實作；現行 UNPAIRED 回 candidate:null 並轉
  saccade_diagnosis.json，undershoot 指向 FEF/BG/PPRF（非小腦）
  → 與 §3.2 不一致。（recon 2026-07-10 確認，見下方 Verification Log）
- [GATE] §1/§2 進實作前流程已過審；alias blocker 解除後才排
- [OPEN] FORM_PIPELINE_STRUCTURED_REGION_INTEGRATION
  = MAJOR ARCHITECTURE CHANGE。現存兩套 region 表示法
  （analysis 線結構化 vs form 線純字串）。整合須保留
  舊 assessment 可讀 / bilateral 行為 / side filtering /
  Rx 字面值 / save-load round-trip / 臨床輸出 parity。
  需 Gemini 獨立審。P0 後處理。
- [OPEN] SACCADE_UNILATERAL_FASTIGIAL_DECISION_INTEGRATION
  = MAJOR CLINICAL PIPELINE CHANGE。單側 fastigial 有資料
  （saccade_diagnosis.json → /api/analyze-saccade-direction
   → 顯示層），但決策層 resolveHorizontalOvershootDirection
   只讀 d.type/d.direction、丟棄 d.region，改查硬編碼
   HORIZONTAL_OVERSHOOT_MATRIX。接回=改患者處方輸出。
   實作前 5 必答：region authority / layer coexistence
   （Initiation FEF-BG-SC-PPRF vs Calibration OMV-Purkinje-
   Fastigial 並存）/ side semantics（movementDirection vs
   lesionSide vs eyeSide，eyeSide 禁參與）/ confidence gate
   / unilateral Rx mapping。需 Gemini 審。與 P1 mechanismModel
   + 單側 canonical 同審查包。
- [BUG] INTEGRATED_PRESCRIPTION_DUPLICATE_DECLARATION_AND_
  BUTTON_FIX（HIGH，另開獨立修復）。
  generateIntegratedPrescription 兩份 top-level 同名宣告
  （5021 零參 / 9535 三參），JS 後覆前，5021 不可達死碼；
  按鈕 5008 呼零參版→實際命中 9535→analysisResult undefined
  →TypeError。F1 先 recon 權威版（不直接刪死碼）→ F2 最小修復。
  不得混 fastigial commit。
- [NOTE] baseline v2 覆蓋界線：涵蓋 brainRegionMap→
  EYERX_ALIASES→computeEyeMachineRx；不含壞按鈕 click flow /
  5021 死碼 / unilateral decision integration。非完整 UI E2E。
- [OPEN] FORM_INTEGRATED_PRESCRIPTION_MERGED_VIEW
  = 合併去重表 + 彈窗列印匯出（5021 獨有、現失效）復活。
  治理等級 MEDIUM-RISK CLINICAL INTEGRATION VIEW RESTORATION。
  需求確認後才啟動：F2-E1(原封恢復死碼既有邏輯)→F2-C1(Gemini
  審 mergedRx 合併/去重/優先權 + angleBilateral 警示，見 G1-G4)
  →F2-E2(依審查調整)→PM 簽核→部署。
  · 5021 死碼 + generateIntegratedPrescription 重複宣告
    保留未清（無害：觸發按鈕已移除、9535 為唯一活版）。
    徹底清理併入本項。
  · F2-E1 草稿存 git stash@{0}（未核准，含未審 summary-render；
    重用前須經 F2-C1 Gemini 審）。
  · mergedRx 合併規則 / angleBilateral = NEEDS CLINICAL REVIEW
    （死碼期間未驗證）。
- [OPEN] ACTIVE_CLINICAL_RULESET_AUDIT
  = EEG 矩陣(BRAIN_REGION_RX) / computeCrossValidation 本身
  正確性審查。屬現行活碼品質審查、非復活項，不阻塞任何修復。
  Gemini C2 提醒檢驗點：cross-validation 缺失模組處理須為
  「分母動態減少」而非「假定滿分」（防虛高一致性分數）。
- [OPEN] CLSCI_CALCULATION_FIX(計算修正，Commit 2)
  side-exclusive 邏輯互斥 + 動態分母（邏輯互斥檢查對數）
  + 缺維度 not_evaluable 不進分母 + 可評估對數<門檻顯示
  N/A + truthy 陷阱處理（缺值混用 undefined/''/佔位）。
  走完整治理：ChatGPT 模型→Gemini G1/G2→Claude Code
  Truth Table→改計算→regression→重新啟用%。命名改
  CLSCI（舊 key 留 deprecated alias、全面 rename 另案）。
  [UPDATE] → 併入 computeConsistency 計算修正（回傳結構化
    {pct, status}）及 EFFECTIVE_MODULE_COUNT_WRONG_POPULATION。
    同一病灶不宜兩套修法。
- [OPEN] CLSCI_NEW_CHECKS(新功能，非 bug fix)
  區域完整性（如 FEF↔PPRF 對應）+ 時間自洽（同病灶跨測量
  不合理跳變偵測）。需讀歷史測量。
- [CLOSED] COMPUTECONSISTENCY_SAME_CLASS_BUG_RECON
  → 非 CVAL 同類（無固定分母）；確認虛低% 缺陷。A1 止血(H3) 已部署
    並驗收。計算修正併入 CLSCI_CALCULATION_FIX。
- [CLOSED] MONGO_LOCALSTORAGE_DUAL_TRACK_VERIFY
  → assessments 為「localStorage 快取 + Mongo 權威」正常架構，非雙軌。
- [RESEARCH] NEURO_METABOLIC_CONCORDANCE_MODEL
  神經代謝分層（ATP-CP vs 粒線體耐力）進 Research Layer/
  Whitepaper Concept。不進 DTO/診斷/生產。科學仍假說
  （RightEye 差≠粒線體失能，只證神經無法持續輸出），
  待病例驗證再評估升級。ChatGPT C/D 段證據謹慎：用
  Neural Endurance Deficit（可證明）非 Mitochondrial
  Failure（推論）。
- [P0] XZERO_0B_EXPLICIT_DELETE_ENDPOINT
  新增 DELETE /api/patients/:id。最低防護：ID 存在／病人存在／
  明確回傳狀態／audit log／禁一次刪多筆。
  不得 cascade delete（病人主檔 soft delete，臨床資料保留）
  —— 否則第二個資料災難來自 cascade。
- [P0] XZERO_0C_FRONTEND_FAIL_LOUD
  loadPatientsFromServer 的靜默 catch 須改 fail-loud。引入
  patientSyncState (LOADING/READY/FAILED/STALE_LOCAL)，僅 READY
  允許病人寫入。示範資料不得作 production 網路失敗 fallback。
  同時停用「刪除病人」按鈕（app.js，另 commit）。
- [P1] XZERO_A_GENID_UUID
  genId(prefix)=prefix+Date.now().slice(-6)：ID 空間 10⁶，每 16.67
  分鐘循環。同 prefix 跨病人/跨裝置碰撞 → server _id upsert →
  靜默覆蓋。全站共用(A/MTT/RE/BCF/IP/RX)。
  裁決：改用完整 crypto.randomUUID()（不截斷）；舊 ID 不重寫；
  新增 idVersion: 2。
  recon: BREAKING_CHANGE_RISK LOW（無 slice/regex/排序/DOM 依賴；
  _id schema 為 String 無格式驗證）。
  引用鏈（新舊必須共存，禁改寫）：
  bcf_diagnoses.sourceAssessmentIds / therapy_sessions.linkedAssessmentId
  / patient_reports.assessmentId / patient_reports.parentReportId
- [P1] XZERO_B_SERVER_COLLISION_GUARD
  server 須拒絕跨紀錄覆蓋：_id 已存在但 patientId/type 不同 → 409，
  不 $set，寫 collision log。單筆與 bulk 皆須保護。
  注意：type 不在 schema（strict:false passthrough，無 required）；
  patientId 無 required → guard 只擋「明確衝突」，不擋「無法判斷」。
- [CRITICAL] INTEGRATED_PRESCRIPTION_LOCALSTORAGE_ISLAND
  DB.integratedPrescriptions 無 /api/ 呼叫、server.js 無 Mongoose model
  → 純 localStorage、逐裝置、無備份、跨治療師不共享。
  （assessments/patients/bcf_* 皆有 Mongo 後端且雙向同步）
- [HIGH] CLINICAL_LOGIC_IN_APP_JS_AUDIT
  computeConsistency / computeRombergRx / computeMuscleRx /
  computeRightEyeRx 全在 app.js，server.js 零命中 → 違反鐵律。
  前端算法可被 cache/瀏覽器版本影響，server 無法重建或驗證處方。
  先 audit 分辨「臨床決策核心」vs「UI aggregation」，再分階段遷移。
- [BUG] EFFECTIVE_MODULE_COUNT_WRONG_POPULATION
  effectiveModuleCount 不檢查 abnormalCount，與 computeConsistency L1
  母體不一致。9003 的「僅基於 N 個模組」警語 N 值可能錯誤。
  A1 已繞開（改用 status），警語未修。併 A2/CLSCI。
- [BUG] CROSS_MODULE_CONFIRMED_ON_SINGLE_MODULE
  1 模組患者的處方卡仍標「跨模組確認 N」，與第三區「目前無跨模組
  確認腦區」自相矛盾。疑同源病灶。
- [OPEN] DEFENSE_IN_DEPTH_MISSING
  SAMPLE_ASSESSMENT_IDS 僅前端把關；示範評估 A001-A006 已存在
  production Mongo。server 應以顯式欄位(isDemo/isSystemRecord)識別，
  不得依 ID 字串硬編碼推測。
- [BUG] PATIENT_ID_CASE_INCONSISTENCY
  home_training_sessions.patientId='p001'(小寫) vs assessments/patients
  用大寫 → Mongo 字串比對 case-sensitive → 永久 orphan。
  【需確認】是否有 code path 產生小寫 id。
- [NOTE] fs.writeFileSync(PATIENTS_FILE) fallback 同款全量覆寫風險，
  但 dbReady 一旦 true 不回退 → production 穩態不可達。
- [NOTE] migrateFromFile() 開機自動 upsert patients.json → 內容過時
  會覆蓋較新資料。不刪除，故非災難級。
- [NOTE] computeConsistency Layer3(Jaccard) 計算但不進最終分數（死碼）
- [NOTE] MOD_LABELS 現有三份（8688 / 8962 / 9562）待收斂
- [NEEDS CLINICAL REVIEW] combinedPct = lat*0.5 + group*0.5，
  0.5/0.5 權重臨床依據不明
- [OPEN] FAKE_EDIT_INTEGRATED_PRESCRIPTION_BUTTON
  app.js:10200「編輯處方」只彈 toast，無 update 邏輯 → false
  affordance，應移除或 disabled。
- [STATUS] P0 進度：P0-A ✔ / P0-B ✔ / P0-C CLOSED(no-op) /
  P0-D1 CLOSED(bilateral) / P0-D2 DEFERRED(open item) /
  P0-E CLOSED(already verified) / P0-F conditional recon

---

## 現行優先序（治理鏈裁決 2026-07-12）

```
✅ A1              已部署 + PM 驗收
✅ X-ZERO-0A       已部署（deleteMany 止血）
✅ X-ZERO-0D       已稽查（PATIENT_DATA_LOSS: NOT FOUND）
──────────────────────────────
▶  X-ZERO-0B       DELETE endpoint         (server.js)
▶  X-ZERO-0C       前端 fail-loud + 停用刪除鈕 (app.js)
   X-ZERO-A        genId UUID
   X-ZERO-B        server collision guard
   X1              整合處方後端持久化
   B               MTT provenance audit
   A2 / CLSCI      計算修正
   C               Training Intensity Engine
```

---

## Verification Log

### 2026-07-10 — §3 vs server.js recon（唯讀 grep，Claude）
- `classifyPairedSaccade()`（server.js:814-824）：僅在雙側同時異常且
  互補（一 overshoot 一 undershoot）時回傳 `CONTRAPULSION`/
  `IPSIPULSION`；單側異常一律 `UNPAIRED`。
- `SIDE_LOOKUP`（server.js:841-852）：只覆蓋 `CONTRAPULSION`/
  `IPSIPULSION` 兩種雙側成對型態，無 `UNPAIRED` 條目、無
  `mechanismModel` 欄位、無 `CAUDAL_FASTIGIAL_NUCLEUS`。
- `resolveLesionSide()`（server.js:891-937）對 `UNPAIRED`（單一
  dysmetria）明確回傳 `candidate: null, candidates: null`——非
  §3.2 要求的雙候選結構，而是零候選，轉交
  `singleAbnormalSide`/`singleAbnormalType` 給呼叫端查
  `saccade_diagnosis.json`。
- `saccade_diagnosis.json`：`right_overshoot`/`left_overshoot` →
  同側 "Fastigial Nucleus ↓"（與 §3.2 一致）；但
  `right_undershoot_*`/`left_undershoot_*` → Left/Right FEF 或
  BG/PPRF（非小腦），§3.2 對側 CB 規則查無實作路徑。
- 結論：§3.1.3/§3.2 的雙候選模型與 `mechanismModel` enum尚未落地，
  為實作前待辦，非現行 bug（功能本就 "Not wired into any route"）。
