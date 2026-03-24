/* tools/compare.js [v0.2.30 Stability Analyzer] */
const fs = require('fs');

class StabilityAnalyzer {
    constructor() {
        this.history = []; // Stat 이력 저장
    }

    loadStats(path) {
        if (!fs.existsSync(path)) {
            console.error("Path not found: " + path);
            return null;
        }
        return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }

    isConverging(a, b, c) {
        const d1 = Math.abs(b - a);
        const d2 = Math.abs(c - b);
        return d2 < d1;
    }

    detectOscillation(a, b, c) {
        const d1 = b - a;
        const d2 = c - b;
        return (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0);
    }

    analyzeTrend() {
        if (this.history.length < 3) {
            console.log("\n[INFO] Need at least 3 cycle stats for Trend Analysis.");
            return;
        }

        const [a, b, c] = this.history.slice(-3);
        console.log('\n=== [SYNAPSE] STABILITY TREND ANALYSIS ===');

        ['avgDensity', 'maxDelta', 'createRatio'].forEach(key => {
            const oscillating = this.detectOscillation(a[key], b[key], c[key]);
            const converging = this.isConverging(a[key], b[key], c[key]);

            let status = '➖ Stable/Flat';
            if (oscillating) status = '⚠️ Oscillation (Unstable)';
            else if (converging) status = '✅ Converging (Stabilizing)';

            console.log(`${key.padEnd(15)}: ${status} | History: [${a[key].toFixed(2)}, ${b[key].toFixed(2)}, ${c[key].toFixed(2)}]`);
        });

        if (c.avgDensity < 0.8 && c.createRatio < 0.2) {
            console.log('\n🚨 ALERT: Context Collapse! (Too much abstraction, information lost)');
        }
    }

    run(files) {
        files.forEach(f => {
            const stat = this.loadStats(f);
            if (stat) this.history.push(stat);
        });
        this.analyzeTrend();
    }
}

const analyzer = new StabilityAnalyzer();
analyzer.run(process.argv.slice(2));
