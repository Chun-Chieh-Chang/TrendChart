# Development Log (SkillsBuilder Mode)

## 2026-07-21
**任務目標 (專案全量清理與文件同步)**：
1. 全面盤點並移除過時/冗餘/無效的程式碼與檔案。
2. 同步更新所有開發文件至最新功能狀態。
3. 依 MECE 原則重整檔案結構與程式碼規範。

**執行內容 (Do & Check)**：
1. **檔案清理**：
   - 移除 `.zcode/` 目錄（已套用的 AI 計劃檔案，不再需要）。
   - 移除 `assets/.gitkeep`（空佔位檔）。
   - 更新 `.gitignore`：新增 `.zcode/`、`node_modules/` 規則。
   - 移除 `app.js` 中已註解的 `activeFilters = {};` 遺留碼。
   - 移除 `index.html` 未使用的 Alpine.js CDN 載入（所有模態框/工具提示均以原生 JS 實作）。
   - 移除 `app.js` 未使用的 `tableContainer` 變數。
   - 移除 `app.js` 中 `xIsDateCheckbox`/`x2IsDateCheckbox` 未讀取的 `dataset.prevValue` 儲存。
   - 移除 `excelParser.js` 未使用的 `subgroupSize` 參數及無效的 `dateNF` 配置（`raw: true` 時被忽略）。
2. **CSS 清理**：
   - 移除未使用的 `.secondary-accent`、`.card-icon.red` 類別。
   - 合併重複的 `.chart-box` 定義（原分別定義於兩處，屬性衝突）。
   - 移除過時的 `-moz-osx-font-smoothing` 前綴。
   - 移除關於已移除 `.mini-stat span` 的過時註解。
3. **無障礙改善**：
   - 為 `#theme-toggle` 按鈕新增 `title="切換深色模式"`。
   - 移除 `<body>` 空的 `class=""` 屬性。
   - 移除 `id="data-table"`（JS 中未使用此 ID）。
4. **文件同步**：
   - `DEV_LOG.md`：新增本次清理記錄。
   - `TASKS.md`：新增已完成任務條目（常態分佈圖管制界限、專案清理）。
   - `README.md`：修復重複的 `## 5.` 章節編號，更新功能矩陣。

**結果與驗證**：
1. 所有清理不影響現有功能運作（未改動任何業務邏輯）。
2. CSS 樣式無回歸（僅移除未使用的選擇器）。
3. 文件與程式碼邏輯一致。

---

## 2026-07-20
**任務目標 (常態分佈圖管制界限同步與 Dual-View 對齊)**：
1. 常態分佈圖新增 UCL/LCL/CL 管制界限顯示，與趨勢圖同步受 `showLimits` 開關控制。
2. 擴展常態分佈圖 X 軸範圍，確保 Target/USL/LSL/UCL/LCL 標線不被裁切。
3. Dual-view 模式下，趨勢圖與常態分佈圖高度一致（450px），消除底部多餘空白。
4. 整合遠端版本更完整的實作（支援多 column、5% padding、addRange 色帶功能）。

**執行內容 (Do & Check)**：
1. **`js/chartRenderer.js`**：
   - 採用遠端 HEAD 版本的 `stats` 參數機制，直接傳入 `currentStats`。
   - 管制界限支援多 column + 5% X 軸 padding + `addRange` 色帶。
   - 趨勢圖高度在 dual-view 模式維持 450px（與常態分佈圖一致），single-view 模式維持 800px × 0.8。
   - 統一圖例 `y: -0.25` 與底部 `margin.b: 120`。
2. **`js/app.js`**：
   - 傳入 `currentStats` 給 `renderNormalDistChart`。

---

## 2026-07-03
**任務目標 (GitHub Pages Deployment RCA)**：
1. 釐清 GitHub Pages workflow 失敗原因。
2. 驗證 Copilot 對 `deploy.yml` 提出的修正建議是否合理。
3. 修正 artifact 準備流程，讓靜態站部署成功。

**執行內容 (Do & Check)**：
1. **RCA - 第一層問題**：
   - 原始 `deploy.yml` 使用 `actions/upload-pages-artifact@v3` 搭配 `path: '.'`，將整個 repository 上傳為 Pages artifact。
   - 這種做法把 `.github/` 等非站點內容一起打包，導致 `actions/deploy-pages@v4` 在部署時出現 multiple GitHub Pages artifacts 衝突。
2. **RCA - 第二層問題**：
   - 為了避開整包上傳，曾改成先建立 `deployment/` 再執行 `cp -r *.html *.css *.js *.md assets wiki deployment/`。
   - 但專案的樣式與腳本實際位於 `css/`、`js/` 目錄，而非 repository root，因此 root-level `*.css`、`*.js` 在 GitHub Actions 中不會匹配任何檔案，造成 `cp` 失敗。
3. **建議驗證結果**：
   - Copilot 指出 `cp` 因找不到 `*.css` / `*.js` 而失敗，判斷正確。
   - 但僅加入 `nullglob`、`2>/dev/null || true` 或條件式 `cp`，只能避免指令報錯，無法保證 `css/`、`js/` 資源被正確部署，因此不足以作為完整修正。
4. **CAPA / 修正措施**：
   - 更新 **`.github/workflows/deploy.yml`**，改為明確複製 `index.html`，並只在目錄存在時複製 `css/`、`js/`、`assets/`、`wiki/` 到 `deployment/`。
   - 保留 `actions/upload-pages-artifact@v3` 的 `path: 'deployment'`，確保 GitHub Pages 只部署站點實際需要的靜態內容。

**結果與驗證**：
1. `deploy.yml` YAML diagnostics 為 0。
2. 新 workflow 已成功推送並通過 GitHub Actions，GitHub Pages 部署成功。
3. 後續若調整站點目錄結構，必須同步檢查 Pages artifact 來源是否仍與 `index.html` 的資源引用路徑一致，避免再次出現「artifact 內容正確性」與「shell glob 假設錯誤」兩類問題。

---

## 2026-07-02
**任務目標**：
1. 將趨勢圖表中數據點之間相連的實線改為虛線，並使線條變細。
2. 將圖表預設背景模式改為淺色。
3. 在管制界限(UCL/LCL)之間新增管制中心線(CL)，並與其同步受控。
4. 實施圖表視覺與介面優化（Glass Order）。

**執行內容 (Do & Check)**：
1. **`index.html`**：移除 `body` 上的 `dark-mode` class，使預設為淺色主題。
2. **`js/chartRenderer.js`**：
   - 調整 `renderTrendChart` 函式中的 `trace` 設定，將實線改為 `dash: 'dash'`，`width: 1`。
   - 在產生 `UCL`/`LCL` 標線的邏輯區塊內，新增 `addLimitLine(stats.mean, 'CL', ...)` 渲染中心線，以達到連動開關的需求。
3. **`css/style.css`**：
   - 針對 `.sidebar`, `.summary-card`, `.content-card`, `.modal-content`, `.formula-tooltip` 加入進階的 Glassmorphism 屬性：`backdrop-filter: blur(16px) saturate(180%)` 以及 `inset 0 1px 0 rgba(255, 255, 255, 0.1)` 提升透視與實體層次感。

**結果與驗證**：
修改以最小影響範圍 (Surgical Edits) 達成目標。無引入新依賴或破壞既有架構。

---

**任務目標 (Typography Redesign)**：
1. 建立全局字體比例尺 (Typography Scale)。
2. 修復標準差面板中「組內:」字體被異常放大的 CSS 污染問題。
3. 統一各數據卡片的字級層次 (Hero, Primary, Secondary, Micro)。

**執行內容 (Do & Check)**：
1. **`css/style.css`**：
   - 移除過度泛用的 `.card-info span` 與 `.mini-stat span`。
   - 新增 `.metric-value.hero` (24px)、`.metric-value.primary` (18px)、`.metric-value.secondary` (14px) 與 `.metric-label.micro` (10.4px)。
2. **`index.html`**：
   - 為總數據筆數、篩選後筆數、平均值等主數據加上 `.metric-value.hero`。
   - 為 Ca/Cp 等網格數據加上 `.metric-value.primary`。
   - 將標準差中的標籤與數值明確拆分為 `<span class="metric-label micro">` 與 `<b class="metric-value secondary">`。

**結果與驗證**：
字體層次獲得統一，版面資訊降噪成功，成功解決了 CSS 選擇器污染導致的 UI 破版問題。
