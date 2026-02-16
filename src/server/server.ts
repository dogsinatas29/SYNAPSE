import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { GeminiParser } from '../core/GeminiParser';
import { FlowScanner } from '../core/FlowScanner';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    connection.console.log('SYNAPSE Language Server initializing...');
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
        }
    };
    return result;
});

connection.onInitialized(() => {
    connection.console.log('SYNAPSE Language Server initialized and ready.');
});

// Custom request handlers
connection.onRequest('synapse/analyzeGemini', async (params: { filePath: string }) => {
    connection.console.log(`[LSP] Handling analyzeGemini request for: ${params.filePath}`);
    const parser = new GeminiParser();
    try {
        const structure = await parser.parseGeminiMd(params.filePath);
        return { success: true, structure };
    } catch (error) {
        connection.console.error(`[LSP] analyzeGemini failed: ${error}`);
        return { success: false, error: String(error) };
    }
});

connection.onRequest('synapse/scanFlow', async (params: { filePath: string }) => {
    connection.console.log(`[LSP] Handling scanFlow request for: ${params.filePath}`);
    const scanner = new FlowScanner();
    try {
        const flowData = scanner.scanForFlow(params.filePath);
        return { success: true, flowData };
    } catch (error) {
        connection.console.error(`[LSP] scanFlow failed: ${error}`);
        return { success: false, error: String(error) };
    }
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
