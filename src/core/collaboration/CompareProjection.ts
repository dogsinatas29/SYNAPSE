import * as crypto from 'crypto';
import { CompareResult, ContributionNode } from '../../types/schema';

export class CompareProjection {
    private static hashIdentity(filePath: string, userId: string): string {
        return crypto.createHash('sha256').update(`${filePath}:${userId}`).digest('hex').slice(0, 16);
    }

    project(results: CompareResult[]): ContributionNode[] {
        const nodes: ContributionNode[] = [];
        for (const r of results) {
            nodes.push({
                id: CompareProjection.hashIdentity(r.filePath, r.userId),
                kind: 'compared',
                filePath: r.filePath,
                userId: r.userId
            });
        }
        return nodes;
    }
}
