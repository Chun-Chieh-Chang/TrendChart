# Development Log (SkillsBuilder Mode)

## 2026-09-22
**任務目標 (標籤位置切換 & 數據預覽移除 & 全量清理 - v1.3.1)**：
1. 新增圖表限制線標籤左/右側位置切換功能，解決標籤遮擋數據點問題。
2. 移除數據預覽 Table UI（含 DOM、CSS、JS、CSV 匯出），精簡主介面。
3. 全量代碼盤點：零 orphan HTML ID、零 unused CSS class、移除死函數 `formatValue`。
4. 同步更新 DEV_LOG.md、TASKS.md、README.md 至 v1.3.1。
5. 建立 Git 還原基準點並推送至 `origin/main`。

**問題原因分析 (RCA)**：
1. **標籤遮擋問題**：Plotly annotation 預設固定置於圖表右側 (`x: 1, xanchor: 'right'`)，當數據點群聚於右端時，標籤覆蓋最後幾個點。
2. **UI 雜訊**：數據預覽 Table 佔用主畫面下方大量空間，對重度圖表分析用戶而言屬冗餘元素；移除後介面更聚焦於圖表與統計指標。
3. **死碼遺留**：`formatValue` 函式唯一呼叫者 `renderTableBatch` 在移除預覽 Table 時已刪除，但函式本身未同步清理。

**矯正與預防措施 (CAPA)**：
1. **標籤位置切換**：在 `specs.labelSide` 新增 `'left'|'right'` 選項，`addLimitLine()` 根據此值動態設定 `x: 0/1` 與 `xanchor: 'left'/'right'`；左側模式同步擴展 `margin.l: 100` 防止標籤被裁切；切換即時重繪無需重載數據。
2. **完整移除數據預覽**：採「先確認所有呼叫點，再一次性刪除」策略，共清理 11 處引用（DOM 查詢、事件監聽、狀態變數、函式定義、config 持久化欄位、resetApp 清空邏輯）。
3. **死碼杜絕**：引入 PowerShell 交叉比對腳本，驗證所有 ExcelParser/ChartRenderer 匯出方法均有實際呼叫者。

**執行內容 (Do & Check)**：
1. **`index.html`**：
   - 新增「標籤位置 ← 左側 / 右側 →」分段切換按鈕（`#label-side-toggle`）於佈局設定區，緊接管制界限開關之後。
   - 完整移除 `<!-- Table Section -->` div（含標題、匯出 CSV 按鈕、table DOM）。
   - 移除 `toggle-preview` checkbox。
2. **`css/style.css`**：
   - 新增 `.label-side-control`、`.label-side-toggle`、`.label-side-btn`、`.label-side-btn.active` 樣式（segmented button 設計，激活狀態 cobalt blue `#0284c7`）。
   - 整體移除 Table & Data Preview CSS 區塊（`table-container`/`table-wrapper`/`table`/`th`/`td`/`tr:hover`，共 ~45 行）。
3. **`js/app.js`**：
   - 新增 `labelSide` 狀態變數（預設 `'right'`）與 `label-side-toggle` 點擊事件（切換 active 狀態並重繪圖表）。
   - `specs` 物件新增 `labelSide` 欄位，傳入兩處 `renderChart()`、`updateStats()` 中的 `specs` 物件。
   - 移除 `togglePreview`、`tableHead`、`tableBody` DOM 變數。
   - 移除 `tablePageSize`、`tableCurrentIndex`、`tableObserver` 狀態變數。
   - 移除 `saveLayoutConfig`/`loadLayoutConfig` 中的 `preview` 欄位。
   - 移除 `togglePreview.addEventListener` 事件綁定。
   - 移除 `resetApp` 中的 `tableHead.innerHTML`/`tableBody.innerHTML`/`table-count` 清空邏輯。
   - 移除 `updateTable()` 與 `renderTableBatch()` 函式。
   - 移除 CSV 匯出事件監聽（`export-csv`）。
4. **`js/chartRenderer.js`**：
   - `addLimitLine()` 新增 `isLabelLeft` 常數（讀取 `specs.labelSide`），動態設定 annotation 的 `x` 座標與 `xanchor`。
   - layout `margin` 根據 `isLabelLeft` 自動調整：左側時 `l: 100, r: 40`；右側時 `l: 60, r: 80`。
5. **`js/excelParser.js`**：
   - 移除 `formatValue` 函式定義（12 行）與 return 物件中的對應匯出項。

**確效測試 (Check)**：
- `node --check` 三支 JS 全數 PASS（app.js、chartRenderer.js、excelParser.js）。
- HTML ID vs app.js 交叉比對：51 個 ID 全數有效，零 orphan。
- CSS class 交叉比對：69 個 class 全數在 HTML/JS 中有對應引用，零 dead class。
- ExcelParser 8 個匯出方法全數有呼叫（移除 `formatValue` 後）。
- ChartRenderer 4 個匯出方法全數有呼叫。
- 瀏覽器回歸測試：零 Console 錯誤，頁面正常載入，佈局設定區「標籤位置」切換按鈕渲染正確。

---

## 2026-09-02
**任務目標 (Codebase Cleanup & Sidebar Interaction Enhancement - v1.3.0)**：
1. 全面盤點死碼、未定義 CSS 變數與 orphaned 資源，執行手術刀式修復。
2. 實現右側邊欄互動式收合展開功能（Peek 預覽條 + 平滑過渡 + 編輯狀態保護）。
3. 消除 `updateStats()` 與 `renderChart()` 間的統計數據重複計算。
4. 同步更新 DEV_LOG.md、TASKS.md 至 v1.3.0。
5. 清理 Git 暫存狀態檔案（REBASE_HEAD、.swp）。

**盤點發現與修復 (RCA & Fixes)**：
1. **死碼移除**：
   - 刪除 `app.js` 中無效的 `themeToggle` 事件監聽器（`#theme-toggle` 按鈕已在 v1.2.0 移除，此 JS 殘留未清）。
   - 刪除 `style.css` 中無用的 `.summary-card.system-card` 規則（無 HTML 元素使用此類別）。
2. **未定義 CSS 變數修復（功能性 Bug）**：
   - `var(--amber)` → `var(--status-amber)`、`var(--green)` → `var(--status-green)`、`var(--blue)` → `var(--user-cobalt)`、`var(--red)` → `var(--system-red)`
   - 影響範圍：Ca/Cp/Cpk/Ppk 品質指標色碼標示、日期格式偵測提示字色。此前所有色碼均靜默失效。
3. **缺失 CSS 補完**：
   - 新增 `.pulse-hint` 類別與其 `@keyframes pulseHint` 動畫，使日期偵測提示有正確的閃爍視覺反饋。
4. **效能優化**：
   - `updateStats()` 改為接受可選 `stats` 參數；`renderChart()` 中將已算好的 `currentStats` 直接傳入，避免二次計算。
5. **Sidebar 互動功能**：
   - 新增三階段狀態機：`collapsed`（0px）→ `peek`（48px 預覽條）→ `expanded`（320px 完整面板）。
   - 滑鼠 proximity 偵測（80px 範圍）觸發 Peek；游標進入 sidebar 範圍自動展開。
   - 編輯狀態保護：聚焦 sidebar 內表單控件時保持展開，失焦後 600ms 寬限期再收合。
   - 觸控支援：右邊緣點擊觸發展開；`localStorage` 持久化收合狀態。
   - 所有動畫使用 `--transition-smooth`（350ms cubic-bezier）確保流暢。
6. **文件清理**：
   - 移除 `app.js` 中過時的註解（"Always set checkboxes to false..."、"Keep the previous state..."）。
   - 刪除 `.git/REBASE_HEAD`（殘留 rebase 標記）與 `.git/.COMMIT_EDITMSG.swp`（Vim swap 檔）。

**執行內容 (Do & Check)**：
1. **`css/style.css`**：新增 `--transition-smooth` 變數、`.sidebar.peek` 狀態、`.sidebar-trigger` 把手樣式、`.pulse-hint` 動畫；刪除 `.summary-card.system-card`。
2. **`index.html`**：新增 `<div id="sidebar-trigger">` 觸發把手。
3. **`js/app.js`**：
   - 移除 `themeToggle` 死碼區塊。
   - 修復 7 處未定義 CSS 變數引用。
   - 修復 3 處過時註解。
   - `updateStats(stats?)` 接受可選參數；`renderChart()` 傳入 `currentStats` 避免重複計算。
   - 新增完整的 sidebar 互動邏輯（proximity/peek/expand/edit-state/resize）。
4. **Git 清理**：刪除 `.git/REBASE_HEAD` 與 `.git/.COMMIT_EDITMSG.swp`。
5. **確效測試**：
   - `node --check` 驗證 `app.js`、`chartRenderer.js`、`excelParser.js` 語法全數通過。
   - 瀏覽器實測：色碼標示正常（Ca/Cp/Cpk/Ppk 依閾值顯示綠/藍/黃/紅）、pulse-hint 動畫正常、sidebar Peek/Expand/Collapse 流暢、編輯狀態保護有效、localStorage 持久化正常。

---

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
7. **Git 基準點**：`e351da7` (`feat(ui): refactor to precision instrument workbench & optimize code/docs (v1.2.0)`) 已成功推送至遠端 `origin/main`。

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
