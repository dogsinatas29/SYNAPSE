import { ReferenceResolver } from './src/core/ReferenceResolver';

const projectRoot = '/home/dogsinatas/다운로드/godot-master';
const existingNodeIds = new Set<string>(); // MOCK: File was not parsed
const symbolIndex = { lookupSymbol: () => undefined } as any;

const validReferences = [
    {
        sourceFilePath: 'some/source.cpp',
        ref: {
            target: '2d/nav_map_builder_2d.h',
            type: 'dependency',
            provenance: 'INCLUDE',
            fullPath: '/home/dogsinatas/다운로드/godot-master/modules/navigation_2d/2d/nav_map_builder_2d.h'
        }
    }
] as any;

const resolved = ReferenceResolver.resolve(validReferences, existingNodeIds, symbolIndex, projectRoot);
console.log(resolved);
