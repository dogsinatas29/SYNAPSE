import { ReferenceResolver } from '../src/core/ReferenceResolver';

const existingNodes = new Set([
    'a/b/local.h',
    'a/b/source.c',
    'x/y/remote.h',
    'x/y/source.c',
    'a/b/other_source.c'
]);

const symbolIndex = {
    lookupSymbol: (symbol: string) => undefined
};

const testRefs = [
    {
        sourceFilePath: 'a/b/source.c',
        ref: { target: 'missing.h', type: 'dependency', provenance: 'DEPENDENCY' }
    }
];

const results = ReferenceResolver.resolve(testRefs as any, existingNodes, symbolIndex as any, '/path/to/project');
console.log(JSON.stringify(results, null, 2));
