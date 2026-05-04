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
1. RightEye 截圖 AI 自動讀取 → 自動填入表單數值
2. Intrusion 振幅過濾器（小 = Fixation Stability；大 = Cross-Cord）
