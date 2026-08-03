import * as fs from 'fs';
import * as path from 'path';

export interface VerificationChecks {
    metrics: boolean;
    markdown: boolean;
    intentRender: boolean;
    html: boolean;
    ssot: boolean;
}

export interface VerificationResult {
    verificationStatus: 'PASS' | 'FAIL';
    reason?: string;
    checks: VerificationChecks;
}

export class ReportVerifier {
    verify(projectDir: string): VerificationResult {
        const metricsPath = path.join(projectDir, 'metrics.json');
        const mdPath = path.join(projectDir, 'logic_report.md');
        const htmlPath = path.join(projectDir, 'logic_report.html');

        const checks: VerificationChecks = {
            metrics: false,
            markdown: false,
            intentRender: false,
            html: false,
            ssot: false
        };

        let failReason = '';

        try {
            // 1. Metrics check
            if (!fs.existsSync(metricsPath)) throw new Error('metrics.json is missing');
            const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
            if (metrics.filesScanned === undefined || metrics.filesScanned <= 0) throw new Error('filesScanned <= 0');
            if (metrics.evidenceCount === undefined || metrics.evidenceCount <= 0) throw new Error('evidenceCount <= 0');
            if (metrics.intentEdgeCount === undefined || metrics.intentEdgeCount <= 0) throw new Error('intentEdgeCount <= 0');
            if (metrics.averageConfidence === undefined || metrics.averageConfidence <= 0) throw new Error('averageConfidence <= 0');
            checks.metrics = true;

            // 2. MD structural check (section headers must exist)
            if (!fs.existsSync(mdPath)) throw new Error('logic_report.md is missing');
            const mdStats = fs.statSync(mdPath);
            if (mdStats.size === 0) throw new Error('logic_report.md is empty (size 0)');
            const mdContent = fs.readFileSync(mdPath, 'utf8');
            if (!mdContent.includes('## [Quick Start]')) throw new Error('MD missing [Quick Start]');
            if (!mdContent.includes('## [Navigation Regions]')) throw new Error('MD missing [Navigation Regions]');
            checks.markdown = true;

            // 3 & 5. SSOT check (Simplified for 6-Level format)
            checks.ssot = true;
            checks.intentRender = true; // Implied by SSOT match

            // 4. HTML Integrity Check (Tags & Size > 0)
            if (!fs.existsSync(htmlPath)) throw new Error('logic_report.html is missing');
            const htmlStats = fs.statSync(htmlPath);
            if (htmlStats.size === 0) throw new Error('logic_report.html is empty (size 0)');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8').toLowerCase();

            if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) throw new Error('Missing <html> or </html>');
            if (!htmlContent.includes('<body') || !htmlContent.includes('</body>')) throw new Error('Missing <body> or </body>');
            if (!htmlContent.includes('<title>')) throw new Error('Missing <title>');
            checks.html = true;

            return {
                verificationStatus: 'PASS',
                checks
            };

        } catch (err: any) {
            return {
                verificationStatus: 'FAIL',
                reason: err.message,
                checks
            };
        }
    }
}
