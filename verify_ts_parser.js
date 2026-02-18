"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const FileScanner_1 = require("./src/core/FileScanner");
const FlowScanner_1 = require("./src/core/FlowScanner");
const path = __importStar(require("path"));
const scanner = new FileScanner_1.FileScanner();
const flowScanner = new FlowScanner_1.FlowScanner();
const testFile = path.resolve(__dirname, 'src/types/schema.ts');
const logicFile = path.resolve(__dirname, 'src/core/FlowScanner.ts');
const summary = scanner.scanFile(testFile);
console.log('--- TypeScript Scan Result ---');
console.log('File:', testFile);
console.log('Classes/Types:', summary.classes);
console.log('Functions:', summary.functions);
console.log('References:', summary.references);
if (summary.classes.includes('NodeType') && summary.classes.includes('ProjectState')) {
    console.log('\n✅ SUCCESS: TypeScript types/interfaces detected!');
}
const flowData = flowScanner.scanForFlow(logicFile);
console.log('\n--- TypeScript Flow Result ---');
console.log('Flow Name:', flowData.name);
const decisionSteps = flowData.steps.filter(s => s.type === 'decision');
const tryBlocks = flowData.steps.filter(s => s.label === 'Try Block');
console.log('Decision Points:', decisionSteps.map(s => s.label));
console.log('Try Blocks Found:', tryBlocks.length);
if (decisionSteps.length > 0 && tryBlocks.length > 0) {
    console.log('\n✅ SUCCESS: TypeScript logic (if/try) detected in Flow!');
}
else {
    console.log('\n❌ FAILURE: TypeScript logic detection incomplete.');
}
//# sourceMappingURL=verify_ts_parser.js.map