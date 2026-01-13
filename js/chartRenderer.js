/**
 * Chart Renderer Module
 * Handles Plotly.js chart generation and updates
 */
const ChartRenderer = (() => {
    const chartId = 'plotly-chart';

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
        if (!data || data.length === 0 || !xColumn || !yColumns || yColumns.length === 0) {
            clearChart();
            return;
        }

        // Clear placeholder/previous content before Plotly renders
        container.innerHTML = '';

        const traces = yColumns.map(yCol => {
            return {
                x: data.map(row => row[xColumn]),
                y: data.map(row => {
                    const val = row[yCol];
                    return (typeof val === 'string') ? parseFloat(val) : val;
                }),
                name: yCol,
                mode: 'lines+markers',
                type: 'scatter',
                line: { width: 2 }, // Default is linear
                marker: { size: 6 }
            };
        });

        const isDarkMode = document.body.classList.contains('dark-mode');

        // Add Spec Limits as horizontal lines
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

        // Add Control Limits as horizontal lines
        if (stats && !isNaN(stats.ucl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: stats.ucl, y1: stats.ucl,
                line: { color: 'rgba(245, 158, 11, 0.7)', width: 1.5, dash: 'dot' },
                name: 'UCL'
            });
        }
        if (stats && !isNaN(stats.lcl)) {
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: stats.lcl, y1: stats.lcl,
                line: { color: 'rgba(245, 158, 11, 0.7)', width: 1.5, dash: 'dot' },
                name: 'LCL'
            });
        }

        const layout = {
            title: {
                text: `數據趨勢圖 (${yColumns.join(', ')})`,
                font: { color: isDarkMode ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: shapes,
            xaxis: {
                title: xColumn,
                gridcolor: isDarkMode ? '#334155' : '#e2e8f0',
                tickfont: { color: isDarkMode ? '#94a3b8' : '#475569' },
                titlefont: { color: isDarkMode ? '#94a3b8' : '#475569' }
            },
            yaxis: {
                title: '數值',
                gridcolor: isDarkMode ? '#334155' : '#e2e8f0',
                tickfont: { color: isDarkMode ? '#94a3b8' : '#475569' },
                titlefont: { color: isDarkMode ? '#94a3b8' : '#475569' }
            },
            legend: {
                font: { color: isDarkMode ? '#f1f5f9' : '#0f172a' }
            },
            margin: { t: 60, r: 40, l: 70, b: 80 }, // Increased Left margin
            autosize: true,
            height: 400,
            hovermode: 'closest'
        };

        const config = {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['select2d', 'lasso2d']
        };

        Plotly.newPlot(targetId, traces, layout, config);
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
     * Render Normal Distribution Analysis (Histogram + Curve)
     * @param {Array} data
     * @param {string} column
     * @param {Object} specs
     * @param {string} targetId
     */
    const renderNormalDistChart = (data, column, specs = {}, targetId = 'plotly-dist') => {
        const container = document.getElementById(targetId);
        const values = data.map(row => {
            const val = row[column];
            return (typeof val === 'string') ? parseFloat(val) : val;
        }).filter(v => !isNaN(v));

        if (values.length === 0) {
            clearChart();
            return;
        }

        container.innerHTML = '';
        const stats = ExcelParser.getStats(values, specs);
        const { mean, stdevOverall, ca, cp, cpk, ppk } = stats;
        const sigma = stdevOverall; // Use overall standard deviation for the curve

        const titlePrefix = `${column} 常態分析`;
        const metrics = [];
        if (cpk !== null) metrics.push(`Cpk: ${cpk.toFixed(3)}`);
        if (ppk !== null) metrics.push(`Ppk: ${ppk.toFixed(3)}`);
        const metricsText = metrics.length > 0 ? ` (${metrics.join(', ')})` : '';

        // Histogram Trace
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

        // Normal Curve Trace
        const min = Math.min(...values, mean - 4 * sigma);
        const max = Math.max(...values, mean + 4 * sigma);
        const curveX = [];
        const curveY = [];
        for (let i = 0; i <= 100; i++) {
            const x = min + (i * (max - min) / 100);
            curveX.push(x);
            curveY.push(ExcelParser.normDist(x, mean, sigma));
        }

        const traceCurve = {
            x: curveX,
            y: curveY,
            type: 'scatter',
            mode: 'lines',
            name: '常態分佈曲線',
            line: { color: '#0ea5e9', width: 3 }
        };

        // Sigma Multipliers for Markers
        const sigmaMarkersX = [];
        const sigmaMarkersY = [];
        const sigmaLabels = ['-3σ', '-2σ', '-1σ', '平均值', '+1σ', '+2σ', '+3σ'];
        for (let i = -3; i <= 3; i++) {
            const x = mean + i * sigma;
            sigmaMarkersX.push(x);
            sigmaMarkersY.push(ExcelParser.normDist(x, mean, sigma));
        }

        const traceSigma = {
            x: sigmaMarkersX,
            y: sigmaMarkersY,
            type: 'scatter',
            mode: 'markers+text',
            name: 'σ 標記',
            text: sigmaLabels,
            textposition: 'top center',
            marker: { color: '#ef4444', size: 8 }
        };

        const shapes = [];
        if (!isNaN(specs.usl)) {
            shapes.push({
                type: 'line', xref: 'x', yref: 'paper', x0: specs.usl, x1: specs.usl, y0: 0, y1: 0.9,
                line: { color: '#ef4444', width: 2, dash: 'dash' }
            });
        }
        if (!isNaN(specs.lsl)) {
            shapes.push({
                type: 'line', xref: 'x', yref: 'paper', x0: specs.lsl, x1: specs.lsl, y0: 0, y1: 0.9,
                line: { color: '#ef4444', width: 2, dash: 'dash' }
            });
        }

        // Add Control Limits as vertical lines
        const statsObj = ExcelParser.getStats(values, specs);
        if (statsObj && !isNaN(statsObj.ucl)) {
            shapes.push({
                type: 'line', xref: 'x', yref: 'paper', x0: statsObj.ucl, x1: statsObj.ucl, y0: 0, y1: 0.8,
                line: { color: 'rgba(245, 158, 11, 0.6)', width: 1.5, dash: 'dot' }
            });
        }
        if (statsObj && !isNaN(statsObj.lcl)) {
            shapes.push({
                type: 'line', xref: 'x', yref: 'paper', x0: statsObj.lcl, x1: statsObj.lcl, y0: 0, y1: 0.8,
                line: { color: 'rgba(245, 158, 11, 0.6)', width: 1.5, dash: 'dot' }
            });
        }

        const isDarkMode = document.body.classList.contains('dark-mode');
        const layout = {
            title: {
                text: `${titlePrefix}${metricsText} (n=${values.length})`,
                font: { color: isDarkMode ? '#f1f5f9' : '#0f172a', size: 16 }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: shapes,
            xaxis: {
                title: column,
                gridcolor: isDarkMode ? '#334155' : '#e2e8f0',
                tickfont: { color: isDarkMode ? '#94a3b8' : '#475569' }
            },
            yaxis: {
                title: '機率密度',
                gridcolor: isDarkMode ? '#334155' : '#e2e8f0',
                tickfont: { color: isDarkMode ? '#94a3b8' : '#475569' }
            },
            legend: { font: { color: isDarkMode ? '#f1f5f9' : '#0f172a' }, orientation: 'h', y: -0.25 },
            margin: { t: 60, r: 40, l: 70, b: 120 }, // Increased bottom/left for labels
            height: 400,
            hovermode: 'closest',
            bargap: 0.1
        };

        Plotly.newPlot(targetId, [traceHist, traceCurve, traceSigma], layout, { responsive: true, displaylogo: false });
    };

    return {
        renderTrendChart,
        renderNormalDistChart,
        clearChart,
        exportChart
    };
})();
