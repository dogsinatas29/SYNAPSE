"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleEngine_1 = require("./src/core/RuleEngine");
// Mock RuleEngine for testing
const ruleEngine = RuleEngine_1.RuleEngine.getInstance();
const mockRules = `
## 2. Exclusion & Refinement Rules
- \`README.md\`, \`test_exclusion.js\`
`;
// Helper to access private method (for testing purposes)
// We need to use 'any' to bypass private access restriction in test
const engine = ruleEngine;
// Reset sets for clean test
engine.blacklistFiles = new Set();
engine.ignoreFolders = new Set();
engine.binaryExcludes = new Set();
// Call private method
engine.parseRules(mockRules);
console.log('--- Testing RuleEngine Regex ---');
console.log('Blacklisted files:', Array.from(engine.blacklistFiles));
if (engine.blacklistFiles.has('test_exclusion.js')) {
    console.log('✅ PASS: test_exclusion.js successfully excluded.');
}
else {
    console.error('❌ FAIL: test_exclusion.js NOT excluded.');
}
if (engine.blacklistFiles.has('readme.md')) {
    console.log('✅ PASS: readme.md successfully excluded.');
}
else {
    console.error('❌ FAIL: readme.md NOT excluded.');
}
//# sourceMappingURL=verify_rules_only.js.map