const { ReferenceResolver } = require('./src/core/ReferenceResolver');
const path = require('path');

const projectRoot = '/home/dogsinatas/다운로드/godot-master';
const existingNodeIds = new Set(['modules/navigation_2d/2d/nav_map_builder_2d.h']);
const symbolIndex = { lookupSymbol: () => undefined };

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
];

const resolved = ReferenceResolver.resolve(validReferences, existingNodeIds, symbolIndex, projectRoot);
console.log(resolved);
