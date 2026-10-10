import { ReferenceResolver } from './src/core/ReferenceResolver';
import { SymbolIndex } from './src/core/SymbolIndex';

async function test() {
    const projectRoot = '/home/dogsinatas/다운로드/godot-master';
    const existingNodeIds = new Set<string>();
    const symbolIndex = SymbolIndex.getInstance();
    
    // Simulate DataPipeline behavior
    const refs = [{
        sourceId: 'core/core_bind.cpp',
        targetId: 'core/core_bind.compat.inc',
        originalTarget: 'core/core_bind.compat.inc',
        type: 'dependency',
        provenance: 'include'
    } as any];
    
    const resolved = ReferenceResolver.resolve(refs, existingNodeIds, symbolIndex, projectRoot);
    console.log(resolved);
}
test();
