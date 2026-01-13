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
                    cellDates: true,
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

        const worksheet = workbook.Sheets[sheetName];
        // Convert to JSON, handling headers automatically
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd hh:mm:ss'
        });

        return data;
    };

    /**
     * Extract unique values for filtering
     */
    const getUniqueValues = (data, column) => {
        const values = data.map(row => row[column])
            .filter(val => val !== undefined && val !== null && val !== '');
        return [...new Set(values)].sort();
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
        const n = values.length;
        if (n === 0) return null;

        const mean = values.reduce((a, b) => a + b, 0) / n;

        // Total Standard Deviation (Sample/Overall - using n-1 for unbiased estimate)
        const sumSqDiff = values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0);
        const stdevOverall = n > 1 ? Math.sqrt(sumSqDiff / (n - 1)) : 0;

        // Within-Subgroup Standard Deviation (approx using moving range)
        let stdevWithin = stdevOverall;
        if (n > 1) {
            let diffSum = 0;
            for (let i = 1; i < n; i++) diffSum += Math.abs(values[i] - values[i - 1]);
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
        normDist
    };
})();
