import * as crypto from 'crypto';
import { ContributionNode, ContributionEdge } from '../../types/schema';

export class EdgeGenerator {
    private static hashEdge(from: string, to: string): string {
        return crypto.createHash('sha256').update(`${from}:${to}`).digest('hex').slice(0, 16);
    }

    generate(comparedNodes: ContributionNode[], harvestedNodes: ContributionNode[]): ContributionEdge[] {
        const edges: ContributionEdge[] = [];
        const harvestedMap = new Map<string, ContributionNode>();

        for (const h of harvestedNodes) {
            harvestedMap.set(h.id, h);
        }

        for (const c of comparedNodes) {
            const match = harvestedMap.get(c.id);
            if (match) {
                edges.push({
                    id: EdgeGenerator.hashEdge(c.id, match.id),
                    from: c.id,
                    to: match.id,
                    relation: 'derived_from'
                });
            }
        }

        return edges;
    }
}
