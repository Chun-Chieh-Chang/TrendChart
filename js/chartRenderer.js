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
     * @param {Object} specs - USL/LSL limits
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

        const traces = yColumns.map((yCol, idx) => {
            const rawValues = data.map(row => row[yCol]);
            const yValues = rawValues.map(v => ExcelParser.parseNumber(v));
            const baseColor = colorPalette[idx % colorPalette.length];

            // Highlight OOS points in red
            const markerColors = yValues.map(val => {
                const isOOS = (!isNaN(specs.usl) && val > specs.usl) ||
                    (!isNaN(specs.lsl) && val < specs.lsl);
                return isOOS ? '#ef4444' : baseColor;
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
                mode: 'lines+markers',
                type: 'scatter',
                line: { width: 2, color: baseColor },
                marker: {
                    size: markerSizes,
                    color: markerColors,
                    line: {
                        color: currentIsDark ? '#1e293b' : '#ffffff',
                        width: yValues.map((v, i) => markerColors[i] === '#ef4444' ? 1.5 : 0)
                    }
                }
            };
        });

        const shapes = [];
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
            margin: { t: 60, r: 40, l: 70, b: 80 },
            autosize: true,
            height: 400,
            hovermode: 'closest'
        };

        Plotly.newPlot(targetId, traces, layout, { responsive: true, displaylogo: false });
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
        const sigmaLabels = ['-3\u03c3', '-2\u03c3', '-1\u03c3', '\u5e73\u5747\u503c', '+1\u03c3', '+2\u03c3', '+3\u03c3'];
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
