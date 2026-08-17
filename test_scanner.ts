import * as fs from 'fs';
import { JsTsScanner } from './src/core/JsTsScanner';
import { CodeSummary } from './src/types/schema';

const scanner = new JsTsScanner();
const summary: CodeSummary = { classes: [], functions: [], references: [] };
const content = fs.readFileSync('./src/core/ir/generators/BoundaryCandidateGenerator.ts', 'utf8');
scanner.parse(content, summary);
console.log(JSON.stringify(summary.references, null, 2));
