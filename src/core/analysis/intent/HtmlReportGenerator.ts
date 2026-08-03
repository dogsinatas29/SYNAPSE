import { ReasonedReportBundle } from './ReasonedReportBundle';

export class HtmlReportGenerator {
    generate(bundle: ReasonedReportBundle): string {
        const title = 'Architecture Atlas';
        const generatedAt = bundle.generatedAt;
        const map = bundle.onboardingMap;

        if (!map) {
            return `<html><body><h1>${title}</h1><p>Generated At: ${generatedAt}</p><p>No atlas generated.</p></body></html>`;
        }

        let strategicAssetsHtml = '';
        for (const asset of map.strategicAssets) {
            strategicAssetsHtml += `
                <div class="card" style="border-left: 4px solid #f85149;">
                    <h3><code>${asset.file}</code></h3>
                    <ul>
                        <li><strong>Criticality Score:</strong> ${asset.criticalityScore}</li>
                        <li>Global Traffic: ${asset.globalTraffic}</li>
                        <li>Regions Touched: ${asset.regionsTouched}</li>
                        <li>Max Corridor Ownership: ${asset.maxCorridorOwnership * 100}%</li>
                    </ul>
                </div>
            `;
        }

        let continentsHtml = '';
        for (const c of map.continents) {
            continentsHtml += `
                <div class="card">
                    <h3><strong>${c.name}</strong> <span style="color: #58a6ff;">[${c.role}]</span></h3>
                    <ul>
                        <li>Nodes: ${c.nodeCount}</li>
                        <li>Internal Traffic: ${c.internalTraffic}</li>
                        <li>External Traffic: ${c.externalTraffic}</li>
                        <li>Connected Regions: ${c.connectedRegions}</li>
                    </ul>
                </div>
            `;
        }

        let corridorsHtml = '';
        for (const c of map.corridors.slice(0, 50)) {
            corridorsHtml += `
                <div class="card">
                    <h3><code>${c.regionA}</code> ↔ <code>${c.regionB}</code> <span style="font-size: 0.8em; color: #888;">(Traffic: ${c.traffic})</span></h3>
                    <h4>Top Bridges:</h4>
                    <ul>
                        ${c.topBridges.map((b: any) => `<li><code>${b.file}</code> <strong>(${b.contributionPercentage}%)</strong></li>`).join('')}
                    </ul>
                </div>
            `;
        }

        let representativeHtml = '';
        for (const rf of map.representativeFiles) {
            representativeHtml += `
                <div class="card">
                    <h3><code>${rf.region}</code></h3>
                    <ul>
                        ${rf.coreFiles.map((f: string) => `<li><code>${f}</code></li>`).join('')}
                    </ul>
                </div>
            `;
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --card-bg: #161b22;
            --border-color: #30363d;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1, h2, h3, h4 { color: #ffffff; margin-top: 1.5em; }
        h1 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        .card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
        code { background-color: rgba(240, 246, 252, 0.15); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 85%; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>Generated At: <strong>${generatedAt}</strong></p>
        
        <h2>[Strategic Assets (Critical Bridges)]</h2>
        ${strategicAssetsHtml}

        <h2>[Continents (Roles)]</h2>
        ${continentsHtml}

        <h2>[Corridor Decomposition]</h2>
        ${corridorsHtml}

        <h2>[Representative Files]</h2>
        ${representativeHtml}
    </div>
</body>
</html>`;

        return html;
    }
}
