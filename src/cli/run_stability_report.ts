import * as fs from 'fs';
import * as path from 'path';
import { SignalStabilityAnalyzer } from '../core/reasoning/signal/SignalStabilityAnalyzer';

function loadReport(filename: string): any {
    const fullPath = path.join(process.cwd(), filename);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

async function run() {
    console.log("🚀 Generating Signal Stability Report v1...");

    const synapse = loadReport('synapse_actual_signal_census_report.json');
    const antennapod = loadReport('antennapod_signal_census_report.json');
    const vscode = loadReport('vscode_signal_census_report.json');

    if (!synapse || !antennapod || !vscode) {
        console.error("❌ Missing one or more census reports (synapse, antennapod, vscode).");
        return;
    }

    const reports = {
        'SYNAPSE': synapse,
        'AntennaPod': antennapod,
        'VSCode': vscode
    };

    const analyzer = new SignalStabilityAnalyzer();
    const result = analyzer.analyze(reports);

    const reportPath = path.join(process.cwd(), 'signal_stability_report_v1.json');
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8');

    console.log(`✅ Stability Report Generated: ${reportPath}`);
    console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
