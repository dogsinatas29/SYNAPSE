const { isIgnoredFile, isIgnoredFolder } = require('./dist/utils/exclusionRules');

console.log('Testing isIgnoredFile:');
console.log('v0.2.0_self_sync.js:', isIgnoredFile('v0.2.0_self_sync.js')); // true
console.log('canvas-engine.js:', isIgnoredFile('canvas-engine.js')); // true
console.log('src/extension.ts:', isIgnoredFile('src/extension.ts')); // false
console.log('ui/index.html:', isIgnoredFile('ui/index.html')); // false

console.log('\nTesting isIgnoredFolder:');
console.log('ui:', isIgnoredFolder('ui')); // true
console.log('src:', isIgnoredFolder('src')); // false
console.log('node_modules:', isIgnoredFolder('node_modules')); // true
