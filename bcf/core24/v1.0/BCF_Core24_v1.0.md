# BCF Core-24 v1.0

**Status:** 🟢 **FROZEN** · **Date:** 2026-07-27 · **Authority:** Phase 5 Core-24 Clinical Content SSOT
**Approvals:** SA (ChatGPT) 選題 · Gemini Independent Review APPROVED · **PM (Karl Li) 核准凍結**

> ## Core-24 正式定位：Localization + Neural Phenotype instrument
> 不是「均衡問卷」，也不是「只做定位」。24 題 = **22 LOCALIZING（腦區定位）+ 2 NON_LOCALIZING_PHENOTYPE（神經表現型入口）**；IMPACT（DFN 八題）不佔名額，另立 Impact & Participation Index。

---

## 1. 結構

| 面向 | 值 |
|---|---|
| 總題數 | 24 |
| item_class | 22 `LOCALIZING` + 2 `NON_LOCALIZING_PHENOTYPE` + 0 `IMPACT` |
| domain 分布 | VESTIBULAR 5 · OCULOMOTOR 5 · CEREBELLAR 5 · COGNITIVE 4 · BRAINSTEM_AUTONOMIC 5 |
| mandatory | `OCM-07`（→PONS）· `CBL-01`（→OMV）|
| INV-P5-1 | **PASS**（非豁免 substrate 無歸零；BG/CERV 為 Layer-5 exclusive 核准零覆蓋）|

---

## 2. 24 題清單（canonical item_class token）

### Vestibular（5）
- `QB-L3-VES-02` — 躺下、起身或翻身時出現短暫暈眩
- `QB-L3-VES-03` — 站立或行走時覺得搖晃、像踩在船上　*(dual-candidate)*
- `QB-L3-VES-04` — 在超市貨架、人群或花紋地板等視覺複雜環境中不適
- `QB-L3-VES-05` — 快速轉頭時視線短暫模糊或跳動　*(dual-candidate)*
- `QB-L3-VES-08` — 暈眩伴隨耳鳴、耳悶或聽力變化

### Oculomotor（4 LOCALIZING + 1 phenotype）
- `QB-L3-OCM-01` — 閱讀時會跳行，或需要用手指指著才讀得下去
- `QB-L3-OCM-02` — 近距離用眼後眼睛疲勞、痠脹
- `QB-L3-OCM-06` — 螢幕捲動或看快速移動畫面會不舒服　*(dual-candidate)*
- `QB-L3-OCM-07` — 難以維持注視同一點，眼睛容易飄走　**🔒 MANDATORY（唯一覆蓋 PONS）**
- `QB-L3-OCM-04` — 出現短暫或持續的複視（看到兩個影像）　**🟣 NON_LOCALIZING_PHENOTYPE**

### Cerebellar（5）
- `QB-L3-CBL-01` — 伸手拿東西時會超過或不到目標位置　**🔒 MANDATORY（唯一覆蓋 OMV）·** *(dual-candidate)*
- `QB-L3-CBL-02` — 精細動作變笨拙（扣鈕扣、寫字、用筷子）
- `QB-L3-CBL-03` — 走路時會偏向某一側　*(dual-candidate)*
- `QB-L3-CBL-05` — 說話含糊、節奏不順或斷斷續續　*(cerebellar speech / CBH)*
- `QB-L3-CBL-07` — 快速反覆的動作（如快速翻手掌）做不順

### Cognitive（4）
- `QB-L3-COG-01` — 忘記剛剛說過或剛做過的事　*(FEF PRIMARY)*
- `QB-L3-COG-02` — 難以同時處理兩件事（如邊走邊講話）　*(FEF+PAR dual-candidate)*
- `QB-L3-COG-04` — 找詞困難、話到嘴邊說不出來
- `QB-L3-COG-06` — 在熟悉的環境中方向感變差

### Brainstem / Autonomic（4 LOCALIZING + 1 phenotype）
- `QB-L3-BSA-01` — 起身站立時頭暈、眼前發黑
- `QB-L3-BSA-04` — 吞嚥困難或容易嗆到
- `QB-L3-BSA-05` — 噁心或腸胃不適　*(AUTO+MEDU dual-candidate)*
- `QB-L3-BSA-06` — 呼吸急促或覺得吸不到氣　*(清醒呼吸症狀 / MEDU)*
- `QB-L3-BSA-08` — 睡覺時被告知有打鼾嚴重或呼吸中斷　**🟣 NON_LOCALIZING_PHENOTYPE（睡眠呼吸）**

---

## 3. 覆蓋（詳 `BCF_Core24_Coverage_Report_v1.0.json`）

substrate PRIMARY 覆蓋：`PVES3·VNUC2·VCBL2·OMV1·cFN2·CBH3·MIDB1·PONS1·MEDU3·FEF2·PAR4·TEMP3·BG0·AUTO2·CERV0`

- sole-coverage：`PONS←OCM-07`、`OMV←CBL-01`（皆 mandatory）。
- `BG`、`CERV`：Layer-5 Exclusive Substrates，核准零覆蓋（不由自陳問卷定位）。
- 其餘非豁免 substrate 覆蓋皆 >0 → **INV-P5-1 PASS**。

---

## 4. 治理

| 項目 | 狀態 |
|---|---|
| 版本 | Core-24 **v1.0 FROZEN**（2026-07-27）|
| 定位 | Localization + Neural Phenotype |
| 候選池 | 不刪改 Phase-4 凍結的 48 題候選池；未入選題保留於池中（未來版本可重選）|
| 來源 | KG `phase4-v0.4`（sha256 `c00b…`）、Registry（sha256 `2fd9…`），凍結未變 |
| 下游 | `PG-6A-04` / Phase 6A Stage 2 **待另行授權**；Phase 6A 本體不得修改 |

沿革與核准鏈詳見 `BCF_Core24_Freeze_Record_v1.0.md`。

*Core-24 選定不做臨床或選題裁決之外的變更；本 spec 為 PM 核准後的凍結交付。*
