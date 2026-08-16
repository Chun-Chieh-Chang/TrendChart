/**
 * Chart Renderer Module
 * Handles Plotly.js chart generation and updates for Precision Instrument Workbench
 */
const ChartRenderer = (() => {
    const TREND_CHART_HEIGHT_RATIO = 0.8;
    const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    const COLOR_PALETTE = ['#0284c7', '#06b6d4', '#10b981', '#d97706', '#64748b'];
    const OOS_COLOR = '#dc2626';

    /**
     * Render Trend Chart
     * @param {Array} data - Filtered JSON data
     * @param {string} xColumn - X-axis column name
     * @param {Array} yColumns - Array of Y-axis column names
     * @param {Object} specs - Target/USL/LSL limits
     * @param {Object} stats - Computed statistical metrics (for UCL/LCL)
     * @param {string} targetId - Container ID to render in
     */
    const renderTrendChart = (data, xColumn, yColumns, specs = {}, stats = null, targetId = 'plotly-trend', sheetName = '', xColumn2 = '', isXDate = false, isX2Date = false) => {
        const container = document.getElementById(targetId);
        if (!container) return;

        // Purge existing Plotly instance and clear container
        try { Plotly.purge(container); } catch (e) { }
        container.innerHTML = '';

        if (!data || data.length === 0 || !xColumn || !yColumns || yColumns.length === 0) {
            clearChart(targetId);
            return;
        }

        // Create a local copy of data and filter out rows with no Y data
        let chartData = data.filter(row => {
            return yColumns.some(yCol => {
                const val = ExcelParser.parseNumber(row[yCol]);
                return !isNaN(val);
            });
        });

        if (chartData.length === 0) {
            clearChart(targetId);
            return;
        }

        // --- Date Handling & Sorting ---
        if (isXDate) {
            chartData.sort((a, b) => {
                const da = ExcelParser.parseDate(a[xColumn]) || new Date(0);
                const db = ExcelParser.parseDate(b[xColumn]) || new Date(0);
                return da - db;
            });
        }

        const isSingleView = !!container.closest('.single-view');
        const formatX = (val, isDate) => {
            if (isDate) {
                const d = ExcelParser.parseDate(val);
                if (d) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                }
            }
            return String(val ?? '');
        };

        const traces = yColumns.map((yCol, idx) => {
            const validPoints = chartData.map((row, i) => {
                return {
                    i: i,
                    y: ExcelParser.parseNumber(row[yCol]),
                    row: row
                };
            }).filter(pt => !isNaN(pt.y));

            const baseColor = COLOR_PALETTE[idx % COLOR_PALETTE.length];

            const markerColors = validPoints.map(pt => {
                const isOOS = (!isNaN(specs.usl) && pt.y > specs.usl) ||
                    (!isNaN(specs.lsl) && pt.y < specs.lsl);
                return isOOS ? OOS_COLOR : baseColor;
            });

            const markerSizes = validPoints.map(pt => {
                const isOOS = (!isNaN(specs.usl) && pt.y > specs.usl) ||
                    (!isNaN(specs.lsl) && pt.y < specs.lsl);
                return isOOS ? 9 : 5;
            });

            return {
                x: validPoints.map(pt => pt.i),
                text: validPoints.map(pt => {
                    let txt = formatX(pt.row[xColumn], isXDate);
                    if (xColumn2) txt += ` | ${formatX(pt.row[xColumn2], isX2Date)}`;
                    return txt;
                }),
                y: validPoints.map(pt => pt.y),
                name: yCol,
                mode: 'markers+lines',
                customdata: validPoints.map(pt => {
                    return {
                        x1: formatX(pt.row[xColumn], isXDate),
                        x2: xColumn2 ? formatX(pt.row[xColumn2], isX2Date) : null
                    };
                }),
                hovertemplate: `<b>${xColumn}: %{customdata.x1}</b>${xColumn2 ? `<br><b>${xColumn2}: %{customdata.x2}</b>` : ''}<br>${yCol}: %{y:.4f}<extra></extra>`,
                type: validPoints.length > 500 ? 'scattergl' : 'scatter',
                line: { width: 1.5, color: baseColor, dash: 'dash' },
                marker: {
                    size: markerSizes,
                    color: markerColors,
                    line: {
                        color: '#ffffff',
                        width: validPoints.map((pt, i) => markerColors[i] === OOS_COLOR ? 1.5 : 0)
                    }
                }
            };
        });

        // Add dummy trace for secondary Y axis
        if (!isNaN(specs.target) && specs.target !== 0) {
            traces.push({
                x: [0],
                y: [null],
                yaxis: 'y2',
                type: 'scatter',
                showlegend: false,
                hoverinfo: 'none'
            });
        }

        // Add dummy trace for secondary X axis
        if (xColumn2) {
            traces.push({
                x: chartData.map((_, i) => i),
                y: chartData.map(() => null),
                xaxis: 'x2',
                type: 'scatter',
                showlegend: false,
                hoverinfo: 'none'
            });
        }

        const shapes = [];
        const annotations = [];

        const addLimitLine = (val, label, color, dash, width = 1.5) => {
            if (isNaN(val)) return;
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: val, y1: val,
                line: { color: color, width: width, dash: dash }
            });
            annotations.push({
                xref: 'paper', x: 1, y: val, yref: 'y',
                text: `<b>${label}: ${val.toFixed(4)}</b>`,
                showarrow: false,
                xanchor: 'right',
                yanchor: 'bottom',
                font: { family: FONT_FAMILY, color: color, size: 10 },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#cbd5e1',
                borderwidth: 1,
                borderpad: 2
            });
        };

        if (specs.showTarget !== false) {
            addLimitLine(specs.target, 'Target', '#10b981', '40px 10px 10px 10px', 2);
        }

        if (specs.showSpec !== false) {
            addLimitLine(specs.usl, 'USL', '#dc2626', 'dash', 1.5);
            addLimitLine(specs.lsl, 'LSL', '#dc2626', 'dash', 1.5);
        }

        if (stats && specs.showLimits !== false) {
            addLimitLine(stats.ucl, 'UCL', '#d97706', 'dot', 1.5);
            addLimitLine(stats.lcl, 'LCL', '#d97706', 'dot', 1.5);
            addLimitLine(stats.mean, 'CL', 'rgba(217, 119, 6, 0.8)', 'dash', 1);
        }

        const layout = {
            title: {
                text: `${sheetName ? sheetName + ' ' : ''}數據趨勢圖 (${yColumns.join(', ')})`,
                font: { family: FONT_FAMILY, color: '#0f172a', size: 14 },
                y: 0.98,
                yanchor: 'top'
            },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            shapes: shapes,
            annotations: annotations,
            xaxis: {
                title: {
                    text: xColumn,
                    font: { family: FONT_FAMILY, color: '#0f172a', size: 11 }
                },
                type: 'category',
                tickmode: 'array',
                tickvals: chartData.map((_, i) => i),
                ticktext: (() => {
                    // 主 X 軸高對比色階：深石墨藍 (#0f172a) 與 高飽和深鈷藍 (#0284c7)
                    const colors = ['#0f172a', '#0284c7'];
                    let colorIdx = 0;
                    return chartData.map((row, i) => {
                        const val = formatX(row[xColumn], isXDate);
                        if (i > 0) {
                            const prevVal = formatX(chartData[i - 1][xColumn], isXDate);
                            if (val !== prevVal) colorIdx = (colorIdx + 1) % colors.length;
                        }
                        const isAlt = colorIdx === 1;
                        return `<span style="color: ${colors[colorIdx]}; font-weight: ${isAlt ? '700' : '600'};">${val}</span>`;
                    });
                })(),
                gridcolor: '#f1f5f9',
                zerolinecolor: '#cbd5e1',
                tickfont: { family: FONT_FAMILY, size: 10 },
                range: [-0.5, chartData.length - 0.5],
                automargin: true,
                anchor: 'y'
            },
            yaxis: {
                title: {
                    text: '數值',
                    font: { family: FONT_FAMILY, color: '#0f172a', size: 11 }
                },
                gridcolor: '#e2e8f0',
                zerolinecolor: '#cbd5e1',
                tickfont: { family: FONT_FAMILY, color: '#475569', size: 10 },
                anchor: 'x'
            },
            legend: {
                font: { family: FONT_FAMILY, color: '#0f172a', size: 11 },
                orientation: 'h', y: -0.25
            },
            margin: { t: xColumn2 ? 110 : 70, r: 80, l: 60, b: 110 }
        };

        if (xColumn2) {
            layout.xaxis2 = {
                title: {
                    text: xColumn2,
                    font: { family: FONT_FAMILY, color: '#047857', size: 11 }
                },
                type: 'category',
                tickmode: 'array',
                tickvals: chartData.map((_, i) => i),
                ticktext: (() => {
                    // 頂部副 X 軸高對比色階：深翡翠綠 (#047857) 與 濃郁靛青藍 (#4338ca)
                    const colors = ['#047857', '#4338ca'];
                    let colorIdx = 0;
                    return chartData.map((row, i) => {
                        const val = formatX(row[xColumn2], isX2Date);
                        if (i > 0) {
                            const prevVal = formatX(chartData[i - 1][xColumn2], isX2Date);
                            if (val !== prevVal) colorIdx = (colorIdx + 1) % colors.length;
                        }
                        const isAlt = colorIdx === 1;
                        return `<span style="color: ${colors[colorIdx]}; font-weight: ${isAlt ? '700' : '600'};">${val}</span>`;
                    });
                })(),
                overlaying: 'x',
                side: 'top',
                gridcolor: 'transparent',
                tickfont: { family: FONT_FAMILY, size: 9 },
                automargin: true
            };
        }

        if (!isNaN(specs.target) && specs.target !== 0) {
            layout.yaxis2 = {
                title: {
                    text: '偏離目標 (%)',
                    font: { family: FONT_FAMILY, color: '#10b981', size: 11 }
                },
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickfont: { family: FONT_FAMILY, color: '#10b981', size: 10 },
                ticksuffix: '%'
            };
        }

        // Plotly instance
        Plotly.newPlot(container, traces, layout, { responsive: true, displaylogo: false }).then(gd => {
            if (!isNaN(specs.target) && specs.target !== 0) {
                const syncFromRange = (r0, r1) => {
                    Plotly.relayout(gd, {
                        'yaxis2.range': [((r0 - specs.target) / specs.target) * 100, ((r1 - specs.target) / specs.target) * 100],
                        'yaxis2.autorange': false
                    }).catch(() => { });
                };

                const sync = () => {
                    if (!gd) return;
                    const r = (gd.layout.yaxis && gd.layout.yaxis.range)
                        || (gd._fullLayout && gd._fullLayout.yaxis && gd._fullLayout.yaxis.range);
                    if (!r || r.length < 2) return;
                    syncFromRange(r[0], r[1]);
                };

                gd.on('plotly_relayout', (edata) => {
                    if (edata['yaxis.range[0]'] !== undefined) {
                        syncFromRange(edata['yaxis.range[0]'], edata['yaxis.range[1]']);
                    } else if (edata['yaxis.range'] && edata['yaxis.range'].length === 2) {
                        syncFromRange(edata['yaxis.range'][0], edata['yaxis.range'][1]);
                    } else if (edata['yaxis.autorange']) {
                        setTimeout(sync, 100);
                    }
                });

                sync();
            }
        }).catch(err => console.error('Plotly Error:', err));
    };

    /**
     * Clear chart and show empty state
     */
    const clearChart = (targetId = 'plotly-trend') => {
        const container = document.getElementById(targetId);
        if (!container) return;
        try { Plotly.purge(container); } catch (e) { }
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="chart-line"></i>
                <p>請選擇數據欄位並點擊更新圖表</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    };

    /**
     * Download chart as image
     */
    const exportChart = (targetId) => {
        const gd = document.getElementById(targetId);
        if (gd && gd.data) {
            Plotly.downloadImage(gd, {
                format: 'png',
                width: 1600,
                height: 800,
                filename: 'chart_export'
            });
        }
    };

    /**
     * Render Normal Distribution Analysis
     * @param {Array} data - Filtered JSON data
     * @param {Array} columns - Array of Y-axis column names
     * @param {Object} specs - Target/USL/LSL limits
     * @param {string} targetId - Container ID to render in
     */
    const renderNormalDistChart = (data, columns, specs = {}, stats = null, targetId = 'plotly-dist', sheetName = '') => {
        const container = document.getElementById(targetId);
        if (!container) return;

        try { Plotly.purge(container); } catch (e) { }
        container.innerHTML = '';

        if (!data || data.length === 0 || !columns || columns.length === 0) {
            clearChart(targetId);
            return;
        }

        const allTraces = [];
        const shapes = [];
        const annotations = [];

        let globalMin = Infinity;
        let globalMax = -Infinity;

        const columnStats = columns.map((col, idx) => {
            const values = data.map(row => ExcelParser.parseNumber(row[col])).filter(v => !isNaN(v));
            if (values.length === 0) return null;

            const stats = ExcelParser.getStats(values, specs);
            const baseColor = COLOR_PALETTE[idx % COLOR_PALETTE.length];

            const colMin = Math.min(...values, stats.mean - 4 * stats.stdevOverall);
            const colMax = Math.max(...values, stats.mean + 4 * stats.stdevOverall);
            globalMin = Math.min(globalMin, colMin);
            globalMax = Math.max(globalMax, colMax);

            return { col, values, stats, baseColor };
        }).filter(s => s !== null);

        if (columnStats.length === 0) {
            clearChart(targetId);
            return;
        }

        // Extend x-axis range to include spec limits & control limits
        if (!isNaN(specs.usl)) globalMax = Math.max(globalMax, specs.usl);
        if (!isNaN(specs.lsl)) globalMin = Math.min(globalMin, specs.lsl);
        if (stats && !isNaN(stats.ucl)) globalMax = Math.max(globalMax, stats.ucl);
        if (stats && !isNaN(stats.lcl)) globalMin = Math.min(globalMin, stats.lcl);
        if (!isNaN(specs.target)) {
            globalMin = Math.min(globalMin, specs.target);
            globalMax = Math.max(globalMax, specs.target);
        }
        const padding = (globalMax - globalMin) * 0.05 || 1;
        globalMin -= padding;
        globalMax += padding;

        columnStats.forEach(({ col, values, stats, baseColor }) => {
            const { mean, stdevOverall } = stats;
            const sigma = stdevOverall;

            // 1. Histogram
            allTraces.push({
                x: values,
                type: 'histogram',
                name: `${col} 分佈`,
                nbinsx: 30,
                histnorm: 'probability density',
                visible: columnStats.length === 1 ? true : 'legendonly',
                marker: {
                    color: baseColor,
                    opacity: 0.25,
                    line: { color: baseColor, width: 1 }
                }
            });

            // 2. Normal Curve
            const curveX = [], curveY = [];
            const step = (globalMax - globalMin) / 100;
            for (let i = 0; i <= 100; i++) {
                const x = globalMin + (i * step);
                curveX.push(x);
                curveY.push(ExcelParser.normDist(x, mean, sigma));
            }

            allTraces.push({
                x: curveX,
                y: curveY,
                type: 'scatter',
                mode: 'lines',
                name: `${col} 曲線 (Ppk:${(stats.ppk || 0).toFixed(3)})`,
                line: { color: baseColor, width: 1.5 }
            });

            // 3. Sigma Markers
            if (columnStats.length === 1) {
                const sigmaMarkersX = [], sigmaMarkersY = [], sigmaLabels = ['-3σ', '-2σ', '-1σ', 'Avg', '+1σ', '+2σ', '+3σ'];
                for (let i = -3; i <= 3; i++) {
                    const x = mean + i * sigma;
                    sigmaMarkersX.push(x);
                    sigmaMarkersY.push(ExcelParser.normDist(x, mean, sigma));
                }
                allTraces.push({
                    x: sigmaMarkersX,
                    y: sigmaMarkersY,
                    type: 'scatter',
                    mode: 'markers+text',
                    name: `${col} σ 標記`,
                    text: sigmaLabels,
                    textposition: 'top center',
                    textfont: { family: FONT_FAMILY, size: 9 },
                    marker: { color: baseColor, size: 7 },
                    showlegend: false
                });
            }
        });

        // 4. Specs & Limits
        const addLimit = (val, label, color, dash, width = 1.5) => {
            if (isNaN(val)) return;
            shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: val, x1: val, y0: 0, y1: 0.9, line: { color: color, width: width, dash: dash } });
            annotations.push({
                x: val, y: 0.95, xref: 'x', yref: 'paper',
                text: `<b>${label}: ${val.toFixed(4)}</b>`,
                showarrow: false,
                font: { family: FONT_FAMILY, color: color, size: 10 },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#cbd5e1',
                borderwidth: 1,
                borderpad: 2
            });
        };

        const addRange = (lo, hi, color) => {
            if (isNaN(lo) || isNaN(hi) || lo === hi) return;
            const [x0, x1] = lo < hi ? [lo, hi] : [hi, lo];
            shapes.push({
                type: 'rect', xref: 'x', yref: 'paper',
                x0: x0, x1: x1, y0: 0, y1: 1,
                fillcolor: color,
                line: { width: 0 },
                layer: 'below'
            });
        };

        if (specs.showTarget !== false) {
            addLimit(specs.target, 'Target', '#10b981', '40px 10px 10px 10px', 2);
        }

        if (specs.showSpec !== false) {
            addRange(specs.lsl, specs.usl, 'rgba(220, 38, 38, 0.05)');
            addLimit(specs.usl, 'USL', '#dc2626', 'dash');
            addLimit(specs.lsl, 'LSL', '#dc2626', 'dash');
        }

        if (stats && specs.showLimits !== false) {
            addRange(stats.lcl, stats.ucl, 'rgba(217, 119, 6, 0.05)');
            addLimit(stats.ucl, 'UCL', '#d97706', 'dot', 1.5);
            addLimit(stats.lcl, 'LCL', '#d97706', 'dot', 1.5);
            addLimit(stats.mean, 'CL', 'rgba(217, 119, 6, 0.8)', 'dash', 1);
        }

        const layout = {
            title: {
                text: `${sheetName ? sheetName + ' ' : ''}常態分佈對比分析`,
                font: { family: FONT_FAMILY, color: '#0f172a', size: 14 }
            },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            shapes: shapes,
            annotations: annotations,
            xaxis: {
                title: {
                    text: '數值',
                    font: { family: FONT_FAMILY, color: '#0f172a', size: 11 }
                },
                gridcolor: '#f1f5f9',
                zerolinecolor: '#cbd5e1',
                tickfont: { family: FONT_FAMILY, color: '#475569', size: 10 },
                range: [globalMin, globalMax]
            },
            yaxis: {
                title: {
                    text: '密度',
                    font: { family: FONT_FAMILY, color: '#0f172a', size: 11 }
                },
                gridcolor: '#e2e8f0',
                zerolinecolor: '#cbd5e1',
                tickfont: { family: FONT_FAMILY, color: '#475569', size: 10 }
            },
            legend: {
                font: { family: FONT_FAMILY, color: '#0f172a', size: 11 },
                orientation: 'h', y: -0.25
            },
            margin: { t: 60, r: 40, l: 70, b: 110 },
            height: container.closest('.single-view') ? 800 : 450,
            hovermode: 'closest',
            bargap: 0.1
        };

        Plotly.newPlot(container, allTraces, layout, { responsive: true, displaylogo: false })
            .catch(err => console.error('Plotly DistChart Error:', err));
    };

    return { renderTrendChart, renderNormalDistChart, clearChart, exportChart };
})();
