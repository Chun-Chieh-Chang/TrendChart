# Excel TrendChart Pro - 專業趨勢分析解決方案

基於 **MECE 原則** (Mutually Exclusive, Collectively Exhaustive) 建構的數據分析工具，確保功能不重疊且無遺漏。

---

## 1. 產品組成 (Product Architecture) - [相互獨立，完全窮盡]

### 1.1 數據輸入層 (Input Layer)
- **多格式解析**：支持 `.xlsx` 與 `.xls` 檔案格式。
- **異質數據選取**：各別工作表或多工作表 (Multi-sheet) 數據拼接。
- **狀態偵測**：自動識別欄位類型（數值 vs 類別）。

### 1.2 處理運算層 (Process Layer)
- **統計引擎**：計算 Ca, Cp, Cpk, Ppk 與三種標準差 (Within/Between/Overall)，支援四位小數精確度。
- **持久化機制**：配置持久化（工作表、軸向、篩選條件），避免重複設定。
- **過濾引擎**：多維度動態篩選，同步更新計算與圖表。
- **穩定性保障**：Plotly 渲染安全性檢查與異步同步邏輯。

### 1.3 表現輸出層 (Presentation Layer)
- **視覺化分析**：互動式趨勢圖 (Trend) 與常態分佈分析 (Distribution)。
- **交互性能**：大數據量無限捲動 (Infinite Scrolling) 表格預覽。
- **數據輸出**：PNG 圖表匯出與純數據 Excel/CSV 導出。

---

## 2. 功能矩陣 (Functional Matrix)

| 類別 | 功能項目 | 說明 |
| :--- | :--- | :--- |
| **數據管理** | 拖放上傳 | 簡化檔案導入流程。 |
| | 工作表拼接 | 支持按住 Ctrl 同時載入多個工作表。 |
| **參數設定** | 軸向記憶 | 紀錄 X/Y 軸欄位，換表不跑掉。 |
| | 目標值 (Target) | 支援中心線標示與長-短-長樣式提示。 |
| | 規格限制 (Spec) | 支持手動輸入或從欄位讀取 USL/LSL。 |
| **品質指標** | 能力分析 | 自動計算關鍵品質指標 (Cpk, Ppk) 支援 4 位精度。 |
| | 管制界限 | 基於組內變異計算 ±3σ 管制界限。 |
| **圖表視覺** | 雙 Y 軸分析 | 顯示對比目標值的偏差百分比 (%)。 |
| | 異常點高亮 | 超出規格自動變色 (深色版:黃色 / 淺色版:紅色)。 |
| **持久化** | 狀態維持 | 篩選與配置在切換視圖時持續鎖定。 |

---

## 3. 技術規格 (Technical Specifications)

- **前端核心**：JavaScript ES6+ (Vanilla / No Framework Overhead)。
- **數據庫模擬**：In-memory JSON Objects for high-speed filtering.
- **繪圖技術**：Plotly.js (WebGL support for massive data).
- **Excel 處理**：SheetJS (CellNF/Text/Dates optimization)。

---

## 4. 操作手冊 (Operational Logic)

1. **上傳 (Upload)**：將 Excel 投入。
2. **選取 (Configure)**：選擇工作表 -> 決定 Y 軸 (數值) 與 X 軸 (時間/序號)。
3. **精煉 (Refine)**：利用側邊欄進行篩選。
4. **解析 (Analysis)**：觀察統計卡片與常態分佈，調整規格上限/下限。
5. **提取 (Extract)**：導出報表或圖表。

---

## 5. 開發規範與專案準則 (Development Standards)

本專案遵循 **Antigravity 專案全局規範**，確保開發品質與視覺一致性：

### 5.1 代碼跑通確認原則 (SOP)
- **精準修改**：僅針對必要部分進行修訂，避免不必要的邏輯變動。
- **運行測試**：聲明完成前必須進行實際環境測試（如透過瀏覽器驗證）。
- **推送確認**：所有變動在交付前應確認是否需推送至 GitHub。

### 5.2 UI/UX 與視覺設計規格
- **訊息密度**：維持高訊息密度設計，確保一目了然。
- **視覺風格**：全元件採用 **玻璃擬態 (Glassmorphism)** 風格（背景模糊、半透明邊框）。
- **字體體系**：
  - **中文**：微軟正黑體 (Microsoft JhengHei)
  - **英文/數字**：Times New Roman
  - **範例**：`font-family: "Times New Roman", "Microsoft JhengHei", sans-serif;`

### 5.3 技術與溝通
- **技術標準**：全站 JavaScript 符合 **ES6+** 規範。
- **邏輯原則**：所有檔案組織與代碼整合遵循 **MECE 原則**。
- **語言規範**：專案說明與溝通統一使用 **繁體中文**。

---
*Created by Chun-Chieh-Chang*
