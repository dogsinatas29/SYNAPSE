import { IntentEdge } from './IntentEdge';
import { 
    ArchitectureAtlas, PipelineStats, StrategicAsset,
    ContinentInfo, CorridorInfo, RegionConnectivity, RepresentativeFile 
} from './ReasonedReportBundle';
import { ActionCandidate, ImpactVector } from './ActionCandidate';

export class ArchitectMapGenerator {
    generate(intentEdges: IntentEdge[], workspaceRoot: string): { map: ArchitectureAtlas, stats: PipelineStats } {
        const stats: PipelineStats = { rawEdges: intentEdges.length, resolvedEdges: 0, unresolvedSymbols: 0, subsystemEdges: 0 };
        
        const nodeContinents = new Map<string, string>();
        const nodeExternalTraffic = new Map<string, number>();
        const fileRegionsTouched = new Map<string, Set<string>>();

        const ensureRegionsTouched = (file: string) => {
            if (!fileRegionsTouched.has(file)) fileRegionsTouched.set(file, new Set());
            return fileRegionsTouched.get(file)!;
        };

        for (const edge of intentEdges) {
            const srcCont = this.getSubsystem(edge.source, workspaceRoot);
            const tgtCont = this.getSubsystem(edge.target, workspaceRoot);
            if (srcCont === '_unresolved_symbol_' || tgtCont === '_unresolved_symbol_') {
                stats.unresolvedSymbols++;
                continue;
            }
            nodeContinents.set(edge.source, srcCont);
            nodeContinents.set(edge.target, tgtCont);
            stats.resolvedEdges++;
        }

        const continentsMap = new Map<string, { name: string, nodes: Set<string>, internalTraffic: number, externalTraffic: number, connected: Set<string> }>();
        const ensureContinent = (name: string) => {
            if (!continentsMap.has(name)) {
                continentsMap.set(name, { name, nodes: new Set(), internalTraffic: 0, externalTraffic: 0, connected: new Set() });
            }
            return continentsMap.get(name)!;
        };

        const corridorsMap = new Map<string, { traffic: number, fileTraffic: Map<string, number> }>();
        const ensureCorridor = (r1: string, r2: string) => {
            if (r1 === r2) return null;
            const key = r1 < r2 ? `${r1}:${r2}` : `${r2}:${r1}`;
            if (!corridorsMap.has(key)) corridorsMap.set(key, { traffic: 0, fileTraffic: new Map() });
            return corridorsMap.get(key)!;
        };

        for (const [node, cont] of nodeContinents.entries()) {
            ensureContinent(cont).nodes.add(node);
        }

        for (const edge of intentEdges) {
            const sCont = nodeContinents.get(edge.source);
            const tCont = nodeContinents.get(edge.target);
            if (!sCont || !tCont) continue;
            
            const sData = ensureContinent(sCont);
            const tData = ensureContinent(tCont);

            if (sCont === tCont) {
                sData.internalTraffic++;
            } else {
                sData.externalTraffic++;
                tData.externalTraffic++;
                sData.connected.add(tCont);
                tData.connected.add(sCont);
                
                ensureRegionsTouched(edge.source).add(tCont);
                ensureRegionsTouched(edge.target).add(sCont);
                
                nodeExternalTraffic.set(edge.source, (nodeExternalTraffic.get(edge.source) || 0) + 1);
                nodeExternalTraffic.set(edge.target, (nodeExternalTraffic.get(edge.target) || 0) + 1);

                const cData = ensureCorridor(sCont, tCont);
                if (cData) {
                    cData.traffic++;
                    cData.fileTraffic.set(edge.source, (cData.fileTraffic.get(edge.source) || 0) + 1);
                    cData.fileTraffic.set(edge.target, (cData.fileTraffic.get(edge.target) || 0) + 1);
                }
                stats.subsystemEdges++;
            }
        }

        // Calculate Medians for Quadrant Roles
        const extTrafficArr = Array.from(continentsMap.values()).map(c => c.externalTraffic).sort((a, b) => a - b);
        const connArr = Array.from(continentsMap.values()).map(c => c.connected.size).sort((a, b) => a - b);
        const midIdx = Math.floor(extTrafficArr.length / 2);
        const medianTraffic = extTrafficArr.length > 0 ? extTrafficArr[midIdx] : 0;
        const medianConn = connArr.length > 0 ? connArr[midIdx] : 0;

        const continents: ContinentInfo[] = Array.from(continentsMap.values()).map(c => {
            let role: 'Mega Hub' | 'Connector' | 'Specialized' | 'Standard' = 'Standard';
            if (c.externalTraffic > medianTraffic && c.connected.size > medianConn) role = 'Mega Hub';
            else if (c.externalTraffic <= medianTraffic && c.connected.size > medianConn) role = 'Connector';
            else if (c.externalTraffic > medianTraffic && c.connected.size <= medianConn) role = 'Specialized';

            return {
                name: c.name,
                nodeCount: c.nodes.size,
                internalTraffic: c.internalTraffic,
                externalTraffic: c.externalTraffic,
                connectedRegions: c.connected.size,
                role
            };
        }).sort((a, b) => b.nodeCount - a.nodeCount);

        const fileMaxOwnership = new Map<string, number>();

        const corridors: CorridorInfo[] = Array.from(corridorsMap.entries()).map(([key, data]) => {
            const [regionA, regionB] = key.split(':');
            const fileEntries = Array.from(data.fileTraffic.entries()).sort((a, b) => b[1] - a[1]);
            
            // Record ownership for Strategic Assets calculation
            for (const [file, traffic] of data.fileTraffic.entries()) {
                const ownership = traffic / data.traffic;
                if (ownership > (fileMaxOwnership.get(file) || 0)) {
                    fileMaxOwnership.set(file, ownership);
                }
            }

            const topBridges = fileEntries.slice(0, 5).map(([file, traffic]) => ({
                file,
                traffic,
                contributionPercentage: Math.round((traffic / data.traffic) * 100)
            }));
            return { regionA, regionB, traffic: data.traffic, topBridges };
        }).sort((a, b) => b.traffic - a.traffic);

        const strategicAssets: StrategicAsset[] = Array.from(nodeExternalTraffic.entries()).map(([file, globalTraffic]) => {
            const regionsTouched = fileRegionsTouched.get(file)?.size || 0;
            const maxCorridorOwnership = fileMaxOwnership.get(file) || 0;
            const criticalityScore = Math.sqrt(globalTraffic) * regionsTouched * maxCorridorOwnership;
            return {
                file,
                globalTraffic,
                regionsTouched,
                maxCorridorOwnership: Math.round(maxCorridorOwnership * 100) / 100,
                criticalityScore: Math.round(criticalityScore * 10) / 10
            };
        }).filter(a => a.criticalityScore > 0)
          .sort((a, b) => b.criticalityScore - a.criticalityScore)
          .slice(0, 20); // Top 20

        const regionConnectivity: RegionConnectivity[] = Array.from(continentsMap.values()).map(c => ({
            region: c.name,
            connectedRegions: c.connected.size,
            externalTraffic: c.externalTraffic
        })).sort((a, b) => b.connectedRegions - a.connectedRegions);

        const representativeFiles: RepresentativeFile[] = Array.from(continentsMap.values()).map(c => {
            const files = Array.from(c.nodes);
            files.sort((a, b) => (nodeExternalTraffic.get(b) || 0) - (nodeExternalTraffic.get(a) || 0));
            return { region: c.name, coreFiles: files.slice(0, 3) };
        });

        const map: ArchitectureAtlas = { strategicAssets, continents, corridors, regionConnectivity, representativeFiles };
        return { map, stats };
    }

    private getSubsystem(filePath: string, workspaceRoot: string, referencePath?: string): string {
        let normalizedRoot = workspaceRoot ? workspaceRoot.replace(/\\/g, '/') : '';
        let targetPath = filePath.replace(/\\/g, '/');

        if (referencePath && !targetPath.startsWith(normalizedRoot) && !targetPath.startsWith('/')) {
            const refPathParts = referencePath.replace(/\\/g, '/').split('/');
            refPathParts.pop();
            targetPath = refPathParts.join('/') + '/' + targetPath;
        }

        let relativePath = targetPath;
        if (normalizedRoot && targetPath.startsWith(normalizedRoot)) {
            relativePath = targetPath.substring(normalizedRoot.length);
        }
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }
        
        const parts = relativePath.split('/').filter(p => p.trim() !== '');

        if (parts.length === 1 && !relativePath.includes('/') && !relativePath.includes('.')) {
            return '_unresolved_symbol_';
        }

        if (parts.length === 0) return 'root';

        const SUBCONTINENT_ROOTS = new Set(['arch', 'drivers', 'include', 'tools', 'sound', 'net']);
        if (SUBCONTINENT_ROOTS.has(parts[0]) && parts.length > 1) {
            return `${parts[0]}/${parts[1]}`;
        }
        
        return parts[0];
    }
}
