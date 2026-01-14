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
    const renderTrendChart = (data, xColumn, yColumns, specs = {}, stats = null, targetId = 'plotly-trend') => {
        const container = document.getElementById(targetId);
        if (!container) return;
        if (!data || data.length === 0 || !xColumn || !yColumns || yColumns.length === 0) {
            clearChart(targetId);
            return;
        }

        // Clear placeholder/previous content before Plotly renders
        container.innerHTML = '';

        const currentIsDark = isDark();
        const colorPalette = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

        // Define OOS color based on dark mode (Yellow in dark mode, Red in light mode)
        const oosColor = currentIsDark ? '#fbbf24' : '#ef4444';

        const traces = yColumns.map((yCol, idx) => {
            const rawValues = data.map(row => row[yCol]);
            const yValues = rawValues.map(v => ExcelParser.parseNumber(v));
            const baseColor = colorPalette[idx % colorPalette.length];

            // Highlight OOS points
            const markerColors = yValues.map(val => {
                const isOOS = (!isNaN(specs.usl) && val > specs.usl) ||
                    (!isNaN(specs.lsl) && val < specs.lsl);
                return isOOS ? oosColor : baseColor;
            });

            // Make OOS markers slightly larger
            const markerSizes = yValues.map(val => {
                const isOOS = (!isNaN(specs.usl) && val > specs.usl) ||
                    (!isNaN(specs.lsl) && val < specs.lsl);
                return isOOS ? 10 : 6;
            });

            return {
                x: data.map(row => row[xColumn]),
                y: yValues,
                name: yCol,
                mode: 'markers+lines',
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

        const shapes = [];
        // Green Center Line (Long-Short-Long pattern)
        if (!isNaN(specs.target)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: specs.target, y1: specs.target,
                line: { color: '#10b981', width: 2, dash: '40px 10px 10px 10px' }
            });
        }
        if (!isNaN(specs.usl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: specs.usl, y1: specs.usl,
                line: { color: '#ef4444', width: 2, dash: 'dash' }
            });
        }
        if (!isNaN(specs.lsl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: specs.lsl, y1: specs.lsl,
                line: { color: '#ef4444', width: 2, dash: 'dash' }
            });
        }

        if (stats && !isNaN(stats.ucl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: stats.ucl, y1: stats.ucl,
                line: { color: 'rgba(245, 158, 11, 0.7)', width: 1.5, dash: 'dot' }
            });
        }
        if (stats && !isNaN(stats.lcl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: stats.lcl, y1: stats.lcl,
                line: { color: 'rgba(245, 158, 11, 0.7)', width: 1.5, dash: 'dot' }
            });
        }

        const layout = {
            title: {
                text: `數據趨勢圖 (${yColumns.join(', ')})`,
                font: { color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: shapes,
            xaxis: {
                title: xColumn,
                gridcolor: currentIsDark ? '#334155' : '#e2e8f0',
                tickfont: { color: currentIsDark ? '#94a3b8' : '#475569' },
                titlefont: { color: currentIsDark ? '#94a3b8' : '#475569' }
            },
            yaxis: {
                title: '數值',
                gridcolor: currentIsDark ? '#334155' : '#e2e8f0',
                tickfont: { color: currentIsDark ? '#94a3b8' : '#475569' },
                titlefont: { color: currentIsDark ? '#94a3b8' : '#475569' }
            },
            legend: {
                font: { color: currentIsDark ? '#f1f5f9' : '#0f172a' }
            },
            margin: { t: 60, r: 80, l: 70, b: 80 },
            autosize: true,
            height: 400,
            hovermode: 'closest'
        };

        // Add Secondary Axis for Percentage Deviation if Target exists
        if (!isNaN(specs.target) && specs.target !== 0) {
            layout.yaxis2 = {
                title: '偏離目標 (%)',
                overlaying: 'y',
                side: 'right',
                showgrid: false,
                tickfont: { color: '#10b981', size: 10 },
                titlefont: { color: '#10b981', size: 12 },
                anchor: 'free',
                position: 1
            };

            // To effectively create a secondary scale that is tied to the primary scale,
            // we need to set the range of yaxis2 based on yaxis1.
            // Since yaxis1 range might be auto, we can use a dummy trace or let Plotly handle it 
            // but manual range sync is most robust.
            // However, Plotly 'tickvals/ticktext' is easier for a "mirror" scale.
        }

        Plotly.newPlot(targetId, traces, layout, { responsive: true, displaylogo: false });

        // Sync Y-axis scaling for percentage if target exists
        if (!isNaN(specs.target) && specs.target !== 0) {
            const gd = document.getElementById(targetId);
            const updateY2 = () => {
                const y1Range = gd.layout.yaxis.range;
                const y2Range = [
                    ((y1Range[0] - specs.target) / specs.target) * 100,
                    ((y1Range[1] - specs.target) / specs.target) * 100
                ];
                Plotly.relayout(targetId, { 'yaxis2.range': y2Range });
            };
            // Initial sync
            setTimeout(updateY2, 100);
        }
    };

    /**
     * Clear chart and show empty state
     */
    const clearChart = (targetId = 'plotly-trend') => {
        const container = document.getElementById(targetId);
        if (!container) return;
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
                filename: targetId === 'plotly-trend' ? 'trend_chart' : 'normal_dist'
            });
        }
    };

    /**
     * Render Normal Distribution Analysis
     */
    const renderNormalDistChart = (data, column, specs = {}, targetId = 'plotly-dist') => {
        const container = document.getElementById(targetId);
        if (!container) return;
        const values = data.map(row => ExcelParser.parseNumber(row[column])).filter(v => !isNaN(v));

        if (values.length === 0) {
            clearChart(targetId);
            return;
        }

        container.innerHTML = '';
        const stats = ExcelParser.getStats(values, specs);
        const { mean, stdevOverall, cpk, ppk } = stats;
        const sigma = stdevOverall;
        const currentIsDark = isDark();

        const traceHist = {
            x: values,
            type: 'histogram',
            name: '數據分佈',
            nbinsx: 20,
            histnorm: 'probability density',
            marker: {
                color: 'rgba(100, 116, 139, 0.4)',
                line: { color: 'rgba(100, 116, 139, 1)', width: 1 }
            }
        };

        const min = Math.min(...values, mean - 4 * sigma);
        const max = Math.max(...values, mean + 4 * sigma);
        const curveX = [], curveY = [];
        for (let i = 0; i <= 100; i++) {
            const x = min + (i * (max - min) / 100);
            curveX.push(x);
            curveY.push(ExcelParser.normDist(x, mean, sigma));
        }

        const traceCurve = {
            x: curveX, y: curveY, type: 'scatter', mode: 'lines',
            name: '常態分佈曲線', line: { color: '#0ea5e9', width: 3 }
        };

        const sigmaMarkersX = [], sigmaMarkersY = [];
        const sigmaLabels = ['-3\u03c3', '-2\u03c3', '-1\u03c3', '平均值', '+1\u03c3', '+2\u03c3', '+3\u03c3'];
        for (let i = -3; i <= 3; i++) {
            const x = mean + i * sigma;
            sigmaMarkersX.push(x);
            sigmaMarkersY.push(ExcelParser.normDist(x, mean, sigma));
        }

        const traceSigma = {
            x: sigmaMarkersX, y: sigmaMarkersY, type: 'scatter', mode: 'markers+text',
            name: '\u03c3 \u6a19\u8a18', text: sigmaLabels, textposition: 'top center',
            marker: { color: '#ef4444', size: 8 }
        };

        const shapes = [];
        if (!isNaN(specs.target)) shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: specs.target, x1: specs.target, y0: 0, y1: 0.9, line: { color: '#10b981', width: 2, dash: '40px 10px 10px 10px' } });
        if (!isNaN(specs.usl)) shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: specs.usl, x1: specs.usl, y0: 0, y1: 0.9, line: { color: '#ef4444', width: 2, dash: 'dash' } });
        if (!isNaN(specs.lsl)) shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: specs.lsl, x1: specs.lsl, y0: 0, y1: 0.9, line: { color: '#ef4444', width: 2, dash: 'dash' } });

        const layout = {
            title: {
                text: `${column} 常態分析 (Cpk:${(cpk || 0).toFixed(3)}, Ppk:${(ppk || 0).toFixed(3)})`,
                font: { color: currentIsDark ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: shapes,
            xaxis: { title: column, gridcolor: currentIsDark ? '#334155' : '#e2e8f0', tickfont: { color: currentIsDark ? '#94a3b8' : '#475569' } },
            yaxis: { title: '\u6a5f\u7387\u5bc6\u5ea6', gridcolor: currentIsDark ? '#334155' : '#e2e8f0', tickfont: { color: currentIsDark ? '#94a3b8' : '#475569' } },
            legend: { font: { color: currentIsDark ? '#f1f5f9' : '#0f172a' }, orientation: 'h', y: -0.25 },
            margin: { t: 60, r: 40, l: 70, b: 120 },
            height: 400,
            hovermode: 'closest',
            bargap: 0.1
        };

        Plotly.newPlot(targetId, [traceHist, traceCurve, traceSigma], layout, { responsive: true, displaylogo: false });
    };

    return { renderTrendChart, renderNormalDistChart, clearChart, exportChart };
})();
