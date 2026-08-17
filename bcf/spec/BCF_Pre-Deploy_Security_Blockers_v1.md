# BCF 資安必做（Security Blockers）v1.1

**日期**：2026-08-16（建立）／2026-08-17（修訂 v1.1）
**來源**：Claude Code recon（2026-08-16）＋ Claude 風險評估
**狀態**：🔴 **P0 LIVE 且正在曝光** ／ 🟢 P1 已修復 ／ 🟢 P2 已解決 ／ 🔴 **P3 未處置（可枚舉，暫按 Critical）**

---

## ⚠️ v1.1 修訂說明 — v1 的核心前提是錯的

v1 聲稱「全部 DEFERRED（localhost-only，目前未曝光）」、「無對外 public domain、非 live」。

**該前提未經查證，且是錯的。** 2026-08-17 實測 `/api/version` 回 HTTP 200，production
於 `https://brain-rehab-production.up.railway.app` 持續運行，且跑的正是 v1 所在的 commit
（`e594740`）。P0 從未是「上線前的待辦」——它一直是**正在進行的曝光**。

v1 本身曾經公開可讀（一份列出端點與行號的漏洞地圖）。P1 修復後已為 404。

修訂內容：① 曝光狀態全面更正 ② API 總數 27→28（計數錯誤，21 之子計數正確）
③ P1 標記為已修復並改為實際採用的修法 ④ P2 標記已解決 ⑤ 檢查清單改為可實際驗收
⑥ 新增 P3（RightEye ngrok 隧道無驗證＋ID 可枚舉）
⑦ 新增憑證輪換未完成項（2026-07-10 事故，與 static 路徑無關）

---

## 🚫 硬性閘門

**P0 未修復前，這台 BCF 已經在對外曝光真實病患資料。**

不再是「上線前必須修好」——**是現在正在發生**。P1 已修復不改變此判斷：
`app.js` 必須公開（前端依賴），而端點路徑就寫在其中（`app.js:152` `fetch('/api/patients')`），
故 P1 未縮小 P0 的攻擊面。

---

## 摘要

| ID | 問題 | 嚴重度 | 目前曝光 | 狀態 |
|----|------|--------|----------|------|
| **P0** | 28 條 API 端點全無 auth（21 條讀寫真實病患／臨床資料） | 🔴 Critical（真 PII） | 🔴 **LIVE，正在曝光** | **未修復** — 需獨立授權 |
| **P1** | `express.static(__dirname)` 攤開整個 repo root | 🟠 High（IP，非 PII） | 🟢 已關閉 | ✅ 修復於 `5323244`（2026-08-17） |
| **P2** | `patients.json` 靜態曝光 | 🟢 Low | 🟢 已關閉 | ✅ 隨 P1 解決，實測 404 |
| **P3** | RightEye 外部服務隧道無驗證（免費 ngrok，網址即憑證；ID 可推測 → 可枚舉） | 🔴 **Critical**（暫定，fail-closed；n=1 待 ①b 確認） | 🟠 間歇（PM 筆電開機時） | **未處置** — 止血不等 ①b |

---

## 🔴 P0 · API 無 auth（未修復，正在曝光）

- **28 條 API 端點全部 NO_AUTH**（v1 誤記為 27，已更正；21 之子計數正確）。行號經
  2026-08-17 逐條核對：67, 276, 294, 321, 340, 385, 423, 477, 491, 508, 520, 534, 546,
  559, 570, 582, 593, 620, 642, 855, 1090, 1214, 1256, 1283, 1785, 1817, 1829, 1851。
- 其中 **21 條讀寫真實病患／臨床資料**：`patients`(GET/POST)、`migrate-patients`、
  `assessments`(GET/POST/bulk)、`home-training`(GET/POST)、`therapists`(GET/POST/DELETE)、
  `therapy-sessions`(GET/POST/DELETE)、`bcf-diagnoses`(GET/POST)、`patients/:id/reports`、
  `reports/:id`(GET/review/release)。
- 另 6 條為 AI 分析類（`parse-voice`、`analyze-righteye`、`parse-btracks-image`、
  `analyze-saccade-direction`、`analyze-trajectory-entropy`、`transcribe`）——不直接讀寫
  病歷但屬 PHI-adjacent；其餘 2 條為 `/api/version` 與 `/api/righteye/fetch`(proxy)。
- 不是「漏接某條」——**整套系統從未有 auth 基礎設施**（無任何 AUTH／TOKEN／SECRET／session／apikey middleware；唯一的 key 是伺服器對外打 Anthropic API 用，與保護自家端點無關）。
- CORS `*` **≠ auth**（curl／Postman 直接打不受 CORS 管）。
- **證據**：`/api/patients` → MongoDB；middleware 鏈無任何 auth（行號因 P1 patch 位移，
  現為 `server.js:276`／middleware 鏈 14–64 行）。
- ⚠️ **未實測驗證**：驗證需對病患端點發請求，會存取真實 PII，**刻意未執行**。
  判斷依據為程式碼側零 auth ＋ production 正在跑該 commit。
- **修法**：最小止血＝在所有 `/api/*` 前加一層全域 auth middleware（先用共用 token，無 token 一律 401）。完整版＝每治療師帳號／權限（之後）。此改動會動 `server.js` 核心行為 → **需獨立授權**。

## ✅ P1 · 靜態全攤開（已修復 `5323244`）

- **原問題**：`server.js:32` `express.static(path.join(__dirname))` 把整個 repo root
  **無驗證**對外服務 → `app.js` 原始碼(644KB)、整個 `bcf/`（治理 sidecar、臨床邏輯、
  validator）、`CLAUDE.md`、`WHITE_PAPER.md`、4 個 JSON 全露。實測曾為 200。
- **實際修法**（與 v1 所述不同）：在 `express.static` **之前**插入 deny-list middleware
  （`server.js:32-63`），root 層 `.json` 預設全擋（fail-closed），白名單僅
  `/bcf/qb/` 與 `/prescriptions.json`。
  **未建立 `public/`、未搬動任何檔案** —— v1 原設計的 `public/` 白名單方案未採用，
  因搬檔會動到 `index.html` 相對路徑引用，風險高於收益。
- **驗證（2026-08-17，production `13ef308`）**：
  - 應擋：`/server.js` `/migrate.js` `/package.json` `/package-lock.json` `/CLAUDE.md`
    `/WHITE_PAPER.md` `/narrative_templates.json` `/saccade_diagnosis.json`
    `/patients.json` `/bcf/spec/*` `/bcf/core24/*` `/bcf/validator/*` `/bcf/reference/*`
    `/worker/*` `/tests/*` → **全部 404**
  - 應通：`/index.html` `/app.js` `/styles.css` `/prescriptions.json`
    `/b1_questionnaire.html` `/bcf/qb/v1.0/BCF_QUESTION_BANK_v1.0_FROZEN.json` → **全部 200**
  - 繞道測試：`/%73erver.js`（URL 編碼）、`/bcf/qb/../spec/…md`（路徑遍歷）、
    `/./server.js` → **全部 404**
- ⚠️ **有意識留下的洞**：`prescriptions.json` 仍公開（前端 `app.js:11492` 必需）。
  屬臨床模板 IP，非 PII。這是白名單的必要代價，不是遺漏。
- ⚠️ **`app.js` 仍公開且不可能擋**（前端必需）→ P0 端點路徑仍可從其中讀出。

## ✅ P2 · patients.json 靜態曝光（已解決）

- root 的 `patients.json`(352B) 曾被 wide static 服務。
- `.gitignore` 明列、**從未 commit**（故容器內不存在）。`server.js:223+` 拿它當 MongoDB
  遷移來源 ＋ fallback，而 `server.js:284` 的 `fs.writeFileSync` 可能在執行時產生它。
- **已解決**：P1 的 root 層 `.json` fail-closed 規則涵蓋此檔（不依賴逐一列舉檔名，
  故即使日後被寫出也仍被擋）。實測 `/patients.json` → **404**。無需清 git 歷史。

## 🔴 P3 · RightEye 外部服務隧道無驗證＋ID 可枚舉（未處置）

- `server.js:1248` `RIGHTEYE_URL = process.env.RIGHTEYE_SERVICE_URL || 'http://127.0.0.1:3001'`
- Railway 已設定該變數，網域後綴為 `.ngrok-free.dev`（免費 ngrok 靜態隧道）
- 免費 ngrok 預設無驗證 → **網址本身即為唯一憑證**；靜態網域不輪替
- `/api/righteye/fetch`（server.js:1250-1283）為純 pass-through proxy：
  送出 User ID（格式疑似「姓氏+西元生日」，例：`Xxx19680101` —— 樣本已去識別化）、
  回傳眼動量測資料
- 🔴 **這是四項中唯一「資料送出去」的方向**，其餘三項為「資料被拿走」
- 🔴 **ID 格式若可推測，「網址是唯一屏障」的性質就從被動洩漏升級為主動枚舉**：
  攻擊者不需竊取資料庫或猜中任何憑證，取得網址後即可依格式規則遍歷 User ID，
  逐一取回眼動量測資料。**此為 P3 的核心風險，不因具體樣本去識別化而降低** ——
  去識別化保護的是這份文件，不是那個端點。
- **暴露窗口為間歇性** —— 服務跑在 PM 筆電，關機／關閉隧道即中斷
- ⚠️ **該外部服務在所有專案文件中零記載**（`.md`/`.json` grep 零命中），
  本機亦無 source tree（maxdepth 4 搜尋四種命名皆無）
- **ID 可推測性（P3-① 已部分成立）**：單一樣本（PM 提供之 RightEye 報告截圖）顯示
  User ID 由「姓氏 + 西元生日」構成，姓名／ID／DOB 三欄可相互驗證。**n=1，全體適用性
  未證實** → 依 fail-closed 原則，在被推翻前按「可推測」處理。待 P3-①b 以第二份
  不同病人報告確認。
- 其餘待確認見檢查清單 P3-②／P3-③

---

## Git 歷史註記

- **乾淨**（從未進 git）：`patients.json`、`.env`。
- **在 git 歷史**：`prescriptions.json`(1)、`saccade_diagnosis.json`(3)、`narrative_templates.json`(1)——皆為臨床模板(IP)非 PII，`prescriptions` 本就刻意公開。若日後判定某檔要**徹底**移除，光刪工作目錄不夠，需清歷史；目前評估**不需要**。

---

## 檢查清單

`B=https://brain-rehab-production.up.railway.app`

### 🔴 未完成

- [ ] **P0**：`/api/*` 已加 auth，未帶憑證一律 401（21 條病患端點全數覆蓋）
      驗收：`curl -o /dev/null -w "%{http_code}" $B/api/patients` → 應 **401**（現為未驗證即回資料）
- [x] **P3-①（決定分級）**：部分成立 —— 高度指向可推測
      證據：單一樣本（PM 提供之 RightEye 報告截圖）顯示 User ID
            由「姓氏 + 西元生日」構成，姓名／ID／DOB 三欄可相互驗證。
      限制：n=1，是否全體適用未證實；需第二份不同病人報告確認。
      ⚠️ 依 fail-closed 原則，在推翻前按「可推測」處理。
      → **P3 現按 🔴 Critical 處理**，與 P0 同級。
- [ ] **P3-①b**：取第二份不同病人的 RightEye 報告，確認 ID 規則是否全體適用
      ⚠️ 此項**不是**加驗證的前置條件 —— 見下一項
- [ ] **P3（止血，不等 ①b）**：RightEye 隧道加上驗證
      （ngrok basic-auth／OIDC，或改為非公開連線方式）
      ⚠️ ① 已按可推測處理 → 止血不得等 ①b／②／③ 釐清。
      加驗證同時解決枚舉問題，且不需知道 ID 規則細節即可執行。
- [ ] **P3-②**：服務是否為 PM 自製（決定能否修改其 ID 規則與加驗證）
- [ ] **P3-③**：ngrok 連線紀錄有無陌生存取（判斷是否已被利用）
      ⚠️ 若 ① 成立，此項性質從「例行檢查」變為**事故調查**
- [ ] 🔴 **憑證輪換**：2026-07-10 `grep railway .env` 事故已將 MongoDB
      連線字串（含密碼）印入對話。該憑證應視為**已洩漏**，非「未排除的可能性」。
      處置：於 MongoDB Atlas 輪換密碼 → 更新 Railway 環境變數 → 更新本機 `.env`。
      ⚠️ 與 static 路徑無關，P1 修復不涵蓋此項。
      ⚠️ 若已於 2026-07-10 之後輪換過，請改標 [x] 並註明日期。
- [ ] **法律**：production 已對外曝光真實病歷端點一段時間 → 個資法通報／處理層面
      須另尋專業意見（與技術修補是兩條線）。⚠️ v1 誤判為「未曝光」，此項當時被略過。
      ⚠️ P3 為 PII **外送**（跨境經第三方隧道），與 P0 的「被拿走」在法律性質上可能不同，
      徵詢時應分開陳述。

### ✅ 已完成（2026-08-17，production `13ef308` 實測）

- [x] **P1**：伺服器端程式碼、治理文件、後端資料檔不再對外
      `curl -o /dev/null -w "%{http_code}" $B/server.js` → **404** ✓
      `curl -o /dev/null -w "%{http_code}" $B/CLAUDE.md` → **404** ✓
- [x] **P1**：前端未被打斷
      `$B/index.html` → **200** ✓　`$B/app.js` → **200** ✓　`$B/styles.css` → **200** ✓
- [x] **P1**：`prescriptions.json` 載入未被打斷 → **200** ✓
- [x] **P1**：B1 仍能 fetch 凍結 QB
      `$B/bcf/qb/v1.0/BCF_QUESTION_BANK_v1.0_FROZEN.json` → **200** ✓
- [x] **P1**：治理 sidecar 不再對外（含本檔）
      `$B/bcf/spec/BCF_Pre-Deploy_Security_Blockers_v1.md` → **404** ✓
- [x] **P2**：`patients.json` 已不在對外服務範圍 → **404** ✓
- [x] **憑證未經 static 外洩**（2026-08-17 實測，P1 修復前即為 404）
      `$B/.env` → **404** ✓　`$B/.git/config` → **404** ✓
      `$B/patients.json` → **404** ✓
      ⚠️ 僅證明 static 路徑未洩漏。其餘管道分列如下：
      · 舊 commit —— ✅ 已排除（2026-08-17 查證：`.env` 從未進入 git 歷史；
        歷史中無 `mongodb+srv` 字串；`.gitignore` 於 `ba61994` 與 MongoDB 支援同時建立）
      · 對話記錄 —— 🔴 未排除。2026-07-10 `grep railway .env` 事故曾將
        含密碼之連線字串印入對話。此為實際曝光點，與 static 路徑無關。
      · 截圖 —— 🟡 無從查證（不在 repo 內）
      此三條僅說明 static 路徑之清潔度，不構成「憑證安全」之結論。
      憑證輪換另列為未完成項。

### 已作廢（v1 原設計未採用）

- ~~**P1**：static 收窄成 `public/` 白名單~~ → 改採 deny-list middleware
- ~~**P1**：QB 窄路由~~ → 改採 allow-list regex `/^\/bcf\/qb\//i`
- ~~**B1**：renderer 檔搬入 `public/`~~ → 未搬檔，`b1_questionnaire.html` 留在 root

---

*本 register 為 living doc；每修好一項就更新狀態。P0 需獨立授權才動 `server.js`。*

*v1.1 修訂教訓：v1 將「尚未部署」當成既有事實寫入治理文件而未查證，導致 Critical 級的
正在進行曝光被降級為待辦事項，並使法律通報一項被整體略過。**部署狀態屬可驗證事實，
不得以推定代替實測。***
