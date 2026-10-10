import { buildNodes } from '../src/core/NodeBuilder';

const summaries = [
    { filePath: 'ash/session/session_controller_impl.h', summary: { declarations: [], references: [], exports: [], imports: [], hasReactJSX: false, hasNestDecorators: false } },
    { filePath: 'src/main.cc', summary: { declarations: [], references: [], exports: [], imports: [], hasReactJSX: false, hasNestDecorators: false } }
];

const dirTree = { name: 'root', path: '.', isDirectory: true, children: [] };
const result = buildNodes(summaries as any, dirTree as any);

console.log("Nodes generated:");
console.log(result.nodes.map((n: any) => n.id));
console.log("nodeIds size:", result.nodeIds.size);
