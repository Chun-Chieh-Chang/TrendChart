# Development Log (SkillsBuilder Mode)

## 2026-10-01 (v1.10.1)
**任務目標 (X 軸刻度同色相雙色階 - v1.10.1)**：
1. 使用者需求：截圖中主 / 副 X 軸刻度文字配色是否有更美觀的選擇。
2. 診斷：交替金色 `#b08820` / `#d8b955` 為 v1.7.x 黃暖主題殘留，v1.10.0 轉淡綠主題時未同步。

**設計解析 (Design Analysis)**：
- **舊配色問題**：主軸 `#35473c` ↔ `#b08820`（金 3.00:1 未達 AA）、副軸 `#6b7d72` ↔ `#d8b955`（淺金 **1.74:1** 嚴重不可讀）；492 筆密集旋轉標籤下金色交錯成「金色直條紋」噪感。
- **三案評選**：A 主題金一致（`#8f6c14` 交替，保留 accent 節奏）/ B 同色相雙色階（綠灰家族，最沉穩融合）/ C 單色 + 粗體分組（最乾淨但分組弱）；以四方案並排預覽頁截圖比選，使用者採 **B**。
- **功能不犧牲**：每 2 個刻度換色 + 600/700 字重的批次交替分組邏輯原樣保留，僅替換色票——交替是功能性批次判讀設計，不因換色移除。

**色票變更 (Token Delta)**：

| 用途 | v1.10.0 | v1.10.1 |
| :--- | :--- | :--- |
| 主 X 軸交替色 | `#35473c` ↔ `#b08820`（綠灰 / 中金） | `#35473c` ↔ **`#55695e`**（深綠灰 / 中綠灰） |
| 副 X 軸交替色 | `#6b7d72` ↔ `#d8b955`（次綠灰 / 淺金） | **`#46584d`** ↔ `#6b7d72`（綠灰 / 次綠灰） |

**執行內容 (Do & Check)**：
1. **`js/chartRenderer.js`**：兩處 `ticktext` 交替色陣列與註解（主軸、副 X 軸各一）。
2. **`index.html`**：版本字串 `v1.10.1 • Green Inset Focus`。
3. **文檔同步**：TASKS `### 1.21`、README 核心能力「雙 X 軸多維度時序分析」與功能矩陣「雙 X 軸色階」。
4. **驗證頁** `.tmp_tick_test.html`（64 筆 × 雙 X 軸 mock 資料，卡片底 `#edf7ee`）實圖截圖後刪除；四方案比選頁 `.tmp_axis_preview.*` 同步刪除。

**確效測試 (Check)**：
- **實圖驗證（headless 截圖）**：主軸深綠灰 / 中綠灰交替、副軸綠灰 / 次綠灰交替清楚可辨，`#b08820` / `#d8b955` 金色噪感消失，批次分組仍可辨。
- **對比度（vs `#edf7ee`）**：主軸 9.04 / **5.36**、副軸 **6.93** / 3.99——四色全數 ≥ 3.99，舊淺金 1.74:1 ✗ 與中金 3.00:1 ✗ 問題消除。
- **殘留檢查**：`Select-String` 掃 `js/*.js`，`#b08820` / `#d8b955` 零殘留（favicon 金漸層為 v1.10.0 刻意保留，不在本次範圍）。
- `node --check` 三支 JS 全數 PASS；分組邏輯 / 字重 / 版面零變動。

**已知事項**：
- 副軸較淺色 `#6b7d72` 對比 3.99:1，略低於 WCAG AA 小字 4.5:1——與全站次要文字 token 同值，沿用現行標準。

## 2026-10-01 (v1.10.0)
**任務目標 (鵝黃改淡綠漸層 - v1.10.0)**：
1. 使用者需求：鵝黃色想改為淺綠色漸層；顏色盡量淡化但仍可識別。
2. 版面、元件結構、圓角、動效與所有判讀語意色一律不動。

**設計解析 (Design Analysis)**：
- **漸層放在頁面底層**：`body` 與 `.app-container` 改用新 token `--bg-gradient`（145° 對角、4 段淡綠）；元件（卡片 / 側邊欄 / 輸入框）仍用 flat 的 `--surface`。好處：漸層的「綠感」由背景承擔，元件則靠 flat 色 + 光影保持可辨，且**避免漸層被各元件拉伸而產生色帶 (banding)**。
- **淡但可識別的量化**：漸層四色階的 `G − R` 介於 **7 → 20**（`#dcf0e1` G−R=20、`#e3f2e6` 15、`#eef8f0` 10、`#f3faf4` 7），L 90–95——淡，但確實是綠而非灰白。
- **陰影 / 高光必須一起轉綠**：暖褐陰影放在綠底會顯髒。綠灰 `rgba(158, 186, 166, .6)` 實測深度比 **1.450**（v1.6.0 基準 1.446）、亮側高光差回到 `17/8/16`（v1.9.0 曾因底色逼近白色而降至 `3/5/10`）——立體感完整復原。
- **文字轉綠中性灰**：原暖褐灰配綠底不協調，改 `#35473c / #6b7d72 / #8b9b91`，對比度幾乎持平（9.09 → 9.04:1）。
- **刻意保留（把關）**：
  - **金色主色 `#8f6c14` 不改綠**：若主色也變綠，將與語意綠 `#3fa96b`（Target 線 / ONLINE / Cpk「優」）混淆；「綠底 + 深金」亦是自然對比組合。
  - 語意色（綠 / 焦橙 / 紅）、藍色資料色盤、超規格紅點、限界線樣式、`0.75 + 3px,3px` 虛線全數維持。

**色票變更 (Token Delta)**：

| 用途 | v1.9.0（鵝黃） | v1.10.0（淡綠） |
| :--- | :--- | :--- |
| 頁面背景 | `#fcfaf2`（flat） | **`linear-gradient(145deg, #dcf0e1 0%, #eef8f0 42%, #e3f2e6 74%, #f3faf4 100%)`** |
| `--surface` / `--surface-deep` | `#fcfaf2` / `#f7f2e3` | `#edf7ee` / `#e5f1e7` |
| `--shade` / `--shade-soft` | `rgba(193, 182, 153, …)` | `rgba(158, 186, 166, …)` |
| `--light` | `rgba(255, 255, 253, .95)` | `rgba(255, 255, 255, .95)` |
| `--text-primary / secondary / muted` | `#4c4536` / `#83795f` / `#a49a82` | `#35473c` / `#6b7d72` / `#8b9b91` |
| `--divider` | `rgba(76, 69, 54, .08)` | `rgba(53, 71, 60, .08)` |
| modal 遮罩 / checkbox 圓鈕 / 捲軸 | `rgba(252,250,242,.72)` / `#d3cdb8` / `#c8c1ac` | `rgba(237,247,238,.72)` / `#c9d4c9` / `#b4c2b4` |
| 圖表標註框底 / 框線 / 零線 | `rgba(252,250,242,.92)` / `#dedaca` | `rgba(237,247,238,.92)` / `#cddacd` |
| 圖表網格 / 標題 / 軸文字 | `rgba(76,69,54,…)` / `#4c4536` / `#83795f` | `rgba(53,71,60,…)` / `#35473c` / `#6b7d72` |
| 主色 `--accent`、語意色、藍色資料盤、OOS 紅 | — | **維持不變** |

**執行內容 (Do & Check)**：
1. **`css/style.css`**：`:root` 色票全換（見上表）＋新增 `--bg-gradient`；`body` / `.app-container` 改用漸層；chevron SVG stroke、`.card-icon.cyan` 底色、公式提示底 / 字色隨新色。
2. **`js/chartRenderer.js`**：僅圖表 chrome（標註框底 / 框線 / 零線 / 網格 / 標題 / 軸文字 / 圖例 / 資料點描邊）；資料色盤與限界線未動。
3. **`index.html`**：版本字串 `v1.10.0 • Green Inset Focus`；favicon 為金色主色故僅更正註解（原寫 Warm Goose Yellow）。
4. **臨時驗證頁** `.tmp_green_test.html`（40 筆 × 雙欄位 + 5 個超規格點）實測後刪除。

**確效測試 (Check)**：
- **實圖驗證（headless 截圖 ×2）**：(1) 主畫面——淡綠對角漸層清晰可辨、卡片 raised / inset 光影不變、金色主色與綠底協調、版本字串 `v1.10.0 • Green Inset Focus`；(2) 圖表——藍色折線與資料點、紅色超規格點、Target 綠線、USL/LSL 紅虛線、UCL/LCL 焦橙點線在綠底上全數清楚可判讀。
- **深度比 1.450**（基準 1.446）、高光差 `17/8/16`（優於 v1.9.0 的 `3/5/10`）。
- **對比度（實算於 `#edf7ee`）**：主要文字 9.04:1（v1.9.0 為 9.09）、次要 3.99（4.13）、主色 4.43（4.65）、資料藍 4.33（4.55）、語意綠 2.70（2.83）——因綠色吸光底色略暗，各項對比與 v1.9.0 同級。
- `node --check` PASS；版面 / 圓角 / 動效零變動。

**已知事項**：
- 語意綠 `#3fa96b`（Target 線、ONLINE、Cpk「優」）與淡綠底同色系，靠明度差（L45 vs L95）區分，實圖可判讀；若覺得不夠跳，建議壓深至 `#2f8f57`（2.70 → 3.6:1）。
- 漸層只在 `body` / `.app-container`，元件內部為 flat 淡綠——刻意為之，避免色帶。
- 若希望主色也改成綠色，需先解決與語意綠衝突（建議深青 `#1f6b52` 或維持深金）。

---

## 2026-10-01 (v1.9.0)
**任務目標 (鵝黃底色再淡一階 - v1.9.0)**：
1. 使用者回饋：鵝黃色底色能否更淡一點（第二輪調淡）。
2. 僅調亮基底色與其相依的遮罩 / 標註框底色；文字、主色、語意色、陰影、高光與圖表配色一律不動。

**設計解析 (Design Analysis)**：
- 表面色 `#faf7ec`（L95 / S58）→ **`#fcfaf2`**（L97 / S63），WCAG 相對亮度 0.9290 → **0.9548**。
- **陰影不需補償（關鍵）**：raised / inset 暗側的亮度差 = `0.6 × (surface − shade)`，基底越亮該差值反而越大——實測 shade delta 由 `34/39/50` 升至 **`35/41/53`**、深度比 1.434 → **1.456**（v1.6.0 基準 1.446），故 **`--shade` / `--light` 維持原值**（與 v1.7.1 反向需補償的狀況相反）。
- **高光已到達上限**：`--light`（255,255,253 @0.95）對底色的亮度差由 `5/8/16` 縮至 **`3/5/10`**——近白底上「亮側」本就無法再放大，屬亮到極致的必然結果；深度改由暗側與略升的深度比承載。
- 底越亮、文字不變，**對比度全部再擴大**。

**色票變更 (Token Delta)**：

| Token | v1.8.2 | v1.9.0 |
| :--- | :--- | :--- |
| `--surface` | `#faf7ec` | **`#fcfaf2`** |
| `--surface-deep` | `#f6f1df` | `#f7f2e3` |
| modal 遮罩 | `rgba(250, 247, 236, .72)` | `rgba(252, 250, 242, .72)` |
| Plotly 標註框底色 | `rgba(250, 247, 236, .92)` | `rgba(252, 250, 242, .92)` |
| `--shade` / `--light` | `rgba(193, 182, 153, …)` / `rgba(255, 255, 253, …)` | **維持不變** |

**執行內容 (Do & Check)**：
1. **`css/style.css`**：上表 3 項（表面、深層、modal 遮罩）。
2. **`js/chartRenderer.js`**：標註框底色同步（僅 1 色）。
3. **`index.html`**：版本字串 `v1.9.0 • Warm Inset Focus`。
4. **刻意保留**：陰影 / 高光、文字色、深古金主色、語意色、控制項（checkbox 圓鈕 `#d3cdb8`、捲軸）、藍色資料色盤與 `0.75 / 3px,3px` 虛線設定。

**確效測試 (Check)**：
- headless 實圖驗證（截圖）：底色明顯再淡一階，卡片 raised / inset 光影層次清晰、版面零位移。
- 對比度（實算於 `#fcfaf2`）：主要文字 **9.09:1**（v1.8.2 為 8.85）、次要 4.13:1（4.02）、主色 **4.65:1**（4.53）、焦橙 3.61:1（3.52）、資料藍 **4.55:1**（4.43）。
- 線上驗證（`Invoke-WebRequest` 於 127.0.0.1:8080）：`#fcfaf2`、`#f7f2e3`、`rgba(252, 250, 242, …)` 皆已生效，且無 `#faf7ec` 殘留。
- `node --check` PASS；`--shade` / `--light` token 零變動。

**已知事項**：
- 底色已達 **L97**，與純白的亮度差僅 0.045——**這是「鵝黃」識別度的實用下限**。若還要更淡，建議改走「純白底 + 鵝黃色塊點綴」（標題列 / 選取態 / 圖示底保留鵝黃），否則底色將與白底無從分辨。
- 高光側亮度差已降至 `3/5/10`；底色若再亮，立體感將只能依賴暗側陰影。

---

## 2026-10-01 (v1.8.2)
**任務目標 (虛線連線再細一階 - v1.8.2)**：
1. 使用者需求：改用 `width: 0.75`，並同時縮短虛線段（dash 樣式）。
2. 僅調整趨勢圖資料點連線的線寬與 dash；資料色、點尺寸、限界線、UI 一律不動。

**設計解析 (Design Analysis)**：
- **線寬**：`1` → **`0.75`**（Plotly 支援小數線寬）。HiDPI 上為清晰的 3/4 px 細線；1x 螢幕因反鋸齒會略淡——此風險已於 v1.8.1「已知事項」預告，使用者確認採用。
- **dash 樣式**：Plotly 具名 `'dash'` 約為 6px 實線 / 6px 空白；改用**自訂 px 虛線列表 `'3px,3px'`**（Plotly `line.dash` 支援「px 長度列表」語法），實線段與空白同時縮短一半，配合 0.75 細線形成輕盈細虛線。
- 依舊只動資料連線：常態曲線（1.5）、直方圖外框（1）、USL / LSL / UCL / LCL / CL 全部維持（延續 v1.8.1 決策）。

**執行內容 (Do & Check)**：
1. **`js/chartRenderer.js`**：`line: { width: 1, color: baseColor, dash: 'dash' }` → `line: { width: 0.75, color: baseColor, dash: '3px,3px' }`。
2. **`index.html`**：版本字串 `v1.8.2 • Warm Inset Focus`。
3. **臨時驗證頁**：`.tmp_dash_test.html`（40 筆 + 3 個超規格點，頁面內以 `getComputedStyle` 回報實際渲染值）驗證後刪除。

**確效測試 (Check)**：
- **DOM 實測（`--dump-dom` + `getComputedStyle`）**：資料線 `stroke-dasharray = 3px, 3px`、`stroke-width = 0.75px`、`stroke = rgb(47, 111, 219)`（= `#2f6fdb`）——證明自訂 dash 與 0.75 線寬皆已實際套用，未回退為 solid 或預設 dash。
- **截圖實測（DPR 1 與 DPR 2）**：細虛線清晰可辨、連續性足夠；藍色資料點、3 個紅色超規格點、暖色限界線全數不受影響。
- `node --check` PASS；CSS 零變動，版面零位移。

**已知事項**：
- 0.75px 線在 1x（非 HiDPI）螢幕上偏淡但可辨；若低解析度螢幕覺得吃力，建議 `width: 1` + `dash: '3px,3px'`（線略粗、虛線仍短）。

---

## 2026-10-01 (v1.8.1)
**任務目標 (數據點虛線連線變細 - v1.8.1)**：
1. 使用者需求：圖表中數據點之間的虛線連線能否更細。
2. 僅調整趨勢圖「數據點之間的虛線連線」線寬；資料色、點尺寸、限界線與 UI 一律不動。

**設計解析 (Design Analysis)**：
- 現值 `line.width: 1.5` → **`1`**（1px 髮絲線，減幅 33%）：HiDPI 上為清晰細線，1x 螢幕仍可見。
- **歷史一致性**：2026-07-02 該連線最初即設為 `dash: 'dash'` + `width: 1`（見下方歷史條目），後續重構期間被提高至 1.5；本次等於回到當時的使用者偏好。
- **只動資料連線**：常態分佈圖的常態曲線（實線 `1.5`，屬模型曲線非資料連線）、直方圖外框（`1`）、以及 USL / LSL（`1.5`）、UCL / LCL（`1.5`）、CL（`1`）等判讀基準線全部維持，避免限界線跟著變細而失去份量。

**執行內容 (Do & Check)**：
1. **`js/chartRenderer.js`**：`line: { width: 1.5, color: baseColor, dash: 'dash' }` → `width: 1`。
2. **`index.html`**：版本字串 `v1.8.1 • Warm Inset Focus`。
3. **臨時驗證頁**：`.tmp_line_test.html`（40 筆資料 + 3 個超規格點）實測截圖後刪除。

**確效測試 (Check)**：
- headless 實圖驗證：虛線連線明顯變細且仍連續可辨；資料點維持藍 `#2f6fdb` 與原尺寸；3 個超規格點維持紅色放大；Target / USL / LSL / UCL / LCL 線寬與顏色不變。
- `node --check` PASS；CSS 零變動，版面零位移。

**已知事項**：
- `width < 1`（如 0.75）在 1x 螢幕上會因反鋸齒而偏淡；若還要更細，建議連同 dash 樣式（縮短虛線段）一起調整。

---

## 2026-10-01 (v1.8.0)
**任務目標 (圖表數據改藍色 - v1.8.0)**：
1. 使用者需求：圖表中數據點用藍色，超過限界的點維持用紅色。
2. 僅調整圖表「資料色」（Plotly 系列色盤）；UI 暖色調、限界線與其他語意色一律不動。

**設計解析 (Design Analysis)**：
- 需求本質是「**暖底冷資料**」：UI 維持鵝黃暖色，讓資料本身以冷色（藍）跳出，異常（超出限界）以紅點示警——即 SPC 圖表慣例配色（資料藍、異常紅）。
- **限界線不是資料**：Target / USL / LSL / UCL / LCL 為判讀基準，維持既有語意色（綠 / 紅 / 焦橙）；因此「藍線 = 資料、暖色虛線 = 限界、紅點 = 異常」三者語意不互相干擾。
- **多欄位可比性**：本工具支援同時繪製多個 Y 欄位（核心功能），若所有系列共用同一藍色將無法辨識，故採「**5 階藍色系**」（色相 195°–220°、明度 32–68）：讀起來都是藍色，但彼此可分辨。
- 主藍 `#2f6fdb` 於淡鵝黃底對比 4.43:1（優於 v1.7.x 金色系列首色），折線與資料點清晰。

**色票變更 (Token Delta)**：

| 用途 | v1.7.1 | v1.8.0 |
| :--- | :--- | :--- |
| 系列 1（主資料） | `#8f6c14` | **`#2f6fdb`**（royal blue，4.43:1） |
| 系列 2 | `#d8b955` | `#0f9bd7`（cyan blue） |
| 系列 3 | `#3fa96b` | `#234f9e`（deep navy） |
| 系列 4 | `#c96a1d` | `#6d93c9`（steel blue） |
| 系列 5 | `#a49a82` | `#8a9bb5`（blue gray） |
| 超規格點 | `#e0625b` | `#e0625b`（**維持紅色，不變**） |

**執行內容 (Do & Check)**：
1. **`js/chartRenderer.js`**：`COLOR_PALETTE` 改 5 階藍色系並加註「暖底冷資料」原則；`OOS_COLOR` 維持 `#e0625b`。
   - 涵蓋範圍（皆由 `baseColor` 驅動）：趨勢圖折線與資料點、常態分佈圖直方圖（fill + 外框）、常態曲線、σ 標記。
   - 未動：標題 / 軸文字 / 網格 / 零線 / 標註框（暖色）、Target 綠、USL / LSL 紅、UCL / LCL / CL 焦橙、PNG 匯出白底。
2. **`index.html`**：版本字串 `v1.8.0 • Warm Inset Focus`。
3. **臨時驗證頁**：另建 `.tmp_chart_test.html`，以程式化假資料（40 筆 × 雙欄位、含 5 個超規格點）實測兩張圖並截圖，驗證後刪除（不納入版控）。

**確效測試 (Check)**：
- **實圖驗證（headless 截圖，含真實資料）**：趨勢圖折線與資料點為藍 `#2f6fdb`；超出 LSL / USL 的 5 點為紅 `#e0625b`、尺寸放大且帶白描邊；Target 綠線、USL / LSL 紅虛線、UCL / LCL 焦橙點線、標註標籤暖底全數維持；常態分佈圖直方圖 / 曲線 / σ 標記為藍色系，雙曲線可分辨。
- 對比度（於 `#faf7ec`）：主藍 4.43:1、cyan 2.93:1、navy 7.29:1、steel 2.94:1、blue gray 2.63:1。
- `node --check` PASS；CSS 零變動，版面與光影零位移。

**已知事項**：
- 5 階藍色系在同一張圖 4–5 條曲線時，辨識度仍低於「藍 / 綠 / 橙 / 灰」異色相組合；若實際使用感到吃力，可改為混合盤或再拉開第 4、5 階的明度差。
- 直方圖半透明填色（opacity 0.25）在小圖上偏淡，屬原有設計（避免遮蓋曲線）。

---

## 2026-10-01 (v1.7.1)
**任務目標 (鵝黃再淡一階 - v1.7.1)**：
1. 使用者回饋：鵝黃色應該可以再更淡一點。
2. 僅調亮基底色及其相依的光影色；文字色、主色、語意色與版面一律不動。

**設計解析 (Design Analysis)**：
- 表面色由 `#f7f1dd`（L92 / S62）再淡一階至 `#faf7ec`（L95 / S58），WCAG 相對亮度 0.8791 → 0.9290。
- **深度補償（關鍵）**：基底越淡，同一陰影色混色後越接近底色，深度感會被吃掉。故陰影由 `rgba(197, 186, 155, .6)` 加深至 `rgba(193, 182, 153, .6)`，使「表面 / 陰影有效色」亮度比維持 **1.434**（v1.6.0 為 1.446、v1.7.0 為 1.362），即回到 Inset Focus 原始深度強度。
- **高光補償**：高光改近純白 `rgba(255, 255, 253, .95)`，其對底色的通道差 (5, 8, 16) 與 v1.6.0 的 (5, 8, 18) 幾乎相同；若沿用 v1.7.0 的暖白 (5, 6, 9)，立體感會明顯變平。

**色票變更 (Token Delta)**：

| Token | v1.7.0 | v1.7.1 |
| :--- | :--- | :--- |
| `--surface` | `#f7f1dd` | `#faf7ec` |
| `--surface-deep` | `#f3ecd3` | `#f6f1df` |
| `--shade` / `--shade-soft` | `rgba(197, 186, 155, .6 / .4)` | `rgba(193, 182, 153, .6 / .4)` |
| `--light` | `rgba(255, 253, 245, .95)` | `rgba(255, 255, 253, .95)` |
| modal 遮罩 | `rgba(247, 241, 221, .72)` | `rgba(250, 247, 236, .72)` |
| Plotly 標註框底色 | `rgba(247, 241, 221, .92)` | `rgba(250, 247, 236, .92)` |

**執行內容 (Do & Check)**：
1. **`css/style.css`**：上表 6 項（基底、深層、陰影 ×2、高光、modal 遮罩）。
2. **`js/chartRenderer.js`**：標註框底色同步（僅 1 色）。
3. **`index.html`**：版本字串 `v1.7.1 • Warm Inset Focus`。
4. **刻意保留**：文字色、深古金主色、語意色、checkbox 圓鈕 `#d3cdb8` 與捲軸、零線 / 標註框線 `#dedaca`（於淡底仍有 Δ28 可見度）——控制項可辨識度優先。

**確效測試 (Check)**：
- 對比度（實算，於新表面 `#faf7ec`）：主要文字 **8.85:1**（v1.7.0 為 8.40）、次要 4.02:1（3.82）、主色 4.53:1（4.30）、焦橙 3.52:1（3.34）、綠 2.76:1（2.62）——全面再提升。
- 深度比 1.434（對 v1.6.0 基準 1.446 誤差 < 1%）；高光通道差對齊 v1.6.0。
- `node --check` PASS；headless 截圖確認 raised / inset 層次與版面零位移。

**已知事項**：
- 基底已近暖白（L95），再往上調將失去鵝黃識別度；若還要更淡，建議改走「白色底 + 鵝黃色塊點綴」而非繼續調亮底色。

---

## 2026-10-01 (v1.7.0)
**任務目標 (鵝黃暖色調轉換 - v1.7.0)**：
1. 使用者需求：UI 目前偏藍冷色調，改為偏鵝黃的暖色調，淡淡的顏色即可。
2. 僅調整色彩（Design Tokens 與硬編碼色值），不變更任何版面、元件結構、圓角與互動邏輯。

**設計解析 (Design Analysis)**：
- 冷色調來源：表面色 `#ecf0f5`（H≈213 藍灰）、文字 `#3d4a5c` / `#6b7a90`、主色 `#5b8def`（藍）、陰影 `rgba(163, 177, 198)`。
- 暖色轉換原則：全色系移至鵝黃色相帶（H≈46），表面維持高明度低彩度（淡奶油黃），文字改暖褐灰。
- 光影關係不變：陰影 (shade) 與高光 (light) 仍以「同色相 + 明度差」構成，維持 Inset Focus 的深度邏輯與對比強度（陰影有效色 ΔL 與 v1.6.0 相當）。
- 主色改「深古金 `#8f6c14`」、琥珀語意色 `#d4972f` → 焦橙 `#c96a1d`；兩者以「明度 + 色相」雙軸拉開以確保語意可辨（詳見下節）。
- 語意綠 `#3fa96b`、警示紅 `#e0625b` 維持原值（判讀語意優先於色調統一）。

**辨識度把關 (Semantic Discriminability — 使用者授權由開發端決策)**：
- **問題**：暖色首版（主色 `#b08820` L41 / 琥珀 `#c9762c` L48）兩者明度幾乎相同、色相僅差 16°，Ca / Cpk 的「良」與「尚可」在摘要列並排時易混淆（RGB 距離僅 55）。
- **對策 1｜明度分離**：明度為感知最強區分軸，故將主色壓深至 L32（`#8f6c14`）、琥珀維持中明度 L45（`#c96a1d`）→ 明度差 13 點 + 色相 16°，RGB 距離提升至 69。
- **對策 2｜色相取中**：琥珀色相定於 H27，恰為「金色主色 H43」與「超規格紅 H3」的中點，對兩者同時取最大色相距離（16° / 24°），避免修好「良 vs 尚可」卻讓「尚可 vs 超規格」變難分。
- **對策 3｜對比度**：深古金主色於淡鵝黃底對比由 2.91:1 → **4.30:1**（v1.6.0 冷藍主色為 2.82:1）；焦橙由 3.04:1 → **3.34:1**（v1.6.0 原始琥珀為 2.25:1）。
- **保留決策**：綠 `#3fa96b`（H145）與紅 `#e0625b`（H3 / L62 / 高彩度）維持原值，紅色以「高明度 + 高彩度」與焦橙（L45）明確區隔。
- **副作用管理**：軸標籤交替色仍使用中金 `#b08820`（非深古金主色），避免兩段交替標籤都偏暗而失去交替辨識效果。

**色票對照 (Token Mapping)**：

| Token | v1.6.0（冷藍） | v1.7.0（鵝黃暖） |
| :--- | :--- | :--- |
| `--surface` | `#ecf0f5` | `#f7f1dd` |
| `--surface-deep` | `#e4e9f0` | `#f3ecd3` |
| `--shade` / `--shade-soft` | `rgba(163, 177, 198, .6 / .4)` | `rgba(197, 186, 155, .6 / .4)` |
| `--light` | `rgba(255, 255, 255, .95)` | `rgba(255, 253, 245, .95)` |
| `--text-primary` | `#3d4a5c` | `#4c4536` |
| `--text-secondary` | `#6b7a90` | `#83795f` |
| `--text-muted` | `#8a97aa` | `#a49a82` |
| `--accent` / `--accent-deep` | `#5b8def` / `#4a78d6` | `#8f6c14` / `#75570f` |
| `--accent-soft` | `rgba(91, 141, 239, .14)` | `rgba(143, 108, 20, .16)` |
| `--accent-grad` | `#7a9cc6 → #5b8def` | `#c8a63f → #8f6c14` |
| `--status-amber` | `#d4972f` | `#c96a1d` |

**執行內容 (Do & Check)**：
1. **`css/style.css`**：
   - `:root` Design Tokens 全面轉暖（見上表，含 `--divider` / `--system-red-light` / `--status-amber-light`）。
   - 硬編碼色同步：側邊欄與彈窗標題金線、drop-zone hover、輸入框 focus 與 focus-visible 外框（`rgba(143, 108, 20, …)`）、下拉箭頭 SVG stroke `%2383795f`、checkbox 未選圓鈕 `#d3cdb8`、`.card-icon.cyan` 底色 `rgba(131, 121, 95, .14)`、modal 遮罩 `rgba(247, 241, 221, .72)`、公式提示文字 `#faf7ee`、捲軸 `#d3cdb8` / `#c8c1ac`。
   - 陰影、圓角、動效與版面規則零變動。
2. **`js/chartRenderer.js`**（僅色彩）：
   - 系列色盤 `['#8f6c14', '#d8b955', '#3fa96b', '#c96a1d', '#a49a82']`；OOS 紅 `#e0625b` 不變；PNG 匯出白底維持 `#ffffff`。
   - 標題 / 軸標題 / 圖例文字 `#4c4536`、刻度 `#83795f`、網格 `rgba(76, 69, 54, .06 / .08)`、零線與標註框線 `#dedaca`。
   - 主 X 軸交替色階 `#4c4536` ↔ `#b08820`（中金，與深古金主色區隔以維持交替辨識；原 石板灰 ↔ 藍）；副 X 軸 `#83795f` ↔ `#d8b955`（原 次要灰 ↔ 霧藍）。
   - UCL / LCL / CL 由 `#d4972f` 改 `#c96a1d`、管制色帶透明度 0.05；Target 綠與 USL / LSL 紅不變。
   - 標註標籤底色改淡鵝黃 `rgba(247, 241, 221, .92)`、資料點描邊改暖白 `#fffdf7`。
3. **`index.html`**：Favicon 漸層改 `#D8B955 → #B08820`；版本字串 `v1.7.0 • Warm Inset Focus`。
4. **`js/app.js`**：零修改（完全沿用 CSS 變數，含 `--user-cobalt` / `--assistant-cyan` 映射）。

**確效測試 (Check)**：
- `node --check` 三支 JS 全數 PASS。
- 全檔冷藍色值殘留掃描：`#ecf0f5` / `#e4e9f0` / `#5b8def` / `#7a9cc6` / `#3d4a5c` / `#6b7a90` / `#8a97aa` / `#cfd6e0` / `rgba(91, 141, 239` / `rgba(163, 177, 198` / `rgba(61, 74, 92` 命中 0 筆。
- WCAG 相對亮度對比檢核（實算）：主要文字 `#4c4536` on `#f7f1dd` = 8.40:1（v1.6.0 為 7.87:1）、次要文字 = 3.82:1（v1.6.0 為 3.81:1）、主色 `#8f6c14` = 4.30:1（v1.6.0 冷藍主色為 2.82:1）、焦橙 `#c96a1d` = 3.34:1（v1.6.0 琥珀為 2.25:1）——全面不低於原基準，語意色可讀性明顯改善。
- 瀏覽器實測：零 Console 錯誤；raised / inset 光影層次與元件定位與 v1.6.0 一致。

**已知事項**：
- 主色與焦橙同屬暖色系（色相相距 16°），辨識主要仰賴 13 點明度差與彩度；同一張圖同時出現深古金與焦橙線條時，直覺分離度仍不如 v1.6.0 的冷藍 / 琥珀。
- 語意綠 `#3fa96b` on 淡鵝黃為 2.62:1（沿用 v1.6.0 原始色值；v1.6.0 於冷藍底為 2.59:1，未變差）。若需達 WCAG AA 可再壓深至 `#2f8f57`（3.52:1），但會偏離原柔和語意色設定。
- 陰影改暖色後，深色陰影在低亮度螢幕上的層次感略低於原藍灰色陰影。

---

## 2026-09-23 (v1.6.0)
**任務目標 (Inset Focus 軟UI設計系統 - v1.6.0)**：
1. 導入「Inset Focus」設計系統，強調按下/內凹表面的軟 UI 美學。
2. 所有組件共用基底色，深度感完全來自光影效果（raised / inset shadow）。
3. 統一設計令牌：柔和色階、精準的陰影層級、統一的圓角與過渡動效。

**設計特色 (Design Characteristics)**：
- **色彩系統**：`#ecf0f5` 表面 + `#e4e9f0` 深色 + `rgba(163, 177, 198)` 柔和陰影
- **深度設計**：raised (`6px 6px 14px + -6px -6px 14px`)、inset (`inset 4px 4px 9px + inset -4px -4px 9px`)、raised-sm、inset-sm
- **語意色**：綠 `#3fa96b`、琥珀 `#d4972f`、紅 `#e0625b`、主藍 `#5b8def`
- **過渡動效**：`cubic-bezier(0.16, 1, 0.3, 1)` 俐落平整過渡、寬度/padding/margin 0.35s 平滑

**執行內容 (Do & Check)**：
1. **`css/style.css`**（重寫，保留全部既有選擇器與圖表高度自適應規則）：
   - Design Tokens 改為 Inset Focus（柔和表面色 `#ecf0f5`、深層 `#e4e9f0`、raised/inset shadow 成對）
   - 元件重塑：所有卡片/按鈕/輸入框採 raised 凸起初始狀態，按下時 inset 內凹
   - 新增缺失 CSS 規則：`.card-icon.cobalt`、`.card-icon.cyan`、`.card-actions`、`.metric-label` 等 9 個類別
   - 保留全部既有圖表高度自適應邏輯（`.charts-grid flex 1 1 0` 等）
2. **`js/app.js`**：無修改（完全向後相容）
3. **`js/chartRenderer.js`**：無修改
4. **`index.html`**：無修改

**確效測試 (Check)**：
- `node --check` 三支 JS 全數 PASS
- 所有 HTML 使用的 CSS 類別皆已定義
- 零 orphaned CSS 規則
- 零 Console 錯誤

---

## 2026-09-23 (v1.5.0)
**任務目標 (Minimalism 極簡主義風格 - v1.5.0)**：
1. 依參考截圖「Minimalism 極簡主義 · 組件展示」將全站風格與色彩由 Liquid Glass 改為極簡主義。
2. 決策（經使用者確認）：**UI 純黑白灰，數據保留低彩度語意色**——SPC 工具的規格外紅點、規格/管制線與 Cpk 等級色具判讀意義，完全單色將降低異常辨識度。

**設計解析 (Design Analysis)**：
- 色彩：`#F7F7F7` 紙白底、`#111` 墨黑、`#E4E4E4` 髮絲線，無品牌色。
- 層次：不使用卡片與陰影，僅以 1px 髮絲線分隔區塊。
- 字體：大寫寬字距小標籤 (letter-spacing 0.16em)、細字重大數字 (300)。
- 元件：底線式輸入框、細線 + 黑點開關、底線標示的分頁、細線圓形圖示按鈕、左側黑色豎線卡片、描邊膠囊按鈕。

**執行內容 (Do & Check)**：
1. **`css/style.css`**（重寫，保留全部既有選擇器與圖表高度自適應規則）：
   - Design Tokens 改為單色階 (`--paper` / `--ink` / `--grey-*` / `--hairline`)；語意色改低彩度：綠 `#4f7a5f`、琥珀 `#a8741a`、紅 `#b4443c`、藍灰 `#4a6785`。
   - 舊變數 `--user-cobalt` 映射至藍灰 `#4a6785`（`app.js` 用於 Cpk「良」等級），`--status-*` / `--system-red` 沿用新語意色，`app.js` 零修改。
   - Checkbox 以 `appearance: none` + `::after` 重繪為「細線 + 圓點」開關（未勾選：灰空心點；勾選：黑線 + 黑點右移）。
   - 摘要列取消卡片，改為上下髮絲線 + 垂直分隔線；圖示改細線圓框。
   - 輸入框 / 下拉選單改底線式，下拉箭頭改細線 SVG chevron；多選清單保留細框。
   - 主按鈕改黑色描邊膠囊（hover 反白為黑底）；次要按鈕改純文字 + hover 底線；作者卡 / 檔案資訊改左側黑色豎線卡片。
   - 移除 Liquid Glass 的光球、backdrop-filter、光澤與陰影樣式。
2. **`js/chartRenderer.js`**（僅色彩）：
   - 系列色盤改灰階 `#111111 / #8a8a8a / #4a4a4a / #b5b5b5 / #6b6b6b`；OOS 紅點 `#b4443c`。
   - Target `#4f7a5f`、USL/LSL `#b4443c`、UCL/LCL/CL `#a8741a`；規格/管制色帶透明度降至 0.04。
   - 主 / 副 X 軸交替色、偏離目標 (%) 副 Y 軸、標題與刻度字改灰階；`GLASS_BG` 更名為 `SCREEN_BG`。
3. **`index.html`**：移除 `.ambient-orbs` 光球區塊；Favicon 改墨黑；版本字串 `v1.5.0 • Minimalism`。

**確效測試 (Check)**：
- 瀏覽器實測（120 筆測試 Excel）：零 Console 錯誤；`node --check` PASS。
- UI 飽和色掃描（圖表、Cpk 等級數值、狀態點、日期提示除外）：飽和度 > 0.25 的元素 0 個。
- 可見文字元素字級 < 13px：0 個。
- 圖表高度 SVG / 容器：460 / 460（堆疊）、雙欄並排正常，零裁切。
- PNG 匯出攔截：匯出當下 `paper_bgcolor = #ffffff`，匯出後還原透明。

**已知事項**：
- 系列色全為灰階，同時繪製 3 條以上 Y 欄位時辨識度較彩色版低。
- 窄螢幕摘要列換行時，垂直髮絲線對齊不完全一致（寬螢幕正常）。

---

## 2026-09-23 (v1.4.0)
**任務目標 (Liquid Glass 液態玻璃風格 & 圖表高度統一 - v1.4.0)**：
1. 解析參考截圖「Liquid Glass Kit」的介面風格，並套用至全站介面。
2. 修正「僅顯示常態分析」時圖表下半部被截斷的問題，統一兩張圖表的高度規則。

**問題分析 (RCA)**：
1. **玻璃透明感不足（第一版）**：背景僅有大尺寸極柔和的放射漸層光暈（42vw），幾乎等同單一色面；對單色面做 `backdrop-filter: blur()` 與不模糊無異，加上面板 42% 白色不透明度，視覺上只像白色卡片。參考圖的透明感來自「玻璃後方有輪廓清晰、飽和的物件被模糊」。
2. **常態分佈圖被截斷**：`renderDistributionChart()` 在單圖模式寫死 `height: 800`，但 `.main-content` 為 flex column，`.chart-box` 被壓縮至符合視窗的 420px，且 `.content-card` 為 `overflow: hidden`，導致 Plotly SVG 下方 380px 被裁切。趨勢圖則未設定高度而使用 Plotly 預設值，兩圖高度規則不一致。

**修正與預防措施 (CAPA)**：
1. **玻璃透明感**：新增 4 顆飽和漸層光球 (`.ambient-orbs`) 作為被折射物件；面板不透明度降至 0.18（側邊欄 0.28），模糊由 24px 降為 16px 以保留後方形狀輪廓；加入對角光澤與漸層鏡面邊緣。卡片 `background` 簡寫改為 `background-color`，避免覆蓋共用光澤層。
2. **高度統一**：移除 Plotly 寫死高度，改為「容器決定高度、Plotly 自適應」。`.charts-grid` 與 `.chart-box` 設 `flex: 1 1 0` + `min-height: 420px`——flex-basis 0 使容器高度由版面決定，而非被 Plotly 已渲染的 SVG 撐住，縮小視窗時可正確回縮。窄螢幕 (<1200px) 堆疊時每張圖固定 460px。

**執行內容 (Do & Check)**：
1. **`css/style.css`**：
   - 重寫 Design Tokens 為 Liquid Glass（玻璃材質、光澤、鏡面邊緣、紫/薄荷漸層、虹彩、柔和長距陰影、大圓角）；舊變數名 (`--user-cobalt` 等) 保留並映射新色，`app.js` 的 inline style 引用免改。
   - 新增 `.ambient-orbs` / `.orb` 光球與 `@keyframes orbDrift`；新增 `prefers-reduced-motion` 降級與 `@supports not (backdrop-filter)` 降級。
   - 元件重塑：膠囊主按鈕、圓形圖示按鈕、膠囊輸入框、分段控制（白膠囊 + 紫色底線）、虹彩卡片、煙燻玻璃 tooltip。
   - 所有 CSS 字級 ≥ 13px。
   - 圖表容器改為 flex 填滿剩餘高度。
2. **`js/chartRenderer.js`**：
   - 色盤改為 `#6d5df5 / #14b8a6 / #ec4899 / #d97706 / #64748b`，OOS 紅改 `#ef4444`，主 X 軸交替色改為糖果紫。
   - 新增 `GLASS_BG`（透明）與 `EXPORT_BG`（白），圖表背景透明、格線半透明化。
   - `exportChart()`：匯出前 `relayout` 為白底 → `downloadImage` → `finally` 還原透明。
   - 移除常態分佈圖 `height: container.closest('.single-view') ? 800 : 450`。
3. **`index.html`**：新增 `.ambient-orbs` 裝飾區塊（`aria-hidden`）；Favicon 改紫色漸層；版本字串更新為 v1.4.0。

**確效測試 (Check)**：
- 瀏覽器實測（以 SheetJS 產生 60 / 450 筆測試 Excel 上傳）：零 Console 錯誤。
- 可見文字元素字級 < 13px：0 個（Plotly 圖內除外）。
- PNG 匯出攔截驗證：匯出當下 `paper_bgcolor = #ffffff`，匯出後還原為 `rgba(0, 0, 0, 0)`。
- 圖表高度（SVG / 容器）：1920×911 雙圖 656/656、單常態 656/656、單趨勢 656/656；1100×911 堆疊 460/460；1920×560 矮螢幕 420/420（含由大縮小回縮驗證），全數零裁切。
- Sidebar 收合：`collapsed` 目標寬度 0px 正確（背景分頁時 CSS transition 暫停屬瀏覽器行為）。

**已知事項**：
- `chartRenderer.js` 既有 `[SPC] doMark` 等 debug `console.log` 在單次渲染即輸出數千行（非本次引入），已另列待清理任務。

---

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
