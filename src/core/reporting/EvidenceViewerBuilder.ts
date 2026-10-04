import * as path from 'path';
import * as fs from 'fs';
import { PatternFinding } from '../analysis/patterns/PatternFinding';
import { QUESTION_DICTIONARY } from './ReportContract';

export class EvidenceViewerBuilder {
    public static buildHtml(findings: PatternFinding[], workspaceRoot: string): string {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SYNAPSE Evidence Viewer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f3f3; color: #333; line-height: 1.6; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #111; }
        .section-box { border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 20px; background-color: #fafafa; }
        .evidence-card { border-left: 4px solid #007acc; padding-left: 15px; margin-top: 10px; background-color: #fff; border: 1px solid #eee; padding: 10px; border-radius: 4px; }
        pre { background-color: #2d2d2d; color: #ccc; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #eee; }
        .metadata-pill { display: inline-block; background-color: #e1f5fe; color: #01579b; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; font-family: monospace; }
        .nav-sidebar { float: left; width: 200px; }
        .main-content { margin-left: 220px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>SYNAPSE Evidence Viewer</h1>
        <p>Detailed evidence extracted from structural graph observations and validation patterns.</p>
        
        <div class="nav-sidebar">
            <h3>Questions</h3>
            <ul>
                ${Object.keys(QUESTION_DICTIONARY).map(qid => `<li><a href="#${qid}">${qid}</a></li>`).join('')}
            </ul>
        </div>
        
        <div class="main-content">
            ${this.renderQuestions(findings)}
        </div>
    </div>
</body>
</html>`;
        return html;
    }

    private static renderQuestions(findings: PatternFinding[]): string {
        let content = '';
        for (const [qid, contract] of Object.entries(QUESTION_DICTIONARY)) {
            const relevantFindings = findings.filter(f => contract.supportingPatterns.includes(f.patternId));
            
            content += `<div class="section-box" id="${qid}">`;
            content += `<h2>${qid} — ${contract.type}</h2>`;
            if (relevantFindings.length === 0) {
                content += `<h3>Expected Patterns</h3>`;
                content += `<ul>`;
                for (const pattern of contract.supportingPatterns) {
                    content += `<li>${pattern}</li>`;
                }
                content += `</ul>`;
                content += `<h3>Audit Result</h3>`;
                content += `<p>Detector Status: EXECUTED<br/>Pattern Instances Found: 0<br/>Evidence Records: 0</p>`;
                content += `<p><em>Status: No pattern instance recorded.</em></p>`;
            } else {
                content += `<h3>Pattern Results</h3>`;
                for (const pattern of contract.supportingPatterns) {
                    const patternFindings = relevantFindings.filter(f => f.patternId === pattern);
                    if (patternFindings.length === 0) continue;
                    
                    const uniqueFindingsMap = new Map<string, PatternFinding>();
                    for (const f of patternFindings) {
                        const targetKey = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
                        uniqueFindingsMap.set(targetKey, f);
                    }
                    const uniqueFindings = Array.from(uniqueFindingsMap.values());
                    
                    content += `<h4>${pattern} (${uniqueFindings.length})</h4>`;
                    content += `<ul>`;
                    for (const f of uniqueFindings) {
                        content += `<li><code>${f.targetId}</code></li>`;
                    }
                    content += `</ul>`;
                    
                    content += `<h4>Evidence</h4>`;
                    for (const f of uniqueFindings) {
                        content += `<div class="evidence-card">`;
                        content += `<p><strong>Target:</strong> <code>${f.targetId}</code></p>`;
                        if (f.evidence && f.evidence.length > 0) {
                            for (const ev of f.evidence) {
                                if (ev.metadata) {
                                    for (const [k, v] of Object.entries(ev.metadata)) {
                                        if (contract.allowedEvidence && contract.allowedEvidence.includes(k)) {
                                            const displayValue = typeof v === 'string' ? v : JSON.stringify(v);
                                            content += `<div><strong>${k}:</strong> ${displayValue}</div>`;
                                        }
                                    }
                                }
                            }
                        } else {
                            content += `<p><em>No detailed evidence items attached.</em></p>`;
                        }
                        content += `</div>`;
                    }
                    content += `<hr/>`;
                }
            }
            content += `</div>`;
        }
        return content;
    }
}
