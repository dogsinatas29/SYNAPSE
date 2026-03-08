"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleEngine_1 = require("./src/core/RuleEngine");
const SynapseTaskProvider_1 = require("./src/providers/SynapseTaskProvider");
// Mock RuleEngine for testing
const ruleEngine = RuleEngine_1.RuleEngine.getInstance();
const mockRules = `
## 2. Exclusion & Refinement Rules
- \`README.md\`, \`test_exclusion.js\`
`;
// Helper to access private method (for testing purposes)
function testParseRules(engine, content) {
    // Reset
    engine.blacklistFiles = new Set();
    // Call private method
    engine.parseRules(content);
    return engine.blacklistFiles;
}
console.log('--- Testing RuleEngine Regex ---');
const blacklisted = testParseRules(ruleEngine, mockRules);
console.log('Blacklisted files:', Array.from(blacklisted));
if (blacklisted.has('test_exclusion.js')) {
    console.log('✅ PASS: test_exclusion.js successfully excluded.');
}
else {
    console.error('❌ FAIL: test_exclusion.js NOT excluded.');
}
console.log('\n--- Testing SynapseTaskProvider ---');
try {
    const provider = new SynapseTaskProvider_1.SynapseTaskProvider();
    console.log('✅ PASS: SynapseTaskProvider instantiated successfully.');
}
catch (e) {
    console.error('❌ FAIL: SynapseTaskProvider instantiation failed:', e);
}
//# sourceMappingURL=verify_rules.js.map