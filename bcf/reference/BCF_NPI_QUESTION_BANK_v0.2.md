# BCF NPI Question Bank v0.2 — Layer 3

**Date:** 2026-07-27 · **Author:** Claude Code · **依據:** 架構裁決 2026-07-27「分層 Freeze 與 Phase 4 啟動定案」

| 治理項 | 狀態 |
|---|---|
| **本文件** | 🔴 **`DRAFT`** |
| 臨床審 | 🔴 **48 題從未經正式臨床審**（不在架構裁決 §⑫ 的 Gemini 範圍內） |
| Phase 4 Neural Mapping | 🟢 `ACTIVE` — 本文件即其工作標的 |
| Phase 5 Core-24 | ⬜ 未開始 |
| Production | 🔴 `NOT_AUTHORIZED` |

> 🔴 **本文件在 Phase 4 完成前不得 freeze。**
> Phase 4 同時是 Question Bank 的 **admission test** —— 填 mapping 時若發現題目
> 不可定位、過度多義或需改寫，那是**回頭改題**的訊號。
> 先 freeze 再做 Phase 4，等於把依賴方向倒過來。

## Phase 4 已裁決事項（架構裁決 §⑨／§⑩）

**A. DFN 八題預設 `NON-LOCALIZING`**
可進 Severity／Functional Impact；**不得進 localization、不得提高 LCI**。
除非個別題目存在非常明確、經臨床專家核准的神經系統關聯，否則維持 `NONE`。

**B. HC-BPPV — Layer 3 只能產生 `POSITIONAL_VERTIGO_PHENOTYPE`**
病人無法可靠回報眼振方向／geotropic-ageotropic／左右側／canal localization。
🚫 不得產生 `HC_BPPV_LEFT` / `HC_BPPV_RIGHT` / `GEOTROPIC_HC_BPPV` / `AGEOTROPIC_HC_BPPV`。
必須由 Layer 5 objective positional test 確認。

**C. CBL-03（走路偏一側）** —— 保留方向資訊，但**單題不得直接輸出 lesion side**：
```
PRIMARY        = CEREBELLAR_SYSTEM
LATERALITY     = REQUIRES_OBJECTIVE_CONFIRMATION
CANDIDATE_MODE = PRIMARY_PLUS_ALTERNATIVE
```
遵守 White Paper §3.1.3，不得硬指單一 Purkinje 或 Fastigial 模型。

**D. OCM 八題 —— `NO LATERALITY FROM QUESTIONNAIRE`**
可映射至 Oculomotor Network／FEF／Parietal／Brainstem Gaze／Vergence／Visual Motion，
但🚫 `OD → Right`、🚫 `OS → Left`、🚫 閱讀跳行 → 固定某側 FEF、🚫 複視 → 固定某側 Brainstem。
側化只可來自 Layer 5 或經核准的方向性臨床觀察。

**E. Phase 4 輸出不是診斷** —— 應稱 `Neural System Associations` /
`Phenotype Candidates` / `Objective Confirmation Requirements`，
🚫 不得稱 `Diagnosis` / `Lesion Confirmed` / `Brain Region Damaged`。

---

## 1. Form B — Layer 3 BCF-NPI（48 候選）🟡 未受本輪影響

Owner: Patient · 每次正式評估 · 回想期間：過去 2 週 · 0–4 Likert
⚠️ **Phase 3 候選池，不是 Core-24。** Principle 3：Questionnaire ≠ Diagnosis。

| Domain | 題目 |
|---|---|
| **VES**（8） | 轉頭時旋轉／姿勢性短暫暈眩／站行搖晃如踩船／視覺複雜環境不適／快速轉頭視線跳動／搭車電梯症狀加重／**每次發作一分鐘內停止**／伴耳鳴耳悶聽力變化 |
| **OCM**（8） | 閱讀跳行／近距離用眼疲勞／遠近對焦變慢／複視／追視困難／螢幕捲動不適／難維持注視／畏光 |
| **CBL**（8） | 伸手超過或不到目標／精細動作笨拙／走路偏一側／腳跟接腳尖困難／說話含糊斷續／難平順停止動作／快速交替動作不順／**睜眼站立也搖晃** |
| **COG**（8） | 忘記剛做過的事／難同時處理兩件事／注意力難持續／找詞困難／思考變慢／熟悉環境方向感差／計畫組織困難／用腦後症狀加重 |
| **BSA**（8） | 起身頭暈眼前發黑／心悸／手腳冰冷出汗異常／吞嚥困難嗆到／噁心腸胃不適／呼吸急促／冷熱耐受差／睡眠打鼾或呼吸中斷 |
| **DFN**（8） | 減少外出社交／樓梯不平路面困難／開車騎車受影響／工作學業受影響／需人協助 ADL／因怕跌倒改變行動／運動量減少／症狀影響情緒 |

**🔴 側化鐵律：** OD/OS 不推方向／不側化 → OCM 全 8 題**不得**對映側別。
CBL-03（走路偏一側）是唯一帶方向資訊者，依 WP §3.1.3 為**雙候選**，**單題不得產生側化輸出**。

**⚠️ DFN 建議只進 SI，不進 localization**（「不敢出門」不指向腦區）—— 待 Phase 4 確認。
**⚠️ WP §1.2（HC-BPPV）以眼振方向鑑別，病人無法自陳** → 本問卷結構上無法支援，須靠 Layer 5。

`severity_index` / `localization_candidates` 維持 `PENDING_PHASE_4` —— 權重未定前任何數值都是憑空捏造。

---
