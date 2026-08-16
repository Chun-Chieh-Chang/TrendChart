# Development Log (SkillsBuilder Mode)

## 2026-08-16
**任務目標 (精密儀表與工業級數據工作台風格重構與專案全量優化 - Precision Workbench v1.2.0)**：
1. 本地與遠端狀態確認：檢查 Git 工作樹並確認與 `origin/main` 完全同步。
2. 介面風格重構（唯一風格套用）：
   - 移除所有外部字體強制覆蓋（如 Newsreader/Inter 等外部 Google Fonts 加載），使用原生 `var(--vscode-font-family)` 與彈性自適應行高，徹底防止排版位移（Reflow/CLS）。
   - 導入 Precision Instrument Design Tokens：冰川工作台底色 (`#f1f5f9`)、面板卡片純白底色 (`#ffffff`)、`1px solid #cbd5e1` 精密線框配合 `0 1px 3px rgba(15, 23, 42, 0.08)` 微陰影。
   - 品牌鈷藍飾條與即時狀態：側邊欄頂部左側配置 `5px solid #0284c7` 鈷藍飾條，並加入硬體綠色脈衝呼吸燈（`pulseGreen`）即時指示系統在線狀態。
   - 語意訊息與色彩階層：使用者/主要分析卡片（鈷藍）、助理/輔助分析卡片（精密青色 `#06b6d4`）、系統/警示（警示淺紅 `#fef2f2` + 紅色邊框 `#dc2626`）。
   - 按鈕與微動效：俐落平整主/次要按鈕，搭配 `0.12s cubic-bezier(0.16, 1, 0.3, 1)` 快速過渡。
3. 清理混雜色彩：移除暗色模式切換邏輯與分散色彩，統一代碼與圖表渲染至此唯一工業級工作台標準。
4. X 軸視覺對比度優化：解決雙 X 軸交替字體顏色在淺色背景下對比度過低不易區分之問題。
5. 全量文件與代碼 100% 同步 (MECE)：同步 `README.md`、`TASKS.md`、`wiki/`、`DEV_LOG.md`。

**問題原因分析 (RCA - Root Cause Analysis)**：
1. **外部字體加載風險**：外部 Google Fonts（Newsreader 等）在不同網路環境或 VSCode Webview 內部加載時，容易引發 FOIT/FOUT 及佈局重排（Layout Shift）。
2. **多主題分散邏輯**：過往版本並存暗色與亮色主題切換代碼，導致圖表色盤需維護兩套顏色邏輯，增加渲染複雜度與維護成本。
3. **X 軸文字對比度過低**：先前副 X 軸交替色階採用鈷藍 (`#0284c7`) 與青色 (`#06b6d4`)，兩者在純白底色上明度與色相過於接近，肉眼辨識不易。

**矯正與預防措施 (CAPA - Corrective & Preventive Action)**：
1. **字體全面原生化**：強制使用 `var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)`，確保 100% 零位移與極致加載速度。
2. **單一工業級色彩標準**：廢除 `dark-mode` 切換按鈕與相應 CSS/JS 分支，統一使用高對比純淨冰川工作台。
3. **X 軸交替文字高對比化**：
   - 主 X 軸：深石墨藍 (`#0f172a`, font-weight: 600) vs 高飽和深鈷藍 (`#0284c7`, font-weight: 700)。
   - 副 X 軸：深翡翠綠 (`#047857`, font-weight: 600) vs 濃郁靛青藍 (`#4338ca`, font-weight: 700)。
4. **全量文件同步**：落實 MECE 原則，確保所有開發文件與現行程式碼邏輯 100% 同步。

**執行內容與運行確效 (Do & Check)**：
1. **`css/style.css`**：全面導入 Precision Workbench Tokens，移除未使用的暗色規則與光暈。
2. **`index.html`**：移除 Google Fonts 外鏈，新增綠色脈衝呼吸燈，移除主題切換按鈕，更新版本至 v1.2.0。
3. **`js/chartRenderer.js`**：統一套用工業級圖表背景與色盤，實作高對比雙 X 軸文字交替與加粗。
4. **`js/app.js`**：清理主題切換事件綁定。
5. **文件全量同步**：`README.md`、`TASKS.md`、`wiki/`、`DEV_LOG.md` 全數更新至 v1.2.0。
6. **確效測試**：
   - `node --check` 驗證 `app.js`、`chartRenderer.js`、`excelParser.js` 語法全數通過。
   - 瀏覽器沙盒環境實測無任何 Console 錯誤，脈衝呼吸燈、微動效、圖表渲染與表格預覽全部正常。

---

## 2026-08-14
**任務目標 (高級感設計系統 + 全量清理 + 文件同步 + 版本基準)**：
1. 依 huashu-design 設計 skill 打造「奶油紙 × 青藍漸層」高級感介面，去除 AI 味。
2. 以 Tool-Calling 系統選型並整合 Lucide 圖標系統。
3. 全量盤點清理冗餘檔案與程式碼，同步文件至最新狀態。
4. 建立 Git 還原基準點並推送 GitHub Pages。

**執行內容 (Do & Check)**：
1. **高級感設計系統 (v1.1.0)**：
   - `css/style.css`：全面重設計 — `#F7F3EC` 奶油紙底、三層青藍 radial 漸層光暈背景（`--bg-glow`）、暖白玻璃卡片（`blur(18px) saturate(140%)`）、發絲邊框 `#E4DED2`、漸層按鈕/圖示（`--grad-btn`：`#2F7FE0 → #3EC7D8`）。
   - 全站最小字體提升至 13px (0.8125rem)，符合無障礙規範。
   - 暗色模式同步為暖調深色 + 青藍光暈。
   - `index.html`：Outfit → Newsreader 襯線字體；📊 emoji favicon → 自製青藍漸層 SVG 趨勢線標誌；版本 v1.0.0 → v1.1.0。
   - `js/chartRenderer.js`：色盤移除紫色 `#8b5cf6`（AI 味典型色），改青藍領軍 `['#2f7fe0', '#10b981', '#d98e2b', '#3ec7d8', '#e87966']`；圖表標題字體、文字色、tick 色對齊新設計系統。
2. **Lucide 圖標系統 (Tool-Calling 選型)**：
   - 依 Tool-Calling 檢索結果選用 `lucide`（78% 匹配，細描邊風格契合去 AI 味目標；排除 Heroicons 因禁用場景標註「非 Tailwind 用戶體驗最佳」）。
   - 替換 21 處 Material Icons Round → `<i data-lucide="...">`，移除 Material Icons 字體載入。
   - `js/app.js`：主題切換改為切換 `data-lucide` 屬性（moon/sun）+ `lucide.createIcons()`，CDN 載入失敗時 no-op 漸層降級。
   - `js/chartRenderer.js`：空狀態圖示同步替換並觸發 createIcons。
   - `css/style.css`：Lucide 統一尺寸規則（logo 30px / 上傳區 44px / 卡片 24px / 按鈕 18px）。
3. **全量清理**：
   - 移除 `.github/workflows/jules.yml`（外部 Jules agent 工作流，已不使用）。
   - 移除未使用 CSS 類別 `.chart-area`（經全類別比對驗證，僅此一項未使用）。
   - 移除本地空目錄 `assets/`（git 未追蹤，無歷史影響；deploy.yml 條件複製邏輯不受影響）。
   - 驗證 `excelParser.js` 9 個匯出方法全數被引用、`chartRenderer.js` 4 個匯出方法全數被引用、app.js 無死函數（grep 逐函數比對）。
4. **文件同步**：
   - `README.md`：視覺風格章節更新為「奶油紙 × 青藍漸層」設計系統、字體體系（Newsreader/Inter/Lucide）、技術規格新增 Lucide、專案結構移除 `assets/`、功能矩陣新增高級感設計系統項目。
   - `TASKS.md`：新增 1.7「高級感設計系統 (v1.1.0)」完成清單，更新日期與狀態。
   - `wiki/`：兩個 VBA 參考巨集檔案補充分類標頭（Excel VBA 參考巨集 / Legacy Reference，標明 Web 版取代關係）。

**結果與驗證**：
1. 所有清理不影響現有功能運作（未改動任何業務邏輯，JS 語法檢查 `node --check` 全數通過）。
2. 設計系統落地完成，暗/亮主題同步。
3. 文件與程式碼邏輯一致（MECE）。

---

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
