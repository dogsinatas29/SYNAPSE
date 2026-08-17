import * as fs from 'fs';
import * as path from 'path';
import { ProjectStateSerializer } from '../src/core/transaction/ProjectStateSerializer';

const statePath = process.argv[2];
if (!statePath) {
    console.error('Usage: ts-node apply-strip-layer.ts <path_to_project_state.json>');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(statePath, 'utf8');
    const state = JSON.parse(rawData);
    
    // serialize() will strip visual, status, layer, classes, variables, etc.
    const strippedJson = ProjectStateSerializer.serialize(state);
    
    fs.writeFileSync(statePath, strippedJson, 'utf8');
    console.log(`[SUCCESS] Strip Layer applied to ${statePath}`);
    console.log(`[INFO] Original Size: ${(rawData.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[INFO] Stripped Size: ${(strippedJson.length / 1024 / 1024).toFixed(2)} MB`);
} catch (err) {
    console.error(`[ERROR] Failed to strip JSON:`, err);
    process.exit(1);
}
