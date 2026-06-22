const http = require('http');

http.get('http://localhost:3000/api/state', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const nodes = data.state.nodes || [];
            
            let clientNodes = nodes.filter(n => n.id.startsWith('client::'));
            console.log(`Total client nodes: ${clientNodes.length}`);
            
            let externalGhostMatches = 0;
            let userLayerMatches = 0;
            let externalGhostSourceNodes = 0;
            
            for (const n of clientNodes) {
                const isExternalNode = n.layer === 'external' || (n.data && n.data.layer === 'external') || n.type === 'external' || n.status === 'ghost';
                const isUserNode = n.layer === 'user' || (n.data && n.data.layer === 'user') || n.status === 'pending';
                
                if (isExternalNode) {
                    externalGhostMatches++;
                    if (n.type !== 'ghost' && n.status !== 'ghost') {
                        externalGhostSourceNodes++;
                        console.log(`Found Source Node matching External Ghost:`, n.id, n.layer, n.type, n.status, n.cluster_id);
                    }
                }
                if (isUserNode) userLayerMatches++;
            }
            
            console.log(`Client nodes classified as External: ${externalGhostMatches}`);
            console.log(`Client source nodes classified as External: ${externalGhostSourceNodes}`);
            console.log(`Client nodes classified as User: ${userLayerMatches}`);
            
        } catch(e) {
            console.error('Error parsing JSON', e);
        }
    });
}).on('error', e => console.error(e));
