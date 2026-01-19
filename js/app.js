/**
 * App Module
 * Orchestrates UI interactions and integrates Parser and Renderer
 */
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const filenameLabel = document.getElementById('filename');
    const removeFileBtn = document.getElementById('remove-file');

    const sheetSection = document.getElementById('sheet-section');
    const sheetSelector = document.getElementById('sheet-selector');

    const configSection = document.getElementById('config-section');
    const xAxisSelector = document.getElementById('x-axis-selector');
    const xAxis2Selector = document.getElementById('x-axis-2-selector');
    const xIsDateCheckbox = document.getElementById('x-is-date');
    const x2IsDateCheckbox = document.getElementById('x2-is-date');
    const yAxisSelector = document.getElementById('y-axis-selector');
    const generateChartBtn = document.getElementById('generate-chart');
    const exportTrendBtn = document.getElementById('export-trend');
    const exportDistBtn = document.getElementById('export-dist');
    const yVisibilitySection = document.getElementById('y-visibility-section');
    const ySeriesToggles = document.getElementById('y-series-toggles');

    // Spec Limits
    const targetInput = document.getElementById('target-input');
    const uslInput = document.getElementById('usl-input');
    const lslInput = document.getElementById('lsl-input');
    const targetColSelector = document.getElementById('target-col-selector');
    const uslColSelector = document.getElementById('usl-col-selector');
    const lslColSelector = document.getElementById('lsl-col-selector');

    const filterSection = document.getElementById('filter-section');
    const filterContainer = document.getElementById('filter-container');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const layoutSection = document.getElementById('layout-section');
    const toggleTrend = document.getElementById('toggle-trend');
    const toggleDist = document.getElementById('toggle-dist');
    const chartsMainContainer = document.getElementById('charts-main-container');
    const trendCard = document.getElementById('trend-card');
    const distCard = document.getElementById('dist-card');
    const togglePreview = document.getElementById('toggle-preview');
    const tableContainer = document.querySelector('.table-container');

    const totalRowsEl = document.getElementById('total-rows');
    const filteredRowsEl = document.getElementById('filtered-rows');
    const yMeanEl = document.getElementById('y-mean');
    const caValueEl = document.getElementById('ca-value');
    const cpValueEl = document.getElementById('cp-value');
    const cpkValueEl = document.getElementById('cpk-value');
    const ppkValueEl = document.getElementById('ppk-value');
    const uclLclEl = document.getElementById('cl-text');
    const sdWithinEl = document.getElementById('sd-within');
    const sdBetweenEl = document.getElementById('sd-between');
    const sdOverallEl = document.getElementById('sd-overall');

    const helpBtn = document.getElementById('show-help');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help');

    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    // App State
    let rawData = [];
    let filteredData = [];
    let activeFilters = {};
    let currentSheet = '';
    let allColumns = [];
    let hiddenSeries = new Set();

    // Pagination state for table
    let tablePageSize = 50;
    let tableCurrentIndex = 0;
    let tableObserver = null;

    // --- Initialization ---

    // Help Modal
    helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
    closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.classList.add('hidden'); });

    // Layout Toggles
    const updateLayout = () => {
        trendCard.classList.toggle('hidden', !toggleTrend.checked);
        distCard.classList.toggle('hidden', !toggleDist.checked);
        const visibleCount = [toggleTrend.checked, toggleDist.checked].filter(v => v).length;
        chartsMainContainer.classList.toggle('single-view', visibleCount === 1);
        chartsMainContainer.classList.toggle('dual-view', visibleCount === 2);
        // Re-render if data exists to apply height changes
        if (filteredData.length > 0) renderChart();
        // Trigger resize
        window.dispatchEvent(new Event('resize'));
    };
    toggleTrend.addEventListener('change', updateLayout);
    toggleDist.addEventListener('change', updateLayout);

    togglePreview.addEventListener('change', () => {
        if (filteredData.length > 0) {
            updateTable();
        }
    });

    updateLayout(); // Initialize layout state

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('.material-icons-round');
        icon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
        if (filteredData.length > 0) renderChart();
    });

    // --- File Handling ---

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    removeFileBtn.addEventListener('click', resetApp);

    async function handleFile(file) {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            alert('請上傳 Excel 檔案 (.xlsx, .xls)');
            return;
        }

        filenameLabel.textContent = file.name;
        dropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target.result;
                const sheetNames = await ExcelParser.parseFile(data);

                // Populate sheets
                sheetSelector.innerHTML = '';
                sheetNames.forEach(name => {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    sheetSelector.appendChild(opt);
                });

                sheetSection.classList.remove('hidden');

                // Persistence Logic: Try to restore previous selections
                const previousSelectedSheets = Array.from(sheetSelector.selectedOptions).map(opt => opt.value);
                let restored = false;

                if (previousSelectedSheets.length > 0) {
                    let validSelections = 0;
                    for (let i = 0; i < sheetSelector.options.length; i++) {
                        if (previousSelectedSheets.includes(sheetSelector.options[i].value)) {
                            sheetSelector.options[i].selected = true;
                            validSelections++;
                        }
                    }
                    if (validSelections > 0) {
                        loadSheet(Array.from(sheetSelector.selectedOptions).map(opt => opt.value));
                        restored = true;
                    }
                }

                if (!restored && sheetNames.length > 0) {
                    sheetSelector.options[0].selected = true;
                    loadSheet([sheetNames[0]]);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error(err);
            alert('檔案讀取失敗');
            resetApp();
        }
    }

    function resetApp() {
        rawData = [];
        filteredData = [];
        activeFilters = {};

        fileInput.value = '';
        dropZone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        sheetSection.classList.add('hidden');
        configSection.classList.add('hidden');
        filterSection.classList.add('hidden');

        totalRowsEl.textContent = '0';
        filteredRowsEl.textContent = '0';
        const countDisplay = document.getElementById('table-count');
        if (countDisplay) countDisplay.textContent = '';
        yMeanEl.textContent = '0';

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        ChartRenderer.clearChart('plotly-trend');
        ChartRenderer.clearChart('plotly-dist');
    }

    // --- Data Loading & Selection ---

    sheetSelector.addEventListener('change', () => {
        const selectedSheets = Array.from(sheetSelector.selectedOptions).map(opt => opt.value);
        if (selectedSheets.length > 0) {
            loadSheet(selectedSheets);
        }
    });

    function loadSheet(sheetNames) {
        if (!Array.isArray(sheetNames)) sheetNames = [sheetNames];
        currentSheet = sheetNames.join('_');

        // Concatenate data from selected sheets
        rawData = sheetNames.reduce((acc, name) => {
            const data = ExcelParser.getSheetData(name);
            return data ? acc.concat(data) : acc;
        }, []);

        filteredData = [...rawData];
        // activeFilters = {}; // Removed to persist filter states across sheet switches

        if (rawData.length === 0) {
            alert('所選工作表無數據');
            return;
        }

        // Get Union of all columns from all rows
        allColumns = [...new Set(rawData.reduce((cols, row) => cols.concat(Object.keys(row)), []))];

        totalRowsEl.textContent = rawData.length;
        filteredRowsEl.textContent = rawData.length;

        // Setup Selectors
        setupSelectors(allColumns);

        // Setup Filters
        try { setupFilters(allColumns); } catch (e) { console.error('Filter setup failed', e); }

        // Update Table
        try { updateTable(allColumns); } catch (e) { console.error('Table update failed', e); }

        configSection.classList.remove('hidden');
        filterSection.classList.remove('hidden');
        layoutSection.classList.remove('hidden');

        // Apply existing filters if any
        applyFilters();
    }

    function setupSelectors(columns) {
        xAxisSelector.innerHTML = '';
        xAxis2Selector.innerHTML = '<option value="">無</option>';
        yAxisSelector.innerHTML = '';
        targetColSelector.innerHTML = '<option value="">選取欄位</option>';
        uslColSelector.innerHTML = '<option value="">選取欄位</option>';
        lslColSelector.innerHTML = '<option value="">選取欄位</option>';

        columns.forEach(col => {
            const optX = document.createElement('option');
            optX.value = col;
            optX.textContent = col;
            xAxisSelector.appendChild(optX);

            const optX2 = document.createElement('option');
            optX2.value = col;
            optX2.textContent = col;
            xAxis2Selector.appendChild(optX2);

            const optY = document.createElement('option');
            optY.value = col;
            optY.textContent = col;
            yAxisSelector.appendChild(optY);

            // For Target/USL/LSL Column pickers
            const optT = document.createElement('option');
            optT.value = col;
            optT.textContent = col;
            targetColSelector.appendChild(optT);

            const optU = document.createElement('option');
            optU.value = col;
            optU.textContent = col;
            uslColSelector.appendChild(optU);

            const optL = document.createElement('option');
            optL.value = col;
            optL.textContent = col;
            lslColSelector.appendChild(optL);
        });

        // Binding column selection to manual inputs
        const updateInputFromCol = (selector, input) => {
            const col = selector.value;
            if (col && filteredData.length > 0) {
                // Find the first valid numeric value in the filtered data set
                let foundValue = null;
                for (let i = 0; i < filteredData.length; i++) {
                    const val = ExcelParser.parseNumber(filteredData[i][col]);
                    if (!isNaN(val)) {
                        foundValue = val;
                        break;
                    }
                }

                if (foundValue !== null) {
                    input.value = foundValue;
                } else {
                    input.value = ''; // Clear if no numeric value found in the entire column
                }
            }
        };

        const syncSpecInputs = () => {
            updateInputFromCol(targetColSelector, targetInput);
            updateInputFromCol(uslColSelector, uslInput);
            updateInputFromCol(lslColSelector, lslInput);
        };

        targetColSelector.addEventListener('change', () => {
            updateInputFromCol(targetColSelector, targetInput);
            targetColSelector.dataset.prevValue = targetColSelector.value;
        });
        uslColSelector.addEventListener('change', () => {
            updateInputFromCol(uslColSelector, uslInput);
            uslColSelector.dataset.prevValue = uslColSelector.value;
        });
        lslColSelector.addEventListener('change', () => {
            updateInputFromCol(lslColSelector, lslInput);
            lslColSelector.dataset.prevValue = lslColSelector.value;
        });

        // --- Persistence Logic for Chart Config ---

        // Restore X-Axis
        const prevX = xAxisSelector.dataset.prevValue;
        if (prevX && columns.includes(prevX)) {
            xAxisSelector.value = prevX;
        } else {
            const dateCol = columns.find(c => c.includes('日期') || c.includes('時間'));
            if (dateCol) xAxisSelector.value = dateCol;
        }

        // Restore X-Axis 2
        const prevX2 = xAxis2Selector.dataset.prevValue;
        if (prevX2 && columns.includes(prevX2)) {
            xAxis2Selector.value = prevX2;
        }

        // Always set checkboxes to false on load to force manual confirmation
        if (xAxisSelector.value) {
            const detect = ExcelParser.detectDateConfidence(filteredData, xAxisSelector.value);
            xIsDateCheckbox.checked = xAxisSelector.dataset.prevDate === 'true';
            updateDateHint(xIsDateCheckbox, detect);
        }
        if (xAxis2Selector.value) {
            const detect = xAxis2Selector.value ? ExcelParser.detectDateConfidence(filteredData, xAxis2Selector.value) : { isDate: false };
            x2IsDateCheckbox.checked = xAxis2Selector.dataset.prevDate === 'true';
            updateDateHint(x2IsDateCheckbox, detect);
        }

        // Restore Y-Axis (Multiple)
        const prevY = JSON.parse(yAxisSelector.dataset.prevValues || "[]");
        if (prevY.length > 0) {
            let matched = false;
            for (let i = 0; i < yAxisSelector.options.length; i++) {
                if (prevY.includes(yAxisSelector.options[i].value)) {
                    yAxisSelector.options[i].selected = true;
                    matched = true;
                }
            }
            if (!matched) selectDefaultY(columns);
        } else {
            selectDefaultY(columns);
        }

        // Restore Target/USL/LSL Column Selectors
        const restoreSpecCol = (selector, input) => {
            const prevVal = selector.dataset.prevValue;
            if (prevVal && columns.includes(prevVal)) {
                selector.value = prevVal;
                updateInputFromCol(selector, input);
            }
        };
        restoreSpecCol(targetColSelector, targetInput);
        restoreSpecCol(uslColSelector, uslInput);
        restoreSpecCol(lslColSelector, lslInput);

        // Update tracking data attributes on change
        xAxisSelector.addEventListener('change', () => {
            xAxisSelector.dataset.prevValue = xAxisSelector.value;
            const detect = ExcelParser.detectDateConfidence(filteredData, xAxisSelector.value);
            // Always set to false initially to let user confirm, unless it was previously saved
            xIsDateCheckbox.checked = false;
            updateDateHint(xIsDateCheckbox, detect);
        });
        xAxis2Selector.addEventListener('change', () => {
            xAxis2Selector.dataset.prevValue = xAxis2Selector.value;
            const detect = xAxis2Selector.value ? ExcelParser.detectDateConfidence(filteredData, xAxis2Selector.value) : { isDate: false, isUncertain: false };
            // Always set to false initially to let user confirm
            x2IsDateCheckbox.checked = false;
            updateDateHint(x2IsDateCheckbox, detect);
        });
        xIsDateCheckbox.addEventListener('change', () => {
            xIsDateCheckbox.dataset.prevValue = xIsDateCheckbox.checked;
            renderChart();
        });
        x2IsDateCheckbox.addEventListener('change', () => {
            x2IsDateCheckbox.dataset.prevValue = x2IsDateCheckbox.checked;
            renderChart();
        });
        yAxisSelector.addEventListener('change', () => {
            const selected = Array.from(yAxisSelector.selectedOptions).map(o => o.value);
            yAxisSelector.dataset.prevValues = JSON.stringify(selected);
            updateVisibilityUI(selected);
        });

        // Initialize UI for already selected Y axes
        updateVisibilityUI(Array.from(yAxisSelector.selectedOptions).map(o => o.value));

        function updateDateHint(checkbox, detect) {
            const label = checkbox.nextElementSibling;
            const wrapper = checkbox.parentElement;

            if (detect.isUncertain) {
                label.innerHTML = '偵測到疑為時間格式，建議確認勾選';
                label.style.color = 'var(--amber)';
                wrapper.style.opacity = '1';
                wrapper.classList.add('pulse-hint');
            } else if (detect.isDate) {
                label.innerHTML = '偵測為時間格式，建議勾選以正確顯示';
                label.style.color = 'var(--green)';
                wrapper.style.opacity = '1';
                wrapper.classList.add('pulse-hint');
            } else {
                label.innerHTML = '視為時間格式 (手動開啟)';
                label.style.color = 'var(--text-secondary)';
                wrapper.style.opacity = '0.7';
                wrapper.classList.remove('pulse-hint');
            }
        }

        function updateVisibilityUI(selected) {
            ySeriesToggles.innerHTML = '';
            hiddenSeries.clear(); // Reset hidden state when selection changes

            if (selected.length > 1) {
                yVisibilitySection.classList.remove('hidden');
                selected.forEach(col => {
                    const label = document.createElement('label');
                    label.className = 'checkbox-item';

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = true;
                    cb.addEventListener('change', () => {
                        if (cb.checked) hiddenSeries.delete(col);
                        else hiddenSeries.add(col);
                        renderChart(); // Auto-refresh chart
                    });

                    const span = document.createElement('span');
                    span.textContent = col;

                    label.appendChild(cb);
                    label.appendChild(span);
                    ySeriesToggles.appendChild(label);
                });
            } else {
                yVisibilitySection.classList.add('hidden');
            }
        }

        function selectDefaultY(cols) {
            const valCols = cols.filter(c => {
                const val = rawData[0][c];
                return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
            });
            if (valCols.length > 0) {
                const defaultValue = valCols[0];
                for (let i = 0; i < yAxisSelector.options.length; i++) {
                    if (yAxisSelector.options[i].value === defaultValue) {
                        yAxisSelector.options[i].selected = true;
                        break;
                    }
                }
            }
        }
    }

    // --- Filtering ---

    function setupFilters(columns) {
        filterContainer.innerHTML = '';

        columns.forEach(col => {
            const uniqueValues = ExcelParser.getUniqueValues(rawData, col);

            // Improved Heuristic: filter columns that look like categories
            // Increased limit to 500 to support large concatenated datasets
            const firstVal = rawData[0][col];
            const isNumericValue = typeof firstVal === 'number' && uniqueValues.length > 50;

            if (uniqueValues.length > 1 && uniqueValues.length <= 500 && !isNumericValue) {
                const div = document.createElement('div');
                div.className = 'filter-item';

                const label = document.createElement('label');
                label.textContent = col;

                const select = document.createElement('select');
                select.className = 'custom-select';
                select.innerHTML = `<option value="">全部</option>`;

                uniqueValues.forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    select.appendChild(opt);
                });

                // Restore previous selection if applicable
                if (activeFilters[col] !== undefined && uniqueValues.includes(String(activeFilters[col]))) {
                    select.value = activeFilters[col];
                } else if (activeFilters[col] !== undefined) {
                    // If the old value is no longer valid for this column's unique values, remove it
                    delete activeFilters[col];
                }

                select.addEventListener('change', (e) => {
                    if (e.target.value === "") {
                        delete activeFilters[col];
                    } else {
                        activeFilters[col] = e.target.value;
                    }
                    applyFilters();
                });

                div.appendChild(label);
                div.appendChild(select);
                filterContainer.appendChild(div);
            }
        });
    }

    function applyFilters() {
        filteredData = rawData.filter(row => {
            return Object.entries(activeFilters).every(([col, val]) => {
                return String(row[col]) === String(val);
            });
        });

        filteredRowsEl.textContent = filteredData.length;
        updateTable();

        // Sync Spec Inputs based on filtered results
        syncSpecInputs();

        // Auto update chart if it's already rendered
        if (document.querySelector('.plotly') || xAxisSelector.value) {
            renderChart();
        }
    }

    resetFiltersBtn.addEventListener('click', () => {
        activeFilters = {};
        document.querySelectorAll('.filter-item select').forEach(sel => sel.value = "");
        applyFilters();
    });

    // --- UI Updates ---

    function updateTable(columns) {
        if (!columns) columns = allColumns;
        if (columns.length === 0 && rawData.length > 0) columns = Object.keys(rawData[0] || {});

        // Header
        tableHead.innerHTML = '';
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            tableHead.appendChild(th);
        });

        // Clear existing body
        tableBody.innerHTML = '';
        tableCurrentIndex = 0;

        // Disconnect previous observer if any
        if (tableObserver) {
            tableObserver.disconnect();
            tableObserver = null;
        }

        // Update table count indicator
        const countDisplay = document.getElementById('table-count');
        if (countDisplay) {
            countDisplay.textContent = `(共 ${filteredData.length} 筆篩選數據)`;
        }

        if (filteredData.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = columns.length || 1;
            td.style.textAlign = 'center';
            td.style.padding = '2rem';
            td.textContent = '無匹配篩選條件的數據';
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        // Check if preview is enabled
        if (!togglePreview.checked) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = columns.length || 1;
            td.style.textAlign = 'center';
            td.style.padding = '2rem';
            td.innerHTML = '<i>數據預覽已關閉以提升效能</i>';
            tr.appendChild(td);
            tableBody.appendChild(tr);
            return;
        }

        // Implement Incremental Rendering (Lazy Load)
        renderTableBatch(columns);

        // Update stats
        updateStats();
    }

    function renderTableBatch(columns) {
        const start = tableCurrentIndex;
        const end = Math.min(start + tablePageSize, filteredData.length);
        const fragment = document.createDocumentFragment();

        for (let i = start; i < end; i++) {
            const row = filteredData[i];
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = ExcelParser.formatValue(row[col] ?? '');
                tr.appendChild(td);
            });
            fragment.appendChild(tr);
        }

        tableBody.appendChild(fragment);
        tableCurrentIndex = end;

        // If there are more rows, setup IntersectionObserver for the last row
        if (tableCurrentIndex < filteredData.length) {
            const lastRow = tableBody.lastElementChild;
            if (lastRow) {
                if (!tableObserver) {
                    tableObserver = new IntersectionObserver((entries) => {
                        if (entries[0].isIntersecting) {
                            tableObserver.unobserve(lastRow);
                            renderTableBatch(columns);
                        }
                    }, { root: null, rootMargin: '100px', threshold: 0.1 });
                }
                tableObserver.observe(lastRow);
            }
        }
    }

    function updateStats() {
        const yCols = Array.from(yAxisSelector.selectedOptions).map(opt => opt.value);
        const specs = {
            target: parseFloat(targetInput.value),
            usl: parseFloat(uslInput.value),
            lsl: parseFloat(lslInput.value)
        };

        if (yCols.length > 0 && filteredData.length > 0) {
            const firstCol = yCols[0];
            const values = filteredData.map(row => ExcelParser.parseNumber(row[firstCol]))
                .filter(v => !isNaN(v));

            const stats = ExcelParser.getStats(values, specs);
            yMeanEl.textContent = stats.mean.toFixed(4);

            // Render Ca with Color Coding
            if (stats.ca !== null) {
                const caVal = stats.ca * 100;
                const absCa = Math.abs(caVal);
                caValueEl.textContent = caVal.toFixed(4) + '%';
                if (absCa <= 12.5) caValueEl.style.color = 'var(--green)';
                else if (absCa <= 25) caValueEl.style.color = 'var(--blue)';
                else if (absCa <= 50) caValueEl.style.color = 'var(--amber)';
                else caValueEl.style.color = 'var(--red)';
            } else {
                caValueEl.textContent = 'N/A';
                caValueEl.style.color = '';
            }

            // Render Cp/Cpk/Ppk with Color Coding
            const renderIndex = (el, val) => {
                if (val !== null) {
                    el.textContent = val.toFixed(4);
                    if (val >= 1.67) el.style.color = 'var(--green)';
                    else if (val >= 1.33) el.style.color = 'var(--blue)';
                    else if (val >= 1.0) el.style.color = 'var(--amber)';
                    else el.style.color = 'var(--red)';
                } else {
                    el.textContent = 'N/A';
                    el.style.color = '';
                }
            };

            renderIndex(cpValueEl, stats.cp);
            renderIndex(cpkValueEl, stats.cpk);
            renderIndex(ppkValueEl, stats.ppk);

            uclLclEl.textContent = `UCL: ${stats.ucl.toFixed(4)} | LCL: ${stats.lcl.toFixed(4)}`;
            sdWithinEl.textContent = stats.stdevWithin.toFixed(4);
            sdBetweenEl.textContent = stats.stdevBetween.toFixed(4);
            sdOverallEl.textContent = stats.stdevOverall.toFixed(4);
        } else {
            yMeanEl.textContent = '0';
            uclLclEl.textContent = 'UCL: - | LCL: -';
            caValueEl.textContent = 'N/A';
            cpValueEl.textContent = 'N/A';
            cpkValueEl.textContent = 'N/A';
            ppkValueEl.textContent = 'N/A';
            sdWithinEl.textContent = '-';
            sdBetweenEl.textContent = '-';
            sdOverallEl.textContent = '-';
        }
    }

    // --- Chart Generation ---

    generateChartBtn.addEventListener('click', renderChart);

    function renderChart() {
        const xCol = xAxisSelector.value;
        const xCol2 = xAxis2Selector.value;
        const xIsDate = xIsDateCheckbox.checked;
        const x2IsDate = x2IsDateCheckbox.checked;
        let yCols = Array.from(yAxisSelector.selectedOptions).map(opt => opt.value);

        // Filter out hidden series
        yCols = yCols.filter(c => !hiddenSeries.has(c));

        const specs = {
            target: parseFloat(targetInput.value),
            usl: parseFloat(uslInput.value),
            lsl: parseFloat(lslInput.value)
        };

        if (!xCol || yCols.length === 0) {
            alert('請選擇 X 軸與 Y 軸欄位');
            return;
        }

        const values = filteredData.map(row => ExcelParser.parseNumber(row[yCols[0]]))
            .filter(v => !isNaN(v));
        const currentStats = ExcelParser.getStats(values, specs);

        if (toggleTrend.checked) {
            ChartRenderer.renderTrendChart(filteredData, xCol, yCols, specs, currentStats, 'plotly-trend', currentSheet, xCol2, xIsDate, x2IsDate);
        }
        if (toggleDist.checked) {
            ChartRenderer.renderNormalDistChart(filteredData, yCols, specs, 'plotly-dist', currentSheet);
        }
        updateStats();
    }

    exportTrendBtn.addEventListener('click', () => ChartRenderer.exportChart('plotly-trend'));
    exportDistBtn.addEventListener('click', () => ChartRenderer.exportChart('plotly-dist'));

    // CSV Export
    document.getElementById('export-csv').addEventListener('click', () => {
        if (filteredData.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "FilteredData");
        XLSX.writeFile(workbook, `filtered_data_${currentSheet}.xlsx`);
    });

    // --- Formula Tooltips (KaTeX) ---
    const formulaTooltip = document.getElementById('formula-tooltip');

    document.querySelectorAll('[data-formula]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const formula = el.getAttribute('data-formula');
            if (formula && typeof katex !== 'undefined') {
                try {
                    katex.render(formula, formulaTooltip, {
                        throwOnError: false,
                        displayMode: false
                    });
                    formulaTooltip.classList.remove('hidden');
                } catch (err) {
                    console.error('KaTeX error:', err);
                }
            }
        });

        el.addEventListener('mousemove', (e) => {
            const x = e.clientX + 15;
            const y = e.clientY + 15;

            // Boundary check
            const tooltipRect = formulaTooltip.getBoundingClientRect();
            let finalX = x;
            let finalY = y;

            if (x + tooltipRect.width > window.innerWidth) {
                finalX = e.clientX - tooltipRect.width - 15;
            }
            if (y + tooltipRect.height > window.innerHeight) {
                finalY = e.clientY - tooltipRect.height - 15;
            }

            formulaTooltip.style.left = `${finalX}px`;
            formulaTooltip.style.top = `${finalY}px`;
        });

        el.addEventListener('mouseleave', () => {
            formulaTooltip.classList.add('hidden');
        });
    });
});

