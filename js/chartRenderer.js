/**
 * Chart Renderer Module
 * Handles Plotly.js chart generation and updates for Precision Instrument Workbench
 */
const ChartRenderer = (() => {
    const TREND_CHART_HEIGHT_RATIO = 0.8;
    const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    const COLOR_PALETTE = ['#0284c7', '#06b6d4', '#10b981', '#d97706', '#64748b'];
    const OOS_COLOR = '#dc2626';

    // --- Draggable Annotation State ---
    const _dragState = new Map(); // gd -> { active, startY, startDataY, lineType, chartId }

    /**
     * Set up mouse drag handlers on Plotly annotation labels.
     * Uses Plotly.restyle to move both the line shape and annotation simultaneously.
     */
    const setupAnnotationDrag = (gd, chartId) => {
        if (_dragState.has(gd)) return;

        // Find the plot container element (try multiple possible locations)
        const plotEl = (gd._fullLayout && gd._fullLayout.container) ||
                       document.getElementById(chartId);
        if (!plotEl) {
            console.warn('[SPC] setupAnnotationDrag: no container found for', chartId);
            return;
        }

        const labels = plotEl.querySelectorAll('.plotlytext.draggable-annotation');
        console.log('[SPC] setupAnnotationDrag: found', labels.length, 'draggable labels for', chartId);
        if (!labels.length) return;

        const setDragCursor = (el, dragging) => {
            el.classList.toggle('dragging', dragging);
            el.style.cursor = dragging ? 'grabbing' : 'grab';
        };

        labels.forEach(labelEl => {
            const lineType = labelEl.dataset.lineType;
            if (!lineType) return;

            // Get the annotation index stored on the element
            const annIdxAttr = labelEl.dataset.annIdx;
            if (annIdxAttr === undefined) return;
            const annIndex = parseInt(annIdxAttr, 10);

            // Find the corresponding annotation in full layout
            const fullAnns = gd._fullLayout && gd._fullLayout.annotations;
            if (!fullAnns || !fullAnns[annIndex]) return;
            const ann = fullAnns[annIndex];

            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const startY = e.clientY;
                const startDataY = ann.y;
                const yRange = gd.layout.yaxis && gd.layout.yaxis.range;
                if (!yRange || yRange.length < 2) return;

                const [yMin, yMax] = yRange;
                const svgHeight = plotEl.querySelector('.main-svg')
                    ? plotEl.querySelector('.main-svg').getBoundingClientRect().height
                    : plotEl.getBoundingClientRect().height;
                const dataUnitsPerPixel = (yMax - yMin) / svgHeight;

                const state = { active: true, startY, startDataY, lineType, chartId, dataUnitsPerPixel, annIndex, deltaY: 0 };
                _dragState.set(gd, state);

                setDragCursor(labelEl, true);

                const onMouseMove = (ev) => {
                    if (!_dragState.get(gd)?.active) return;
                    ev.preventDefault();
                    const deltaY = (ev.clientY - startY) * state.dataUnitsPerPixel;
                    state.deltaY = deltaY;
                    const newY = state.startDataY - deltaY;
                    Plotly.restyle(gd, { 'annotations.y': [newY] }, [state.annIndex]).catch(() => {});
                    Plotly.restyle(gd, { 'shapes.y0': [newY], 'shapes.y1': [newY] }, [state.annIndex]).catch(() => {});
                };

                const onMouseUp = () => {
                    if (!_dragState.get(gd)?.active) return;
                    const state = _dragState.get(gd);
                    _dragState.delete(gd);
                    setDragCursor(labelEl, false);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    // Convert pixel delta to data units and save
                    const dataOffset = state.deltaY / state.dataUnitsPerPixel;
                    if (window.SPCApp) window.SPCApp.setAnnotationOffset(state.chartId, state.lineType, dataOffset);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            labelEl.addEventListener('mousedown', onMouseDown);
        });
    };

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

        const isLabelLeft = specs.labelSide === 'left';
        const addLimitLine = (val, label, color, dash, width = 1.5, lineType = '') => {
            if (isNaN(val)) return;
            let yOffset = 0;
            if (lineType && window.SPCApp) yOffset = SPCApp.getAnnotationOffset(targetId, lineType);
            const yAdj = val + yOffset;
            shapes.push({
                type: 'line', yref: 'y', xref: 'paper', x0: 0, x1: 1, y0: yAdj, y1: yAdj,
                line: { color: color, width: width, dash: dash }
            });
            const annIdx = annotations.length;
            annotations.push({
                xref: 'paper', x: isLabelLeft ? 0 : 1, y: yAdj, yref: 'y',
                text: `<b>${label}: ${yAdj.toFixed(4)}</b>`,
                showarrow: false,
                xanchor: isLabelLeft ? 'left' : 'right',
                yanchor: 'bottom',
                font: { family: FONT_FAMILY, color: color, size: 10 },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#cbd5e1',
                borderwidth: 1,
                borderpad: 2
            });
            // Store draggable info in module-level map (gd doesn't exist yet)
            if (!window._spcChartDraggables) window._spcChartDraggables = {};
            if (!window._spcChartDraggables[targetId]) window._spcChartDraggables[targetId] = {};
            if (lineType) window._spcChartDraggables[targetId][lineType] = annIdx;
        };

        if (specs.showTarget !== false) {
            addLimitLine(specs.target, 'Target', '#10b981', '40px 10px 10px 10px', 2, 'target');
        }

        if (specs.showSpec !== false) {
            addLimitLine(specs.usl, 'USL', '#dc2626', 'dash', 1.5, 'usl');
            addLimitLine(specs.lsl, 'LSL', '#dc2626', 'dash', 1.5, 'lsl');
        }

        if (stats && specs.showLimits !== false) {
            addLimitLine(stats.ucl, 'UCL', '#d97706', 'dot', 1.5, 'ucl');
            addLimitLine(stats.lcl, 'LCL', '#d97706', 'dot', 1.5, 'lcl');
            addLimitLine(stats.mean, 'CL', 'rgba(217, 119, 6, 0.8)', 'dash', 1, 'cl');
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
            margin: { t: xColumn2 ? 110 : 70, r: isLabelLeft ? 40 : 80, l: isLabelLeft ? 100 : 60, b: 110 }
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

            // Mark draggable annotations with CSS class using RAF polling
            // (Plotly's Promise resolves before SVG text elements are in DOM)
            const cls = 'draggable-annotation';
            const spcDraggables = window._spcChartDraggables && window._spcChartDraggables[targetId] || {};
            const lineTypes = Object.keys(spcDraggables);
            console.log('[SPC] renderTrendChart: _spcChartDraggables keys =', lineTypes, 'count =', lineTypes.length);

            if (lineTypes.length > 0) {
                let marking = false;
                const doMark = () => {
                    if (marking) return;
                    marking = true;
                    // DIAGNOSTIC: check what's actually in the container
                    const svgEl = container.querySelector('svg');
                    const allPlotlyText = Array.from(container.querySelectorAll('.plotlytext'));
                    const allTextElements = Array.from(container.querySelectorAll('text'));
                    console.log('[SPC] doMark: plotlytext=', allPlotlyText.length, 'all text=', allTextElements.length, 'svg exists=', !!svgEl);
                    if (!allPlotlyText.length) {
                        // Show what SVG elements exist
                        if (svgEl) {
                            const ns = svgEl.querySelector('g[class*="annotation"] text');
                            console.log('[SPC] doMark: annotation text found via selector =', !!ns);
                            const tspanEls = svgEl.querySelectorAll('tspan');
                            console.log('[SPC] doMark: tspans count =', tspanEls.length);
                        }
                        marking = false;
                        requestAnimationFrame(doMark);
                        return;
                    }
                    let marked = 0;
                    lineTypes.forEach(lineType => {
                        const annIdx = spcDraggables[lineType];
                        const ann = (gd._fullLayout && gd._fullLayout.annotations && gd._fullLayout.annotations[annIdx]) || null;
                        if (!ann) { console.warn('[SPC] doMark: no ann at', annIdx, 'for', lineType); return; }
                        const cleanText = (ann.text || '').replace(/<[^>]*>/g, '').trim();
                        const foundEl = allPlotlyText.find(el => {
                            const tc = (el.textContent || '').replace(/\s+/g, '');
                            return tc.includes(cleanText.replace(/\s+/g, ''));
                        });
                        if (foundEl) {
                            foundEl.classList.add(cls);
                            foundEl.setAttribute('data-line-type', lineType);
                            foundEl.setAttribute('data-ann-idx', String(annIdx));
                            console.log('[SPC] doMark: MATCHED', lineType, '->', foundEl.tagName);
                            marked++;
                        } else {
                            console.warn('[SPC] doMark: NOT FOUND', lineType);
                        }
                    });
                    marking = false;
                    if (marked >= lineTypes.length) {
                        setupAnnotationDrag(gd, targetId);
                    } else {
                        // Retry once more after a short delay
                        setTimeout(() => requestAnimationFrame(doMark), 150);
                    }
                };
                requestAnimationFrame(doMark);
            } else {
                console.log('[SPC] renderTrendChart: no draggable annotations');
                setupAnnotationDrag(gd, targetId);
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
        // Clean up drag state
        for (const [gd] of _dragState) {
            if (gd._fullLayout && gd._fullLayout.container === container) _dragState.delete(gd);
        }
        // Clear stored mappings for this chart
        if (window._spcChartDraggables) delete window._spcChartDraggables[targetId];
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
        const addLimit = (val, label, color, dash, width = 1.5, lineType = '') => {
            if (isNaN(val)) return;
            let yOffset = 0;
            if (lineType && window.SPCApp) yOffset = SPCApp.getAnnotationOffset(targetId, lineType);
            const yAdj = val + yOffset;
            shapes.push({ type: 'line', xref: 'x', yref: 'paper', x0: val, x1: val, y0: 0, y1: 0.9, line: { color: color, width: width, dash: dash } });
            const annIdx = annotations.length;
            annotations.push({
                x: val, y: yAdj > 0 ? 0.95 : 0.05,
                xref: 'x', yref: 'paper',
                text: `<b>${label}: ${yAdj.toFixed(4)}</b>`,
                showarrow: false,
                font: { family: FONT_FAMILY, color: color, size: 10 },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#cbd5e1',
                borderwidth: 1,
                borderpad: 2
            });
            // Store draggable info in module-level map (gd doesn't exist yet)
            if (!window._spcChartDraggables) window._spcChartDraggables = {};
            if (!window._spcChartDraggables[targetId]) window._spcChartDraggables[targetId] = {};
            if (lineType) window._spcChartDraggables[targetId][lineType] = annIdx;
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
            addLimit(specs.target, 'Target', '#10b981', '40px 10px 10px 10px', 2, 'target');
        }

        if (specs.showSpec !== false) {
            addRange(specs.lsl, specs.usl, 'rgba(220, 38, 38, 0.05)');
            addLimit(specs.usl, 'USL', '#dc2626', 'dash', 1.5, 'usl');
            addLimit(specs.lsl, 'LSL', '#dc2626', 'dash', 1.5, 'lsl');
        }

        if (stats && specs.showLimits !== false) {
            addRange(stats.lcl, stats.ucl, 'rgba(217, 119, 6, 0.05)');
            addLimit(stats.ucl, 'UCL', '#d97706', 'dot', 1.5, 'ucl');
            addLimit(stats.lcl, 'LCL', '#d97706', 'dot', 1.5, 'lcl');
            addLimit(stats.mean, 'CL', 'rgba(217, 119, 6, 0.8)', 'dash', 1, 'cl');
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
            .then(gd => {
                const cls = 'draggable-annotation';
                const spcDraggables = window._spcChartDraggables && window._spcChartDraggables[targetId] || {};
                const lineTypes = Object.keys(spcDraggables);
                if (lineTypes.length > 0) {
                    const allPlotlyText = Array.from(container.querySelectorAll('.plotlytext'));
                    lineTypes.forEach(lineType => {
                        const annIdx = spcDraggables[lineType];
                        const ann = (gd._fullLayout && gd._fullLayout.annotations && gd._fullLayout.annotations[annIdx]) || null;
                        if (!ann) return;
                        const cleanText = (ann.text || '').replace(/<[^>]*>/g, '').trim();
                        const foundEl = allPlotlyText.find(el => (el.textContent || '').replace(/\s+/g, '').includes(cleanText.replace(/\s+/g, '')));
                        if (foundEl) {
                            foundEl.classList.add(cls);
                            foundEl.setAttribute('data-line-type', lineType);
                            foundEl.setAttribute('data-ann-idx', String(annIdx));
                        }
                    });
                }
                setupAnnotationDrag(gd, targetId);
            })
            .catch(err => console.error('Plotly DistChart Error:', err));
    };

    return { renderTrendChart, renderNormalDistChart, clearChart, exportChart };
})();
