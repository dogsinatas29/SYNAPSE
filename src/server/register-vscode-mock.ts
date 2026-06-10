const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request: string, parent: any, ...args: any[]) {
    if (request === 'vscode') {
        return require.resolve('./vscode');
    }
    return originalResolve.call(this, request, parent, ...args);
};
