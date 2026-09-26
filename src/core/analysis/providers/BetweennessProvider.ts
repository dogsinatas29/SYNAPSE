export class BetweennessProvider {
    public calculate(nodeIds: string[], edges: {from: string, to: string}[]): Map<string, number> {
        const centrality = new Map<string, number>();
        const idToIdx = new Map<string, number>();
        nodeIds.forEach((id, i) => {
            idToIdx.set(id, i);
            centrality.set(id, 0);
        });
        const N = nodeIds.length;
        
        const outAdj: number[][] = Array.from({length: N}, () => []);
        
        for (const e of edges) {
            const f = e.from;
            const t = e.to;
            const fi = idToIdx.get(f);
            const ti = idToIdx.get(t);
            if (fi !== undefined && ti !== undefined) {
                outAdj[fi].push(ti);
            }
        }
        
        const bc = new Float64Array(N);
        
        for (let s = 0; s < N; s++) {
            const stack: number[] = [];
            const pred: number[][] = Array.from({length: N}, () => []);
            const sigma = new Float64Array(N);
            const dist = new Int32Array(N).fill(-1);
            
            sigma[s] = 1;
            dist[s] = 0;
            
            const queue: number[] = [s];
            let qi = 0;
            
            while (qi < queue.length) {
                const v = queue[qi++];
                stack.push(v);
                
                for (const w of outAdj[v]) {
                    if (dist[w] < 0) {
                        queue.push(w);
                        dist[w] = dist[v] + 1;
                    }
                    if (dist[w] === dist[v] + 1) {
                        sigma[w] += sigma[v];
                        pred[w].push(v);
                    }
                }
            }
            
            const delta = new Float64Array(N);
            while (stack.length > 0) {
                const w = stack.pop()!;
                for (const v of pred[w]) {
                    delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
                }
                if (w !== s) {
                    bc[w] += delta[w];
                }
            }
        }
        
        for (let i = 0; i < N; i++) {
            centrality.set(nodeIds[i], bc[i]);
        }
        
        return centrality;
    }
}
