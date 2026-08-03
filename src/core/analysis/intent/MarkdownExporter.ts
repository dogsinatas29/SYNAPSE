import { ReasonedReportBundle } from './ReasonedReportBundle';

export class MarkdownExporter {
    export(bundle: ReasonedReportBundle): string {
        const title = 'Architecture Atlas';
        const generatedAt = bundle.generatedAt;
        const map = bundle.onboardingMap;

        if (!map) {
            return `# ${title}\n\nGenerated At: ${generatedAt}\n\n*No atlas generated.*`;
        }

        const lines: string[] = [];
        lines.push(`# Architecture Atlas`);
        lines.push(`> Generated At: ${generatedAt}`);
        lines.push('');

        // 0. Strategic Assets
        lines.push(`## [Strategic Assets (Critical Bridges)]`);
        for (const asset of map.strategicAssets) {
            lines.push(`### \`${asset.file}\``);
            lines.push(`- **Criticality Score:** ${asset.criticalityScore}`);
            lines.push(`- Global Traffic: ${asset.globalTraffic}`);
            lines.push(`- Regions Touched: ${asset.regionsTouched}`);
            lines.push(`- Max Corridor Ownership: ${asset.maxCorridorOwnership * 100}%`);
            lines.push('');
        }

        // 1. Continents
        lines.push(`## [Continents (Roles)]`);
        for (const c of map.continents) {
            lines.push(`### \`${c.name}\` ➔ **${c.role}**`);
            lines.push(`- Nodes: ${c.nodeCount}`);
            lines.push(`- Internal Traffic: ${c.internalTraffic}`);
            lines.push(`- External Traffic: ${c.externalTraffic}`);
            lines.push(`- Connected Regions: ${c.connectedRegions}`);
            lines.push('');
        }

        // 2. Corridors
        lines.push(`## [Corridor Decomposition]`);
        for (const c of map.corridors.slice(0, 50)) {
            lines.push(`### \`${c.regionA}\` ↔ \`${c.regionB}\` (Traffic: ${c.traffic})`);
            lines.push(`**Top Bridges:**`);
            for (const b of c.topBridges) {
                lines.push(`- \`${b.file}\` (${b.contributionPercentage}%)`);
            }
            lines.push('');
        }

        // 4. Representative Files
        lines.push(`## [Representative Files]`);
        for (const rf of map.representativeFiles) {
            lines.push(`### \`${rf.region}\``);
            for (const file of rf.coreFiles) lines.push(`- \`${file}\``);
            lines.push('');
        }

        return lines.join('\n');
    }
}
