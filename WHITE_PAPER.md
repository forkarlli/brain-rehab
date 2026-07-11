# BCF White Paper
Version: 1.3
Date: 2026-07-10
Status: SSOT 首次落地版
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
- [STATUS] P0 進度：P0-A ✔ / P0-B ✔ / P0-C CLOSED(no-op) /
  P0-D1 CLOSED(bilateral) / P0-D2 DEFERRED(open item) /
  P0-E CLOSED(already verified) / P0-F conditional recon

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
