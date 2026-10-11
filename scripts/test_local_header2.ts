import { ReferenceResolver } from '../src/core/ReferenceResolver';
import { SymbolIndex } from '../src/core/SymbolIndex';

const existingNodes = new Set([
    'drivers/net/ethernet/meta/fbnic/fbnic_rpc.h',
    'drivers/net/ethernet/meta/fbnic/fbnic_netdev.h',
    'drivers/net/ethernet/meta/fbnic/fbnic.h',
    'drivers/net/ethernet/meta/fbnic/fbnic_netdev.c'
]);

const symbolIndex = new SymbolIndex();
// No symbols needed for this test

const testRefs = [
    {
        sourceFilePath: 'drivers/net/ethernet/meta/fbnic/fbnic.h',
        ref: {
            target: 'fbnic_rpc.h',
            type: 'dependency',
            provenance: 'DEPENDENCY'
        }
    },
    {
        sourceFilePath: 'drivers/net/ethernet/meta/fbnic/fbnic_netdev.c',
        ref: {
            target: 'fbnic_netdev.h',
            type: 'dependency',
            provenance: 'DEPENDENCY'
        }
    }
];

const results = ReferenceResolver.resolve(testRefs as any, existingNodes, symbolIndex, '/path/to/linux');
console.log(JSON.stringify(results, null, 2));
