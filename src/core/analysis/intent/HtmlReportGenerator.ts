import { ReasonedReportBundle } from './ReasonedReportBundle';

export class HtmlReportGenerator {
    generate(bundle: ReasonedReportBundle): string {
        const title = 'Architecture Intelligence Report';
        const generatedAt = bundle.generatedAt;
        const avgConfidence = (bundle.averageConfidence * 100).toFixed(2);

        // Map findings
        const findingsHtml = bundle.findings.length === 0 
            ? '<p>No findings recorded.</p>' 
            : bundle.findings.map(f => `
                <div class="card finding-card">
                    <h3>${f.title} <span class="badge">Confidence: ${(f.confidence * 100).toFixed(2)}%</span></h3>
                    <p>${f.description}</p>
                </div>
            `).join('');

        // Map intent edges
        const edgesHtml = bundle.intentEdges.length === 0
            ? '<p>No intent edges found.</p>'
            : bundle.intentEdges.map(e => `
                <div class="card edge-card">
                    <h4>${e.source} &rarr; ${e.target}</h4>
                    <ul>
                        <li><strong>Intent:</strong> ${e.intent}</li>
                        <li><strong>Confidence:</strong> ${(e.confidence * 100).toFixed(2)}%</li>
                        <li><strong>Evidence Count:</strong> ${e.evidenceCount}</li>
                        <li><strong>Providers:</strong> ${e.providers.join(', ')}</li>
                    </ul>
                </div>
            `).join('');

        // Map evidence inventory
        const evidenceHtml = bundle.evidence.length === 0
            ? '<p>No evidence found.</p>'
            : bundle.evidence.map(ev => `
                <div class="card evidence-card">
                    <h5><span class="badge provider-badge">${ev.provider}</span> ${ev.source} &rarr; ${ev.target} <span class="badge intent-badge">${ev.evidenceType}</span></h5>
                    <p><strong>File:</strong> <code>${ev.file}:${ev.line}</code></p>
                    <p><strong>Reason:</strong> ${ev.reason}</p>
                </div>
            `).join('');

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
            --accent-color: #58a6ff;
            --success-color: #238636;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            margin: 0;
            padding: 2rem;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1, h2, h3, h4, h5 {
            color: #ffffff;
            margin-top: 1.5em;
        }
        h1 { border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .stat-box {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 1.5rem;
            text-align: center;
        }
        .stat-box .value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--accent-color);
        }
        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .badge {
            display: inline-block;
            padding: 0.2em 0.5em;
            font-size: 0.8em;
            font-weight: 600;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            vertical-align: baseline;
            border-radius: 2rem;
            background-color: var(--border-color);
        }
        .provider-badge { background-color: #1f6feb; color: white; }
        .intent-badge { background-color: var(--success-color); color: white; }
        ul { margin-top: 0; }
        code {
            background-color: rgba(240, 246, 252, 0.15);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
            font-size: 85%;
        }
        
        /* Interactive Folding (No JS needed, using details/summary) */
        details { margin-bottom: 1rem; }
        summary { cursor: pointer; font-weight: bold; padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; }
        details[open] summary { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none; }
        .details-content { padding: 1rem; border: 1px solid var(--border-color); border-top: none; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; background: var(--bg-color); }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>Generated At: <strong>${generatedAt}</strong></p>

        <h2>Executive Summary</h2>
        <div class="summary-grid">
            <div class="stat-box">
                <div class="label">Evidence Count</div>
                <div class="value">${bundle.evidenceCount}</div>
            </div>
            <div class="stat-box">
                <div class="label">Intent Edge Count</div>
                <div class="value">${bundle.intentEdgeCount}</div>
            </div>
            <div class="stat-box">
                <div class="label">Average Confidence</div>
                <div class="value">${avgConfidence}%</div>
            </div>
        </div>

        <h2>Findings</h2>
        ${findingsHtml}

        <details open>
            <summary>Intent Graph Summary</summary>
            <div class="details-content">
                ${edgesHtml}
            </div>
        </details>

        <details>
            <summary>Evidence Inventory</summary>
            <div class="details-content">
                ${evidenceHtml}
            </div>
        </details>
    </div>
</body>
</html>`;

        return html;
    }
}
