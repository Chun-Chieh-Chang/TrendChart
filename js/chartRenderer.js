/**
 * Chart Renderer Module
 * Handles Plotly.js chart generation and updates
 */
const ChartRenderer = (() => {
    /**
     * Helper to get current theme status
     */
    const isDark = () => document.body.classList.contains('dark-mode');

    /**
     * Render Trend Chart
     * @param {Array} data - Filtered JSON data
     * @param {string} xColumn - X-axis column name
     * @param {Array} yColumns - Array of Y-axis column names
     * @param {Object} specs - Target/USL/LSL limits
     * @param {Object} stats - Computed statistical metrics (for UCL/LCL)
     * @param {string} targetId - Container ID to render in
     */
    const renderTrendChart = (data, xColumn, yColumns, specs = {}, stats = null, targetId = 'plotly-trend', sheetName = '', xColumn2 = '') => {
        const container = document.getElementById(targetId);
        if (!container) return;

        // Purge existing Plotly instance and clear container
        try { Plotly.purge(container); } catch (e) { }
        container.innerHTML = '';

        if (!data || data.length === 0 || !xColumn || !yColumns || yColumns.length === 0) {
            clearChart(targetId);
            return;
        }

        // Trim trailing rows with no valid Y data to ensure chart fills the available space
        let lastValidIndex = -1;
        for (let i = data.length - 1; i >= 0; i--) {
            const hasData = yColumns.some(yCol => {
                const val = ExcelParser.parseNumber(data[i][yCol]);
                return !isNaN(val);
            });
            if (hasData) {
                lastValidIndex = i;
                break;
            }
        }

        const chartData = (lastValidIndex === -1) ? [] : data.slice(0, lastValidIndex + 1);
        if (chartData.length === 0) {
            clearChart(targetId);
            return;
        }

        const currentIsDark = isDark();
        const colorPalette = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const oosColor = currentIsDark ? '#fde047' : '#ef4444';

        const traces = yColumns.map((yCol, idx) => {
            const rawValues = chartData.map(row => row[yCol]);
            const yValues = rawValues.map(v => ExcelParser.parseNumber(v));
            const baseColor = colorPalette[idx % colorPalette.length];

            const markerColors = yValues.map(val => {
                const isOOS = (!isNaN(specs.usl) && val > specs.usl) ||
                    (!isNaN(specs.lsl) && val < specs.lsl);
                return isOOS ? oosColor : baseColor;
            });

            const markerSizes = yValues.map(val => {
                const isOOS = (!isNaN(specs.usl) && val > specs.usl) ||
                    (!isNaN(specs.lsl) && val < specs.lsl);
                return isOOS ? 10 : 6;
            });

            return {
                x: chartData.map((_, i) => i), // Use index as X to keep points separate
                text: chartData.map(row => {
                    let txt = String(row[xColumn] ?? '');
                    if (xColumn2) txt += ` | ${String(row[xColumn2] ?? '')}`;
                    return txt;
                }),
                y: yValues,
                name: yCol,
                mode: 'markers+lines',
                customdata: chartData.map(row => {
                    return {
                        x1: String(row[xColumn] ?? ''),
                        x2: xColumn2 ? String(row[xColumn2] ?? '') : null
                    };
                }),
                hovertemplate: `<b>${xColumn}: %{customdata.x1}</b>${xColumn2 ? `<br><b>${xColumn2}: %{customdata.x2}</b>` : ''}<br>${yCol}: %{y:.4f}<extra></extra>`,
                type: 'scatter',
                line: { width: 2, color: baseColor },
                marker: {
                    size: markerSizes,
                    color: markerColors,
                    line: {
                        color: currentIsDark ? '#1e293b' : '#ffffff',
                        width: yValues.map((v, i) => markerColors[i] === oosColor ? 1.5 : 0)
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

        const addLimitLine = (val, label, color, dash, width = 2) => {
            if (isNaN(val)) return;
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: val, y1: val,
                line: { color: color, width: width, dash: dash }
            });
            annotations.push({
                xref: 'paper', x: 1, y: val, yref: 'y',
                text: `<b>${label}: ${val.toFixed(4)}</b>`,
                showarrow: false,
                xanchor: 'right', // Changed to right anchor to stay inside plotting area
                yanchor: 'bottom',
                font: { color: color, size: 10 },
                bgcolor: currentIsDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                borderpad: 2
            });
        };

        addLimitLine(specs.target, 'Target', '#10b981', '40px 10px 10px 10px');
        addLimitLine(specs.usl, 'USL', '#ef4444', 'dash');
        addLimitLine(specs.lsl, 'LSL', '#ef4444', 'dash');

        if (stats) {
            addLimitLine(stats.ucl, 'UCL', 'rgba(245, 158, 11, 1)', 'dot', 1.5);
            addLimitLine(stats.lcl, 'LCL', 'rgba(245, 158, 11, 1)', 'dot', 1.5);
        }

        const layout = {
            title: {
                text: `${sheetName ? sheetName + ' ' : ''}數據趨勢圖 (${yColumns.join(', ')})`,
                font: { family: 'Outfit', color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: currentIsDark ? '#0f172a' : '#ffffff',
            plot_bgcolor: currentIsDark ? '#0f172a' : '#ffffff',
            shapes: shapes,
            annotations: annotations,
            xaxis: {
                title: {
                    text: xColumn,
                    font: { color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 12 }
                },
                type: 'linear',           // Explicitly force linear axis
                tickmode: 'array',        // Explicitly use array mode for ticks
                tickvals: chartData.map((_, i) => i),
                ticktext: (() => {
                    const colors = currentIsDark ? ['#cbd5e1', '#38bdf8'] : ['#475569', '#0284c7'];
                    let colorIdx = 0;
                    return chartData.map((row, i) => {
                        const val = String(row[xColumn] ?? '');
                        if (i > 0) {
                            const prevVal = String(chartData[i - 1][xColumn] ?? '');
                            if (val !== prevVal) colorIdx = (colorIdx + 1) % colors.length;
                        }
                        return `<span style="color: ${colors[colorIdx]}">${val}</span>`;
                    });
                })(),
                gridcolor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                zerolinecolor: currentIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                tickfont: { size: 10 },
                range: [-0.5, chartData.length - 0.5], // Ensure all points are visible
                automargin: true,          // Ensure long labels don't get cut off
                anchor: 'y'
            },
            yaxis: {
                title: {
                    text: '數值',
                    font: { color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 12 }
                },
                gridcolor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                zerolinecolor: currentIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                tickfont: { color: currentIsDark ? '#cbd5e1' : '#475569' },
                anchor: 'x'
            },
            legend: {
                font: { family: 'Inter', color: currentIsDark ? '#f1f5f9' : '#0f172a' },
                orientation: 'h', y: -0.2
            },
            margin: { t: 60, r: 80, l: 60, b: 80 },
            autosize: true,
            height: container.closest('.single-view') ? 800 : 450,
            hovermode: 'closest'
        };

        if (!isNaN(specs.target) && specs.target !== 0) {
            layout.yaxis2 = {
                title: '偏離目標 (%)',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickfont: { color: '#10b981', size: 10 },
                titlefont: { color: '#10b981', size: 11 },
                tickformat: '.2f',
                ticksuffix: '%',
                anchor: 'x'
            };
        }

        if (xColumn2) {
            layout.xaxis2 = {
                title: {
                    text: xColumn2,
                    font: { color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 12 }
                },
                overlaying: 'x',
                side: 'top',
                tickmode: 'array',
                tickvals: chartData.map((_, i) => i),
                ticktext: (() => {
                    const colors = currentIsDark ? ['#cbd5e1', '#38bdf8'] : ['#475569', '#0284c7'];
                    let colorIdx = 0;
                    return chartData.map((row, i) => {
                        const val = String(row[xColumn2] ?? '');
                        if (i > 0) {
                            const prevVal = String(chartData[i - 1][xColumn2] ?? '');
                            if (val !== prevVal) colorIdx = (colorIdx + 1) % colors.length;
                        }
                        return `<span style="color: ${colors[colorIdx]}">${val}</span>`;
                    });
                })(),
                gridcolor: 'rgba(0,0,0,0)', // Hide grid for top axis
                tickfont: { size: 10 },
                range: [-0.5, chartData.length - 0.5],
                anchor: 'y'
            };
        }

        // Use Plotly.newPlot and handle the promise
        Plotly.newPlot(container, traces, layout, { responsive: true, displaylogo: false }).then(gd => {
            if (!isNaN(specs.target) && specs.target !== 0) {
                const sync = () => {
                    if (!gd || !gd.layout || !gd.layout.yaxis) return;
                    const r = gd.layout.yaxis.range;
                    if (!r) return;

                    const nr = [((r[0] - specs.target) / specs.target) * 100, ((r[1] - specs.target) / specs.target) * 100];
                    Plotly.relayout(gd, { 'yaxis2.range': nr, 'yaxis2.autorange': false }).catch(() => { });
                };

                gd.on('plotly_relayout', (edata) => {
                    if (edata['yaxis.range[0]'] !== undefined) {
                        const r0 = edata['yaxis.range[0]'];
                        const r1 = edata['yaxis.range[1]'];
                        Plotly.relayout(gd, {
                            'yaxis2.range': [((r0 - specs.target) / specs.target) * 100, ((r1 - specs.target) / specs.target) * 100],
                            'yaxis2.autorange': false
                        }).catch(() => { });
                    }
                });

                // Trigger initial sync
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
                <span class="material-icons-round">insights</span>
                <p>請選擇數據欄位並點擊更新圖表</p>
            </div>
        `;
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
    const renderNormalDistChart = (data, columns, specs = {}, targetId = 'plotly-dist', sheetName = '') => {
        const container = document.getElementById(targetId);
        if (!container) return;

        try { Plotly.purge(container); } catch (e) { }
        container.innerHTML = '';

        if (!data || data.length === 0 || !columns || columns.length === 0) {
            clearChart(targetId);
            return;
        }

        const currentIsDark = isDark();
        const colorPalette = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const allTraces = [];
        const shapes = [];
        const annotations = [];

        // Global min/max for curve X-axis range
        let globalMin = Infinity;
        let globalMax = -Infinity;

        const columnStats = columns.map((col, idx) => {
            const values = data.map(row => ExcelParser.parseNumber(row[col])).filter(v => !isNaN(v));
            if (values.length === 0) return null;

            const stats = ExcelParser.getStats(values, specs);
            const baseColor = colorPalette[idx % colorPalette.length];

            // Update global range
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

        columnStats.forEach(({ col, values, stats, baseColor }) => {
            const { mean, stdevOverall } = stats;
            const sigma = stdevOverall;

            // 1. Histogram (only if single column to avoid clutter, or very transparent)
            allTraces.push({
                x: values,
                type: 'histogram',
                name: `${col} 分佈`,
                nbinsx: 30,
                histnorm: 'probability density',
                visible: columnStats.length === 1 ? true : 'legendonly', // Hide by default if multiple
                marker: {
                    color: baseColor,
                    opacity: 0.2,
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

            // 3. Sigma Markers (Only for the first selected column to avoid mess, or none)
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
                    marker: { color: baseColor, size: 8 },
                    showlegend: false
                });
            }
        });

        // 4. Common Specs
        const addLimit = (val, label, color, dash) => {
            if (isNaN(val)) return;
            shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: val, x1: val, y0: 0, y1: 0.9, line: { color: color, width: 2, dash: dash } });
            annotations.push({
                x: val, y: 0.95, xref: 'x', yref: 'paper',
                text: `<b>${label}: ${val.toFixed(4)}</b>`,
                showarrow: false,
                font: { color: color, size: 10 },
                bgcolor: currentIsDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)'
            });
        };

        addLimit(specs.target, 'Target', '#10b981', '40px 10px 10px 10px');
        addLimit(specs.usl, 'USL', '#ef4444', 'dash');
        addLimit(specs.lsl, 'LSL', '#ef4444', 'dash');

        const layout = {
            title: {
                text: `${sheetName ? sheetName + ' ' : ''}常態分佈對比分析`,
                font: { family: 'Outfit', color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: currentIsDark ? '#0f172a' : '#ffffff',
            plot_bgcolor: currentIsDark ? '#0f172a' : '#ffffff',
            shapes: shapes,
            annotations: annotations,
            xaxis: {
                title: {
                    text: '數值',
                    font: { family: 'Inter', color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 12 }
                },
                gridcolor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                zerolinecolor: currentIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                tickfont: { family: 'Inter', color: currentIsDark ? '#cbd5e1' : '#475569' },
                range: [globalMin, globalMax]
            },
            yaxis: {
                title: {
                    text: '密度',
                    font: { family: 'Inter', color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 12 }
                },
                gridcolor: currentIsDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                zerolinecolor: currentIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                tickfont: { family: 'Inter', color: currentIsDark ? '#cbd5e1' : '#475569' }
            },
            legend: {
                font: { family: 'Inter', color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 11 },
                orientation: 'h', y: -0.25
            },
            margin: { t: 60, r: 40, l: 70, b: 120 },
            height: container.closest('.single-view') ? 800 : 450,
            hovermode: 'closest',
            bargap: 0.1
        };

        Plotly.newPlot(container, allTraces, layout, { responsive: true, displaylogo: false });
    };

    return { renderTrendChart, renderNormalDistChart, clearChart, exportChart };
})();
