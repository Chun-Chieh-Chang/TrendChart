/**
 * Excel Parser Module
 * Handles Excel file reading and data extraction using SheetJS
 */
const ExcelParser = (() => {
    let workbook = null;

    /**
     * Parse Excel file from File object or ArrayBuffer
     */
    const parseFile = (data) => {
        return new Promise((resolve, reject) => {
            try {
                const options = {
                    type: data instanceof ArrayBuffer ? 'array' : 'binary',
                    cellDates: false,
                    cellNF: false,
                    cellText: false
                };

                workbook = XLSX.read(data, options);
                resolve(workbook.SheetNames);
            } catch (error) {
                console.error('Excel parsing error:', error);
                reject(error);
            }
        });
    };

    /**
     * Get data from a specific sheet as JSON
     */
    const getSheetData = (sheetName) => {
        if (!workbook) return null;

        try {
            const worksheet = workbook.Sheets[sheetName];
            // Convert to JSON, handling headers automatically
            const data = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                dateNF: 'yyyy-mm-dd hh:mm:ss'
            });

            return data;
        } catch (error) {
            console.error('Sheet data extraction error:', error);
            return [];
        }
    };

    /**
     * Robust numeric conversion with fallback
     */
    const parseNumber = (val) => {
        if (typeof val === 'number') return val;
        if (!val || typeof val !== 'string') return NaN;

        // Remove common currency symbols and commas
        const cleaned = val.replace(/[$,]/g, '').trim();
        const num = parseFloat(cleaned);
        return isFinite(num) ? num : NaN;
    };

    /**
     * Parse date-like values strictly
     */
    const parseDate = (val) => {
        if (val instanceof Date) return val;
        if (!val) return null;

        // Handle Excel numeric dates (days since 1900-01-01)
        if (typeof val === 'number') {
            // Very rough check: dates in modern era are > 30000 (roughly 1982)
            if (val > 30000 && val < 60000) {
                return new Date((val - 25569) * 86400 * 1000);
            }
            return null;
        }

        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    };

    /**
     * Detect if a column is likely a Date column (Detailed identification)
     */
    const detectDateConfidence = (data, column) => {
        if (!data || !data.length) return { isDate: false, confidence: 0 };

        const samples = data
            .map(row => row[column])
            .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
            .slice(0, 20);

        if (samples.length === 0) return { isDate: false, confidence: 0 };

        const dateScore = samples.filter(v => {
            const d = parseDate(v);
            if (!d) return false;
            const s = String(v);
            if (/^\d+$/.test(s) && s.length < 5) return false;
            return true;
        }).length;

        const confidence = dateScore / samples.length;
        return {
            isDate: confidence >= 0.8,
            isUncertain: confidence > 0.2 && confidence < 0.8,
            confidence: confidence
        };
    };

    /**
     * Extract unique values for filtering
     */
    const getUniqueValues = (data, column) => {
        const values = data.map(row => row[column])
            .filter(val => val !== undefined && val !== null && val !== '');
        return [...new Set(values)];
    };

    /**
     * Utility to format display values
     */
    const formatValue = (val) => {
        if (typeof val === 'number') {
            return Number.isInteger(val) ? val : parseFloat(val.toFixed(4));
        }
        return val;
    };

    /**
     * Advanced Statistical Calculations including Within/Between StdDev and QC Metrics
     */
    const getStats = (values, specs = {}, subgroupSize = 1) => {
        const validValues = values
            .map(v => typeof v === 'number' ? v : parseNumber(v))
            .filter(v => !isNaN(v));

        const n = validValues.length;
        if (n === 0) return {
            mean: 0, n: 0, ca: null, cp: null, cpk: null, ppk: null,
            stdevOverall: 0, stdevWithin: 0, stdevBetween: 0,
            ucl: 0, lcl: 0
        };

        const mean = validValues.reduce((a, b) => a + b, 0) / n;

        // Total Standard Deviation (Sample/Overall)
        const sumSqDiff = validValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0);
        const stdevOverall = n > 1 ? Math.sqrt(sumSqDiff / (n - 1)) : 0;

        // Within-Subgroup Standard Deviation (approx using moving range)
        let stdevWithin = stdevOverall;
        if (n > 1) {
            let diffSum = 0;
            for (let i = 1; i < n; i++) diffSum += Math.abs(validValues[i] - validValues[i - 1]);
            const d2 = 1.128; // for n=2 moving range
            stdevWithin = (diffSum / (n - 1)) / d2;
        }

        // Between-Subgroup Standard Deviation
        const stdevBetween = Math.sqrt(Math.max(0, Math.pow(stdevOverall, 2) - Math.pow(stdevWithin, 2)));

        // Quality Metrics
        let ca = null, cp = null, cpk = null, ppk = null;
        const usl = specs.usl;
        const lsl = specs.lsl;
        const hasUSL = !isNaN(usl);
        const hasLSL = !isNaN(lsl);

        if (hasUSL && hasLSL) {
            // Double-sided tolerances
            const t = usl - lsl;
            const u = (usl + lsl) / 2;
            ca = (mean - u) / (t / 2);
            cp = t / (6 * stdevWithin);
            cpk = Math.min((usl - mean) / (3 * stdevWithin), (mean - lsl) / (3 * stdevWithin));
            ppk = Math.min((usl - mean) / (3 * stdevOverall), (mean - lsl) / (3 * stdevOverall));
        } else if (hasUSL) {
            // USL only
            cpk = (usl - mean) / (3 * stdevWithin);
            ppk = (usl - mean) / (3 * stdevOverall);
        } else if (hasLSL) {
            // LSL only
            cpk = (mean - lsl) / (3 * stdevWithin);
            ppk = (mean - lsl) / (3 * stdevOverall);
        }

        // Control Limits (3-sigma)
        const ucl = mean + 3 * stdevWithin;
        const lcl = mean - 3 * stdevWithin;

        return {
            mean, n, ca, cp, cpk, ppk,
            stdevOverall, stdevWithin, stdevBetween,
            ucl, lcl
        };
    };

    /**
     * Normal Distribution Probability Density Function
     */
    const normDist = (x, mean, stdDev) => {
        if (stdDev === 0) return 0;
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    };

    return {
        parseFile,
        getSheetData,
        getUniqueValues,
        formatValue,
        getStats,
        normDist,
        parseNumber,
        parseDate,
        detectDateConfidence
    };
})();
