/* tools/config-generator.js [v0.2.28.1 Self-Stabilizing Control Layer] */
const fs = require('fs');
const path = require('path');

function loadHistory() {
    try {
        if (fs.existsSync('synapse.history.json')) {
            return JSON.parse(fs.readFileSync('synapse.history.json', 'utf-8'));
        }
    } catch (e) {}
    return [];
}

function saveHistory(history) {
    fs.writeFileSync('synapse.history.json', JSON.stringify(history.slice(-10), null, 2));
}

function checkConsecutiveConvergence(history) {
    if (history.length < 3) return false;
    const [a, b, c] = history.slice(-3);
    const d1 = Math.abs(b.avgDensity - a.avgDensity);
    const d2 = Math.abs(c.avgDensity - b.avgDensity);
    return d2 < d1; // 델타가 줄어드는 상태가 관찰되면 수렴 후보
}

function generateConfig(stats, history) {
    let config = {
        timeGapMs: 30000,
        lengthJumpThreshold: 100,
        edgeMultiplier: 0.1,
        createScoreThreshold: 2,
        markerSensitivity: 1.0
    };

    // 현재 설정 로드 (있을 경우)
    if (fs.existsSync('synapse.config.json')) {
        try { config = JSON.parse(fs.readFileSync('synapse.config.json', 'utf-8')); } catch (e) {}
    }

    let damping = 1.0;
    let isStable = false;

    if (history.length >= 3) {
        const [a, b, c] = history.slice(-3);
        const d1 = Math.abs(b.avgDensity - a.avgDensity);
        const d2 = Math.abs(c.avgDensity - b.avgDensity);
        const isOscillating = (b.avgDensity - a.avgDensity > 0 && c.avgDensity - b.avgDensity < 0) || 
                              (b.avgDensity - a.avgDensity < 0 && c.avgDensity - b.avgDensity > 0);
        const isConverging = d2 < d1;

        if (isOscillating) {
            damping = 0.5;
            console.log('[CONTROL] Oscillation detected -> damping applied (0.5)');
        } else if (isConverging) {
            damping = 0.8;
            console.log('[CONTROL] Converging -> fine-tuning applied (0.8)');
            if (d2 < 0.08) {
                console.log('\n[CONTROL] System stabilized -> Freezing parameters. (Release Gate Passed)');
                return null; // [Preservation]
            }
        }
    }

    const createRatio = stats.createRatio;
    if (createRatio > 0.6) {
        config.timeGapMs += 10000 * damping;
        config.markerSensitivity -= 0.1 * damping;
    }
    if (stats.maxDensity > 5) {
        config.edgeMultiplier += 0.05 * damping;
    }

    if (stats.avgDensity < 0.8 && stats.createRatio < 0.2) {
        console.log('[CONTROL] Overfitting detected -> Applying bias rollback.');
        config.edgeMultiplier *= 0.8;
        config.markerSensitivity *= 1.2;
    }

    // Safety Clamps
    config.edgeMultiplier = Math.min(0.25, Math.max(0.05, config.edgeMultiplier));
    config.markerSensitivity = Math.min(2.0, Math.max(0.5, config.markerSensitivity));
    config.timeGapMs = Math.min(120000, Math.max(10000, config.timeGapMs));

    return config;
}

const statsPath = 'synapse.stats.json';
if (!fs.existsSync(statsPath)) {
    console.error("Run log-analyzer.js first to generate stats.");
    process.exit(1);
}

const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
let history = loadHistory();

const newConfig = generateConfig(stats, history);

if (newConfig === null) {
    console.log('[CONTROL] Config unchanged (frozen). Keeping current Golden State.');
} else {
    fs.writeFileSync('synapse.config.json', JSON.stringify(newConfig, null, 2));
    console.log('[CONTROL] New config generated and saved.');
    history.push(stats);
    saveHistory(history);
}
