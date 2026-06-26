import * as crypto from 'crypto';
import { HarvestCandidate, ContributionNode } from '../../types/schema';

export class HarvestProjection {
    private static hashIdentity(filePath: string, userId: string): string {
        return crypto.createHash('sha256').update(`${filePath}:${userId}`).digest('hex').slice(0, 16);
    }

    project(candidates: HarvestCandidate[]): ContributionNode[] {
        const nodes: ContributionNode[] = [];
        for (const c of candidates) {
            nodes.push({
                id: HarvestProjection.hashIdentity(c.filePath, c.userId),
                kind: 'harvested',
                filePath: c.filePath,
                userId: c.userId
            });
        }
        return nodes;
    }
}
