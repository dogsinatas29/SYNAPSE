import { ReasonedReportBundle } from './ReasonedReportBundle';

export class HtmlReportGenerator {
    generate(bundle: ReasonedReportBundle): string {
        const title = 'Architectural Ecology Report';
        const map = bundle.onboardingMap;

        if (!map) {
            return `<html><body><h1>${title}</h1><p>No atlas generated.</p></body></html>`;
        }

        // Map existing data to Ecological Diagnosis categories
        let diagnosisHtml = '';

        // 1. Dominance Analysis (from Strategic Assets)
        if (map.strategicAssets.length > 0) {
            diagnosisHtml += `<h2>1. Dominance Analysis</h2>`;
            for (const asset of map.strategicAssets.slice(0, 5)) {
                diagnosisHtml += `
                <div class="card">
                    <h3>Status: <span style="color: #f85149;">⚠ Dominant Hub Detected</span></h3>
                    <div class="evidence">
                        <p><strong>Evidence Node:</strong> <code>${asset.file}</code></p>
                        <p><strong>Metrics:</strong> Global Traffic: ${asset.globalTraffic}, Regions Touched: ${asset.regionsTouched}, Max Corridor: ${Math.round(asset.maxCorridorOwnership * 100)}%</p>
                        <p><strong>Risk:</strong> 단일 장애점(SPOF) 및 병목 구간으로 발전할 가능성이 높음.</p>
                        <p class="evidence-links">
                            <strong>Evidence Links:</strong>
                            <a href="node://${asset.file}">node://${asset.file}</a>
                        </p>
                    </div>
                </div>`;
            }
        }

        // 2. Cohesion Analysis (from Continents)
        if (map.continents.length > 0) {
            diagnosisHtml += `<h2>2. Cohesion Analysis</h2>`;
            for (const c of map.continents) {
                const status = c.role === 'Mega Hub' ? '⚠ Weak (Over-coupled)' : '✅ Stable';
                const statusColor = c.role === 'Mega Hub' ? '#f85149' : '#2ea043';
                diagnosisHtml += `
                <div class="card">
                    <h3>Status: <span style="color: ${statusColor};">${status}</span></h3>
                    <div class="evidence">
                        <p><strong>Evidence Cluster:</strong> <code>${c.name}</code> [${c.role}]</p>
                        <p><strong>Metrics:</strong> Internal Traffic: ${c.internalTraffic}, External Traffic: ${c.externalTraffic}</p>
                        <p><strong>Impact:</strong> 외부 의존도가 높을 경우 책임 분산 및 유지보수 비용 증가 가능성이 존재한다.</p>
                        <p class="evidence-links">
                            <strong>Evidence Links:</strong>
                            <a href="cluster://${c.name}">cluster://${c.name}</a>
                        </p>
                    </div>
                </div>`;
            }
        }

        // 3. Dependency / Corridor Analysis
        if (map.corridors.length > 0) {
            diagnosisHtml += `<h2>3. Corridor Dependency Analysis</h2>`;
            for (const c of map.corridors.slice(0, 3)) {
                diagnosisHtml += `
                <div class="card">
                    <h3>Status: <span>Dependency Bridge</span></h3>
                    <div class="evidence">
                        <p><strong>Corridor:</strong> <code>${c.regionA}</code> ↔ <code>${c.regionB}</code> (Traffic: ${c.traffic})</p>
                        <p><strong>Top Bridges:</strong> ${c.topBridges.map((b: any) => `<code>${b.file}</code>`).join(', ')}</p>
                        <p class="evidence-links">
                            <strong>Evidence Links:</strong>
                            <a href="cluster://${c.regionA}">cluster://${c.regionA}</a>
                            <a href="cluster://${c.regionB}">cluster://${c.regionB}</a>
                        </p>
                    </div>
                </div>`;
            }
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root { --bg-color: #0d1117; --text-color: #c9d1d9; --card-bg: #161b22; --border-color: #30363d; --link-color: #58a6ff; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background-color: var(--bg-color); color: var(--text-color); line-height: 1.6; margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; margin-bottom: 1rem; color: #fff; }
        h2 { color: #fff; margin-top: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h3 { margin-top: 0; margin-bottom: 1rem; }
        .card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .evidence { background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 4px; border-left: 4px solid var(--border-color); }
        .evidence p { margin: 0.5em 0; }
        code { background-color: rgba(240, 246, 252, 0.15); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
        .evidence-links { margin-top: 1rem !important; padding-top: 1rem; border-top: 1px dashed var(--border-color); }
        a { color: var(--link-color); text-decoration: none; margin-left: 0.5rem; font-family: monospace; background: rgba(88, 166, 255, 0.1); padding: 0.2rem 0.5rem; border-radius: 3px; }
        a:hover { text-decoration: underline; background: rgba(88, 166, 255, 0.2); }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p><strong>Analysis Timestamp:</strong> ${bundle.generatedAt}</p>
        <p><strong>Analyzed Nodes:</strong> ${bundle.pipelineStats.rawEdges} (Estimated via pipeline stats)</p>
        
        <div class="card" style="border-left: 4px solid #58a6ff;">
            <h3>Executive Summary</h3>
            <p>본 프로젝트는 전반적으로 높은 연결성을 유지하고 있으나, 특정 노드와 클러스터에 강한 <strong>의존성 집중(Dominance)</strong> 및 <strong>응집도 저하(Weak Cohesion)</strong> 징후가 관찰되었습니다. Evidence Link를 클릭하여 캔버스에서 즉시 시각적으로 검증할 수 있습니다.</p>
        </div>

        ${diagnosisHtml}
    </div>
</body>
</html>`;
    }
}
