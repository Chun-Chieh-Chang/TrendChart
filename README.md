# Excel TrendChart Pro - 專業趨勢分析與工業級數據工作台

基於 **MECE 原則** (Mutually Exclusive, Collectively Exhaustive) 與「**精密儀表與工業級數據工作台 (Precision Instrument & Modern Industrial Workbench)**」規範建構的高階數據分析工具，確保功能邊界清晰、架構健壯且具備卓越的使用者體驗。

---

## 核心分析能力 (Core Analysis Capabilities)

本工具專為精密製造與品質控管設計，具備以下核心分析優勢：

- **跨工作表縱向拼接 (Vertical Concatenation)**：透過「按住 Ctrl 多選」技術，可將分佈在不同分頁（如：每日報表、不同機台）但結構相同的數據即時整合成單一連續時序，實現跨批次的長期趨勢追蹤。
- **多維度欄位橫向對比 (Horizontal Comparison)**：支援在同一張圖表中選取多個 Y 軸欄位，快速判斷不同工藝參數間的波動關聯性。
- **高精度品質指標引擎 (Precision SPC)**：內建自動化統計模型，即時計算 Ca、Cp、Cpk、Ppk 指標，支援至小數點後 4 位精確度，並依據能力等級自動進行顏色標記（優/良/常/劣）。
- **雙 Y 軸偏差視覺化 (Target Deviation)**：不僅顯示絕對數值，更透過次座標軸自動換算「相對於目標值 (Target) 的偏差百分比 (%)」，一眼看出製程偏移程度。
- **雙 X 軸多維度時序分析 (Dual X-Axis)**：支援底部主 X 軸與頂部副 X 軸雙重標註（如時間 + 批號），並採用高對比交替色階與字重強化辨識度。
- **智慧型配置持久化 (Intelligent State Persistence)**：具備欄位名稱自動匹配技術。當更換 Excel 檔案或切換數據源時，系統自動記憶並套用先前的 X/Y 軸設定與篩選條件，無須重複操作。

---

## 1. 產品組成 (Product Architecture) - [相互獨立，完全窮盡]

### 1.1 數據輸入層 (Input Layer)
- **多格式解析**：支持 `.xlsx` 與 `.xls` 檔案格式。
- **異質數據選取**：個別工作表或多工作表 (Multi-sheet) 數據拼接。
- **狀態偵測**：自動識別欄位類型（數值 vs 類別 vs 時間格式）。

### 1.2 處理運算層 (Process Layer)
- **統計引擎**：計算 Ca, Cp, Cpk, Ppk 與三種標準差 (Within/Between/Overall)，支援四位小數精確度。
- **智慧規格提取**：自動在篩選後的有效數據中搜尋首筆數值作為 Target/USL/LSL，確保動態同步。
- **全方位持久化**：深度配置持久化（佈局設定、控制線開關、數據篩選條件、軸向配置），跨分頁/跨工作表自動回復。
- **過濾引擎**：多維度動態篩選，支援關鍵字匹配搜尋，自動儲存篩選狀態。
- **穩定性保障**：Plotly 渲染安全性檢查與異步同步邏輯。

### 1.3 表現輸出層 (Presentation Layer)
- **視覺化分析**：互動式趨勢圖 (Trend) 與**常態分佈分析 (Distribution)**，包含直方圖疊加、常態曲線、Sigma 標記、規格線與管制界限色帶。
- **管制線控制**：支援 Target, USL/LSL, UCL/LCL 以及**管制中心線 (CL)** 的獨立顯示/隱藏開關，兩張圖表同步受控。
- **多欄位對比**：常態分佈圖支援多 Y 欄位同時繪製曲線（直方圖預設隱藏避免雜亂），管制界限不受欄位數量限制。
- **X 軸智慧範圍**：常態分佈圖自動擴展 X 軸範圍包含所有參考線（Target/USL/LSL/UCL/LCL）並加入 5% 邊距，防止標線被裁切。
- **精密儀表視覺系統**：採用**冰川工作台底色 (`#f1f5f9`) × 純白卡片 (`#ffffff`) × 鈷藍飾條 (`#0284c7`) × 硬體綠色脈衝呼吸燈 (`pulseGreen`)**，提供專注純粹的工業級數據體驗。
- **高效能模式**：支援 WebGL (scattergl) 加速渲染、大數據表格預覽開關、以及增量懶加載 (Lazy Load)。
- **數據輸出**：PNG 圖表匯出與純數據 Excel/CSV 導出。

---

## 2. 功能矩陣 (Functional Matrix)

| 類別 | 功能項目 | 說明 |
| :--- | :--- | :--- |
| **數據管理** | 拖放上傳 | 簡化檔案導入流程，即時解析。 |
| | 工作表拼接 | 支持按住 Ctrl 同時載入多個工作表合併時序。 |
| **參數設定** | 智慧規格 (Spec) | 自動搜尋篩選結果中首筆有效數字作為 Target/USL/LSL。 |
| | **記憶決策** | X 軸時間格式勾選後自動記憶，更換欄位不重置。 |
| | 軸向記憶 | 紀錄 X/Y 軸欄位，換表或重整後自動回復。 |
| **品質指標** | 能力分析 | 自動計算關鍵品質指標 (Ca, Cp, Cpk, Ppk) 支援 4 位精度。 |
| | 管制界限 | 基於移動極差與組內變異計算 UCL / LCL / CL 管制界限。 |
| **數據篩選** | 匹配搜尋 | 篩選下拉選單支援關鍵字搜尋，快速鎖定特定批次。 |
| | **狀態持久化** | **自動保存篩選條件**，切換同格式檔案時無需重複設定。 |
| | 重置功能 | 一鍵清除所有篩選條件與持久化狀態。 |
| **效能優化** | GPU 加速 | 大量數據點自動啟用 WebGL 渲染，縮放不卡頓。 |
| | 預覽控制 | 可關閉數據表格，並採增量渲染節省記憶體，設定自動保存。 |
| **圖表視覺** | **開關控制** | **Target / Spec / Control Limits (包含 CL) 可獨立開啟或關閉**。 |
| | 雙 Y 軸分析 | 顯示對比目標值的偏差百分比 (%)。 |
| | 異常點高亮 | 超出規格自動高亮為警示紅點 (`#dc2626`)。 |
| | **雙 X 軸色階** | 主軸與副軸文字交替採用高對比深色階（深石墨藍/深鈷藍 vs 深翡翠綠/靛青藍）。 |
| | **精密儀表風格** | 冰川工作台、精密線框 (`#cbd5e1`)、5px 鈷藍飾條、綠色即時呼吸燈 (`pulseGreen`)。 |

---

## 3. 技術規格 (Technical Specifications)

- **前端核心**：JavaScript ES6+ (Vanilla / Zero Framework Overhead)。
- **持久化機制**：**Browser LocalStorage API** (Layout & Filters configuration)。
- **渲染技術**：Plotly.js (支援 **scattergl** 硬體加速與多座標軸同步)。
- **圖標系統**：**Lucide** (細描邊 SVG 圖標，統一尺寸規範)。
- **表格性能**：IntersectionObserver API (增量區域渲染)。
- **Excel 處理**：SheetJS (CellDates/Raw Data 深度最佳化)。
- **公式渲染**：KaTeX (LaTeX 品質指標數學公式浮動提示)。

---

## 4. 操作手冊 (Operational Logic)

1. **導入 (Upload)**：將 Excel 拖入上傳區並選擇工作表（可 Ctrl 多選拼接）。
2. **設定 (Configure)**：決定底部主 X 軸、頂部副 X 軸與 Y 軸數據欄位，勾選時間格式可自動排序。
3. **規格 (Spec Limits)**：手動輸入或由欄位下拉選取 Target/USL/LSL。
4. **篩選 (Refine)**：利用側邊欄動態搜尋並選取特定條件，上方指標與表格即時同步。
5. **分析 (Analysis)**：觀察自動計算的 Ca/Cp/Cpk/Ppk、管制界限 (UCL/LCL) 與常態分佈曲線。
6. **導出 (Export)**：一鍵下載高品質 PNG 圖表或篩選後 CSV 數據。

---

## 5. 專案結構 (Project Structure) - [MECE 原則實作]

本專案採模組化目錄結構，確保功能邊界清晰：

- **`.github/workflows/`**：自動化 CI/CD 配置，支援 GitHub Actions 一鍵部署（靜態資源部署：`index.html` + `css/` + `js/` + `wiki/`）。
- **`css/`**：視覺風格定義（精密儀表與工業級數據工作台設計系統，單一高對比風格）。
- **`js/`**：核心邏輯層（零依賴、純原生 ES6+ 模組）。
  - `app.js`：UI 控制器、狀態管理與持久化（LocalStorage）。
  - `chartRenderer.js`：Plotly 渲染引擎（雙軸趨勢圖 + 常態分佈圖 + PNG 匯出）。
  - `excelParser.js`：數據解析（SheetJS）與完整 SPC 統計引擎（Ca/Cp/Cpk/Ppk、UCL/LCL/CL）。
- **`wiki/`**：知識庫，包含 Excel VBA 參考巨集（常態分佈分析、規格外數據高亮）。
- **`index.html`**：應用程式進入點與工作台佈局定義（SPA 結構）。
- **`README.md`**：專案說明與開發規範（本文件）。
- **`TASKS.md`**：開發進度與任務追蹤清單。
- **`DEV_LOG.md`**：開發歷程記錄與問題 RCA。

---

## 6. 資料安全與隱私 (Data Security & Privacy)

本工具高度重視企業數據保密需求，採用 **100% Client-Side** 技術架構：

- **靜態本地解析**：所有 Excel 解析與統計運算均在您的個人電腦瀏覽器中執行，數據不經過任何伺服器。
- **無雲端存儲**：工具不會上傳、記錄或備份您的任何原始數據或分析結果。
- **離線支援**：支援在無網路環境下操作（離線使用），完全杜絕數據外洩風險，符合廠區資訊安全控管需求。

---

## 7. 開發規範與專案準則 (Development Standards)

本專案遵循 **Antigravity 專案全局規範**，確保開發品質與視覺一致性：

### 7.1 開發跑通確認原則 (SOP)
- **精準修改**：僅針對必要部分進行修訂，避免不必要的邏輯變動。
- **運行測試**：聲明完成前必須透過瀏覽器開發者工具完成實際環境測試，確保功能正確且無 Console 錯誤。
- **詢問與推送**：測試成功後，應先向使用者回報測試結果並詢問確認，獲得許可後方可執行 `git push`。

### 7.2 UI/UX 與視覺設計規格
- **訊息密度**：維持高訊息密度設計，透過 **字體比例尺 (Typography Scale)** (Hero, Primary, Secondary, Micro) 明確區分資訊層級。
- **視覺風格**：全站套用 **精密儀表與工業級數據工作台 (Precision Instrument Workbench)**：`#f1f5f9` 冰川工作台底色、`#ffffff` 純白面板卡片、`1px solid #cbd5e1` 精密線框、側邊欄頂部 `5px solid #0284c7` 鈷藍飾條與 `@keyframes pulseGreen` 綠色脈衝呼吸燈。
- **微動效規範**：主色與次要按鈕使用 `0.12s cubic-bezier(0.16, 1, 0.3, 1)` 俐落過渡。
- **字體體系**：
  - **原生堆疊**：`var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)`，避免外部字體加載造成的排版位移 (Reflow/CLS)。
  - **數值指標**：統一啟用 `font-variant-numeric: tabular-nums`，保證數據對齊。

### 7.3 技術與溝通
- **技術標準**：全站 JavaScript 符合 **ES6+** 規範。
- **邏輯原則**：所有檔案組織與代碼整合遵循 **MECE 原則**。
- **語言規範**：專案說明與溝通統一使用 **繁體中文**。

---
*Created by Chun-Chieh-Chang*
