# BCF White Paper
Version: 1.0
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

## Open Items（未解，實作前處理）
- [BLOCK] Fastigial alias 正規化＝Hard Blocker
  canonical: CAUDAL_FASTIGIAL_NUCLEUS
  label: Caudal Fastigial Nucleus (FOR)
  Fastigial/cFN/FOR 皆 alias，不新增獨立 region
- [CONFIRMED GAP] §3 雙候選/mechanismModel enum/CAUDAL_FASTIGIAL_NUCLEUS
  於 server.js 均未實作；現行 UNPAIRED 回 candidate:null 並轉
  saccade_diagnosis.json，undershoot 指向 FEF/BG/PPRF（非小腦）
  → 與 §3.2 不一致。（recon 2026-07-10 確認，見下方 Verification Log）
- [GATE] §1/§2 進實作前流程已過審；alias blocker 解除後才排

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
