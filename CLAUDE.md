# BCF 大腦活化復健系統 — CLAUDE.md

**開發者**: Karl Li, DC, PT, Functional Neurologist  
**地點**: 台中  
**系統路徑**: C:\Users\forka\brain-rehab\ (index.html + app.js)  
**患者族群**: mTBI（輕度腦震盪）  
**眼動儀**: RightEye 眼動追蹤系統

---

## 系統架構

純前端 SPA（HTML + JS + CSS），無後端。  
工作流程：RightEye 數據輸入 → 神經解剖定位分析 → 自動生成復健處方

---

## RightEye 追蹤指標

| 區段 | 指標 |
|------|------|
| Circular Smooth Pursuit | Smooth Pursuit % |
| Horizontal Smooth Pursuit | Smooth Pursuit %, ESO/EXO Average, Synchronization SP |
| Vertical Smooth Pursuit | Smooth Pursuit %, ESO/EXO Average, Synchronization SP |
| Horizontal Saccades | Saccadic Velocity, Intrusion (4方向), Overshoot/Undershoot/Missed |
| Vertical Saccades | Saccadic Velocity, Intrusion (4方向), Overshoot/Undershoot/Missed |

---

## 神經解剖定位邏輯

### Intrusion 方向定位

| 方向 | 定位 |
|------|------|
| Up | Medulla + Inferior Vermis |
| Down | Midbrain + Superior Vermis + SC |
| Left | Right Cortex + Cerebellum |
| Right | Left Cortex + Cerebellum |

**振幅過濾（待實作）**:
- Small amplitude → Fixation Stability 問題
- Large amplitude → Cross-Cord 問題

### Overshoot / Undershoot / Missed（四等級，百分比制）

計算方式：各類型次數 ÷ 總次數 × 100

| 指標 | Normal | Mild | Moderate | Severe | 主要定位 |
|------|--------|------|----------|--------|---------|
| Overshoot | <10% | 10–30% | 30–50% | >50% | Cerebellum (Vermis) → Brainstem |
| Undershoot | <20% | 20–40% | 40–60% | >60% | Frontal Eye Field → Basal Ganglia |
| Missed | <5% | 5–15% | 15–30% | >30% | Superior Colliculus → Brainstem |

### Smooth Pursuit 定位

| 異常方向 | 定位 |
|---------|------|
| Horizontal ↓ | Pons, PPRF |
| Vertical ↓ | Midbrain, riMLF |
| Circular ↓ | Cerebellum (flocculus) |
| ESO 異常 | Midbrain (EW nucleus) |
| EXO 異常 | Pons |
| Synchronization ↓ | Cerebellum (vermis, flocculus) |

### Saccadic Velocity 定位

| 異常 | 定位 |
|------|------|
| Horizontal 減慢 | PPRF |
| Vertical 減慢 | riMLF, Midbrain |
| 左右不對稱 | 對側 FEF 或同側 Cerebellum |

---

## 處方生成對應表

### 依腦區

| 腦區 | 主要處方方向 |
|------|------------|
| Cerebellum (Vermis) | Smooth Pursuit 訓練（慢速漸進）、平衡 + 眼動同步 |
| Cerebellum (Flocculus) | VOR 抑制、Gaze Stabilization、雙眼同步追蹤 |
| Midbrain | 垂直 Saccade、輻輳/散開訓練 |
| SC | 反射性 Saccade、周邊視野刺激 |
| PPRF / Pons | 水平 Saccade、Anti-saccade |
| Medulla | VOR 強化、頸部本體感覺整合 |
| FEF / Cortex | 自主性 Saccade、抑制性訓練、雙重任務 |
| Basal Ganglia | 節律性眼動、序列性眼跳 |

### Intrusion 處方

| 方向 | 處方重點 |
|------|---------|
| Up | 前庭整合 + 下方小腦訓練 |
| Down | 垂直眼動控制 + 上丘反射訓練 |
| Left | Right Cortex 激活 + 小腦協調 |
| Right | Left Cortex 激活 + 小腦協調 |

---

## app.js 開發狀態

### 已完成
- Saccade Overshoot/Undershoot/Missed 輸入欄位（四等級百分比判斷邏輯）
- Intrusion 四方向（Up/Down/Left/Right）+ 神經解剖定位
- Intrusion 方向觸發特定處方生成
- Overshoot/Undershoot/Missed 接上處方輸出（mild/moderate/severe 均有腦區標籤、臨床注記、眼動機處方條目）

### 待完成（優先順序）
1. 歷史處方「查看詳情」modal：目前儲存的整合處方在歷史記錄中只有卡片，點查看詳情是 placeholder

### 已完成（近期）
- Intrusion 振幅過濾器：小振幅 → Flocculus/SC + M1固視穩定處方；大振幅 → Cross-Cord Pathway + M7複合處方
- 當日處方產生器（Zone1-5）：三模組整合分析、策略選擇、處方表、PDF匯出、儲存至歷史
- RightEye 截圖 AI 自動讀取（已完成，呼叫 Railway /api/analyze-righteye）
- BCF 飛行椅處方自動化（`_computeBCFChairRx`）：8半規管矩陣、Step-Jitter 步進計劃、雙側非對稱補償算法、自主神經安全監控建議
- BCF 姿勢觀察 Lateral Bias 複合處方（`_computeLateralBiasChairRx`）：ML_Sway 偵測、三階段飛行椅指令表、神經生理學說明
- 姿勢選擇決策矩陣（`_selectPosture`）：6條件判斷、BILATERAL_LATERAL 雙策略A/B、覆寫 `_computeBCFChairRx` 預設姿勢、血流動力學與視覺整合建議

---

## BCF 飛行椅處方算法（`_computeBCFChairRx`）

### 輸入變量
| 變量 | 來源 | 說明 |
|------|------|------|
| canalStr | entry.failure.canal | 失效半規管字串（無論 FAILURE/COMPENSATORY 模式均取 failure canal）|
| apSway | btracksData.cop_y_mean | AP 方向重心偏移（cm）|
| mlSway | btracksData.cop_x_mean | ML 方向重心偏移（cm）|
| pathLength | input.path_eyes_closed | VES 條件路徑長度（cm）|

### 8半規管臨床矩陣（canalCode → 飛行椅基礎參數）
| Code | 對應Canal | 姿勢 | 初始Yaw | 方向 | 平面 |
|------|----------|------|---------|------|------|
| RAC | Right Ant. Canal | 趴臥 | +45° | 往前倒 | RALH |
| LPC | Left Post. Canal | 坐姿 | +45° | 往後倒 | RALH |
| LAC | Left Ant. Canal | 趴臥 | -45° | 往前倒 | LARP |
| RPC | Right Post. Canal | 坐姿 | -45° | 往後倒 | LARP |
| HRC | Right Lateral Canal | 坐姿 | 0° | 右滾轉 | Horizontal |
| HLC | Left Lateral Canal | 坐姿 | 0° | 左滾轉 | Horizontal |
| BAC | Bilateral Ant. Canal | 趴臥 | 0° | 往前倒 | Pure Sagittal |
| BPC | Bilateral Post. Canal | 坐姿 | 0° | 往後倒 | Pure Sagittal |

**Canal string → Code 映射邏輯：**
- "Right Ant. + Post. Canal" (PR方向) → HRC（水平半規管）
- "Left Ant. + Post. Canal" (PL方向) → HLC

### Step-Jitter 步進計劃
- 步進：**0°→45°**，每步 5°（共 10 步，含起始 0°）
- Jitter 振幅：**±1.5°（XYZ 三軸）**，全步程統一
- 步進節律（依 VES Path Length）：
  - < 40 cm（輕度）→ 每 2 秒一步
  - 40–70 cm（中度）→ 每 3 秒一步
  - > 70 cm（重度）→ 每 5 秒一步
- 閉環回饋：Path 改善 >10% → 增加步進角度；退步 → 退至 2° 步進

### 雙側非對稱補償算法（僅 BAC/BPC）
- Vector Angle = arctan(|ML| / |AP|)
- Case A：AP > ML × 1.5 → Yaw 補償 = arctan(ML/AP)°，加入初始 Yaw（例：AP=6.5, ML=3.1 → offset +25°）
- Case B：ML > AP → Roll 補償 = arctan(ML/AP)°（顯示提示，不調整 Yaw）

### Horizontal Canal 向量分析（HRC/HLC）
- |Vector Angle| ≤ 15° → 純 Yaw 旋轉（±15° Roll 範圍）
- |Vector Angle| > 15° → 考慮加入 Roll 分量

### 自主神經安全監控（`autoMonitor`）
| Path Length | 嚴重度 | 建議設備 |
|------------|--------|---------|
| < 40 cm | 輕度 | 標準 SpO₂ 監測 |
| 40–70 cm | 中度 | PPG 指尖血流監測 |
| > 70 cm | 重度 | CNAP 逐搏血壓監測 |

**警戒指標：**
- PPG 波幅下降 > 30% → 立即暫停，椅子回正
- 心率突然上升 > 20 bpm → 降低步進至 2°
- 患者回報頭暈加劇 → 停止並記錄當前角度

**Emergency Reset：**偵測到 PPG Amplitude 驟減 → 自動回正至初始 Yaw 角度

---

## 姿勢選擇決策矩陣（`_selectPosture`）

輸入：`canalStr`（failure.canal 字串）、`apSway`（BTrackS cop_y_mean，正值=前偏）、`mlSway`（cop_x_mean，正值=右偏）

| 條件 | 代碼 | 姿勢 |
|------|------|------|
| Bilateral + ML偏 > 0 | BILATERAL_LATERAL | null（提供策略A/B） |
| Anterior only | PRONE | 趴臥 |
| Posterior only | UPRIGHT | 坐姿 |
| ML > AP（絕對值） | UPRIGHT_WITH_ROLL | 坐姿 |
| AP 前偏（signed > 0）| PRONE | 趴臥 |
| AP 後偏 / 無偏 | UPRIGHT | 坐姿 |

### BILATERAL_LATERAL 雙策略
- **策略A**（前跌風險高）：趴臥 + Roll + Pitch Down → 強化 Extensor Thrust 自我保護機制
- **策略B**（後跌/自主神經不穩）：坐姿 + Roll + Pitch Up → 穩定 Midline Stability

### 姿勢臨床意義
| 姿勢 | 血流動力學 | 視覺整合 |
|------|-----------|---------|
| 趴臥 | 頭部低位，回心血量充足，適合 POTS / 低血壓傾向 | 閉眼本體覺整合訓練 |
| 坐姿 | 自主神經挑戰較大，適合進階訓練 | 注視前方固定視標，訓練 VOR |

### 整合流程（`computeRombergRx` 內）
1. 計算 `btracksData.cop_y_mean / cop_x_mean`
2. 呼叫 `_selectPosture(failure.canal, ap, ml)` → `postureDecision`
3. 若 `code !== 'BILATERAL_LATERAL'`，以 `postureDecision.posture` 覆寫 `_computeBCFChairRx` 的預設姿勢
4. `bcfChair.postureOverridden = true` 時，UI 顯示「AP/ML 數據修正了預設姿勢」
5. `postureDecision` 加入 return → `_renderRombergResultHTML` 顯示姿勢選擇理由 + 策略A/B + 血流動力學 + 視覺整合建議

---

## BCF 姿勢觀察 Lateral Bias 複合處方（`_computeLateralBiasChairRx`）

### 觸發條件（`computeRombergRx` 內自動偵測）
- `btracksData.cop_x_mean`（ML_Sway）≠ null
- `input.path_eyes_closed` ≥ 40 cm（VES 條件路徑長度進入中度或重度異常範圍）
- ML > 0（右偏）→ Right Vestibular Hypofunction with Lateral Bias
- ML < 0（左偏）→ Left Vestibular Hypofunction with Lateral Bias

### 目標半規管
| 側別 | 目標 Canals |
|------|------------|
| Right Lateral Bias | RAC + RPC + R-HC |
| Left Lateral Bias  | LAC + LPC + L-HC |

### 三階段飛行椅執行順序
**第一階段（進程）：** Roll 0°→20°，每步 5°，節律同 `_computeBCFChairRx`  
- 複合刺激 A（強化 AC）：Roll 基礎上加入 Pitch Down -5°  
- 複合刺激 B（強化 PC）：Roll 基礎上加入 Pitch Up +5°

**第二階段（擾動 Jitter）：** 在側傾峰值位停留，執行  
- Yaw 快速震盪：±2°（整合 HC 刺激）  
- 三軸微動：X=1°, Y=2°, Z=1°

**第三階段（閉環回測）：**  
- 觀察 BTrackS ML 數值是否向 0 趨近  
- ML 改善 >10% → 增加 Roll 步進；退步 → 退至 2° 步進

### 神經生理學說明
- Roll 物理刺激同時切入同側 AC + PC 的運動平面  
- 側傾激活同側 Lateral Vestibular Nucleus → 增強同側所有半規管張力  
- Yaw 震盪整合 HC 刺激 → 加速 Medial-Lateral Control 恢復

### PPG 監控建議
與 `_computeBCFChairRx` 相同分級，Path > 70 cm 時 CNAP 為必要

### 輸出欄位（`computeRombergRx` 回傳）
- `lateralBias`：`{ direction, diagnosis, mlValue, targetCanals }` 或 `null`
- `lateralBiasChair`：`_computeLateralBiasChairRx` 完整結果或 `null`
- 渲染函數 `_renderRombergResultHTML` 新增：
  - 處方類型 badge（單 Canal 處方 / Lateral Bias 複合處方）
  - 姿勢觀察卡片（ML 偏移方向 + 診斷 + 目標 Canals）
  - 三階段飛行椅三軸指令表
  - PPG 監控建議（含 CNAP 必要提示）

---

## SP Lateralization Engine（追蹤偏側化引擎）

### Data Fields
| 欄位 | DOM ID | 說明 |
|------|--------|------|
| spHRight | re-spH-right | 右向追蹤% |
| spHLeft  | re-spH-left  | 左向追蹤% |

### Three-Rule Logic（lines 3385–3399）
1. Both < 60% → `Bilateral_Cerebellar_or_Vermis`（red badge）
2. spHRight < spHLeft − 15 → `Right_Cerebellar_Weakness`（yellow badge）
3. spHLeft < spHRight − 15 → `Left_Cerebellar_Weakness`（yellow badge）

### Prescription Output（dual-track）
Each lateralization tag fires **two** `addRx` rows:

| Track | 模式 | 訓練類型 | 角度 | 速度 | 目標 |
|-------|------|---------|------|------|------|
| CB track | M1 | Pursuit右向/左向 CB側性化 | R90/L90 | S2 | Right/Left CB Flocculus |
| Cortical track | M1 | Pursuit右向/左向 皮質側性化 | R90/L90 | S1 | Right/Left Parietal MT/MST/PPC BA39-40 + FEF |

Cortical rows carry extra metadata: `laser_guidance_target` = `Right/Left_Field_Slow_Rightward/Leftward`, `cortical_target` = `Right/Left_Parietal_MT_MST_FEF`.

Angle strings are intentionally distinct per row (e.g. `R90（Right CB Flocculus）` vs `R90（Right Parietal MT/MST）`) to prevent deduplication by the `seenRx` Set.

### `cerebellarLat` Object
```js
{
  tag,                   // 'Right_Cerebellar_Weakness' | 'Left_Cerebellar_Weakness' | 'Bilateral_Cerebellar_or_Vermis'
  vestibularChairRotation, // string or null
  cbTarget,              // e.g. 'Right CB (Flocculus)'
  corticalTarget,        // e.g. 'Right Parietal (MT/MST)'
}
```
Stored on `reRec.cerebellarLat` at save time. Displayed in the history card as two coloured chips (blue = CB, purple = Parietal).

### Neuroanatomy Reference
| Deficit | CB Target | Cortical Target |
|---------|-----------|----------------|
| Right pursuit ↓ | Right CB Flocculus | Right Parietal MT/MST/FEF（ipsilateral control） |
| Left pursuit ↓  | Left CB Flocculus  | Left Parietal MT/MST/FEF |
| Bilateral ↓     | Cerebellar Vermis  | Bilateral Parietal MT/MST / MVN / Neural Integrator |

### Vestibular Chair Rotation
| Tag | 前庭椅建議 |
|-----|----------|
| Right_Cerebellar_Weakness | Leftward Decel or Rightward Accel |
| Left_Cerebellar_Weakness  | Rightward Decel or Leftward Accel |
| Bilateral_Cerebellar_or_Vermis | Both directions |

### Call Sites（all updated — commits 68674aa + 56d27e1）
| 函數 | 行號 | 說明 |
|------|------|------|
| `analyzeRightEyeStandalone` | ~5819 | 完整分析 button |
| `generateBCFResults` | ~4263 | BCF 處方生成 |
| `generateIntegratedPrescription` | ~4606 | 整合處方 |
| `saveRightEyeAssessment` | ~6153 | 儲存評估 |
| saved-record replay | ~8039 | 歷史記錄重播 |
