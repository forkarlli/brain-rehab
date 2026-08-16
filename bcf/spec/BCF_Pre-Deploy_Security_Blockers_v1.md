# BCF 上線前資安必做（Pre-Deploy Security Blockers）v1

**日期**：2026-08-16 　**來源**：Claude Code recon（2026-08-16）＋ Claude 風險評估
**狀態**：全部 DEFERRED（localhost-only，目前**未曝光**）

---

## 🚫 硬性閘門

**下列 P0／P1 未修復前，這台 BCF 不得部署到任何公開網址。**

目前無對外 public domain、非 live → **沒有正在進行的外洩**。以下皆為「對外上線前必須修好」的前置，不是即時急救。

---

## 摘要

| ID | 問題 | 嚴重度 | 目前曝光 | 上線前閘門 |
|----|------|--------|----------|------------|
| **P0** | 27 條 API 端點全無 auth（21 條讀寫真實病患／臨床資料） | 🔴 Critical（真 PII） | localhost only，未曝光 | 上線前**必修**：至少全域 `/api/*` auth |
| **P1** | `express.static(__dirname)` 攤開整個 repo root | 🟠 High（IP，非 PII） | localhost only，未曝光 | 上線前**必修**：收窄成 `public/` 白名單 ＋ QB 窄路由 |
| **P2** | `patients.json` 靜態曝光 | 🟢 Low | localhost only，從未進 git | 隨 P1 一併解決 |

---

## P0 · API 無 auth（最嚴重）

- **27 條 API 端點全部 NO_AUTH**；其中 **21 條讀寫真實病患／臨床資料**：`patients`(GET/POST)、`migrate-patients`、`assessments`(GET/POST/bulk)、`home-training`(GET/POST)、`therapists`(GET/POST/DELETE)、`therapy-sessions`(GET/POST/DELETE)、`bcf-diagnoses`(GET/POST)、`patients/:id/reports`、`reports/:id`(GET/review/release)。
- 不是「漏接某條」——**整套系統從未有 auth 基礎設施**（無任何 AUTH／TOKEN／SECRET／session／apikey middleware；唯一的 key 是伺服器對外打 Anthropic API 用，與保護自家端點無關）。
- CORS `*` **≠ auth**（curl／Postman 直接打不受 CORS 管）。
- **證據**：`server.js:243` `/api/patients` → MongoDB；middleware 鏈 14–32 行無任何 auth。
- **修法**：最小止血＝在所有 `/api/*` 前加一層全域 auth middleware（先用共用 token，無 token 一律 401）。完整版＝每治療師帳號／權限（之後）。此改動會動 `server.js` 核心行為 → **需獨立授權**。

## P1 · 靜態全攤開

- `server.js:32` `express.static(path.join(__dirname))` 把整個 repo root **無驗證**對外服務 → `app.js` 原始碼(644KB)、整個 `bcf/`（治理 sidecar、臨床邏輯、validator）、`CLAUDE.md`、`WHITE_PAPER.md`、4 個 JSON 全露。
- **修法**（Claude Code 已設計骨架）：`express.static('public')` 只服務白名單資產夾 ＋ 對凍結 QB 開單一唯讀窄路由；其餘 root 檔不再對外。
- ⚠️ 這是**真重構**：前端資產搬進 `public/` 會動到 `index.html` 等的相對路徑引用，要一併檢查。
- ⚠️ `prescriptions.json` 是前端故意 fetch（`app.js:11492`）——收窄後要一起搬進 `public/` 或開專用窄路由，否則打斷處方模板載入。

## P2 · patients.json 靜態曝光

- root 的 `patients.json`(352B) 被 wide static 服務。
- **但**：`.gitignore` 明列、**從未 commit**、localhost only（`server.js:220` 註解自證 production 取不到）。`server.js:223+` 拿它當 MongoDB 遷移來源 ＋ fallback。
- **修法**：隨 P1 收窄**自動解決**（static 白名單後不再服務）。無需清 git 歷史。

---

## Git 歷史註記

- **乾淨**（從未進 git）：`patients.json`、`.env`。
- **在 git 歷史**：`prescriptions.json`(1)、`saccade_diagnosis.json`(3)、`narrative_templates.json`(1)——皆為臨床模板(IP)非 PII，`prescriptions` 本就刻意公開。若日後判定某檔要**徹底**移除，光刪工作目錄不夠，需清歷史；目前評估**不需要**。

---

## 上線前檢查清單（要對外時逐項確認）

- [ ] **P0**：`/api/*` 已加 auth，未帶憑證一律 401（21 條病患端點全數覆蓋）
- [ ] **P1**：static 已收窄成 `public/` 白名單；`bcf/`、`app.js` 原始碼、治理文件不再對外
- [ ] **P1**：QB 窄路由可用，B1 仍能 fetch
- [ ] **P1**：`prescriptions.json` 載入未被打斷
- [ ] **P2**：`patients.json` 已不在對外服務範圍
- [ ] **B1**：renderer 檔已隨 P1 搬入 `public/`（trivial：self-contained ＋ 絕對路徑 fetch，零程式改動）
- [ ] **法律**：若涉真實病歷對外，個資法通報／處理層面已另尋專業意見（與技術修補是兩條線）

---

*本 register 為 living doc；每修好一項就更新狀態。P0／P1 皆需各自的獨立授權才動 `server.js`。*
