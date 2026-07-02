# Development Log (SkillsBuilder Mode)

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
