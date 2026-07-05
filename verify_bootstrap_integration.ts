/**
 * Integration test: Verify BootstrapEngine registration path.
 * 
 * Usage: npx ts-node verify_bootstrap_integration.ts
 */

import { BootstrapEngine } from './src/bootstrap/BootstrapEngine';
import { ScannerRegistry } from './src/core/ScannerRegistry';

// Clear any previous state
ScannerRegistry.getInstance().clear();

console.log('\n=== BootstrapEngine Integration Verification ===\n');

console.log('Initial registry count:', ScannerRegistry.getInstance().count());

// 1st BootstrapEngine creation
const engine1 = new BootstrapEngine();
const count1 = ScannerRegistry.getInstance().count();
console.log('After 1st BootstrapEngine:', count1);

// 2nd BootstrapEngine creation
const engine2 = new BootstrapEngine();
const count2 = ScannerRegistry.getInstance().count();
console.log('After 2nd BootstrapEngine:', count2);

// 3rd BootstrapEngine creation
const engine3 = new BootstrapEngine();
const count3 = ScannerRegistry.getInstance().count();
console.log('After 3rd BootstrapEngine:', count3);

const expected = 10;
const passed = count1 === expected && count2 === expected && count3 === expected;

console.log(`\nExpected: ${expected} (constant)`);
console.log(`Result: ${passed ? 'ALL PASS ✅' : 'FAILED ❌'}`);

if (!passed) {
    console.error('Registry count increased across BootstrapEngine instances!');
    process.exit(1);
}

console.log('\nScanner Layer is now SEALED.\n');
process.exit(0);
