/*
 * SYNAPSE - Visual Architecture Engine
 * Copyright (C) 2024 synapse-team (and contributors)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
import * as path from 'path';
import * as fs from 'fs';

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
            hoverProvider: true,
            definitionProvider: true
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

// Helper to extract file path from a line at a given offset
function getFilePathAtPosition(text: string, offset: number): string | null {
    // Search for patterns like: 📄 path/to/file, - path/to/file: desc, [path/to/file]
    // A simple approach: find the sequence of characters that looks like a path around the offset
    const pathChars = /[a-zA-Z0-9_./-]/;
    let start = offset;
    while (start > 0 && pathChars.test(text[start - 1])) {
        start--;
    }
    let end = offset;
    while (end < text.length && pathChars.test(text[end])) {
        end++;
    }

    const possiblePath = text.slice(start, end).trim();
    // Validate if it looks like a file path (has extension or is in a known folder structure list)
    if (possiblePath.includes('.') && possiblePath.length > 2) {
        return possiblePath;
    }
    return null;
}

connection.onHover((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const line = doc.getText().split('\n')[params.position.line];
    const filePath = getFilePathAtPosition(line, params.position.character);

    if (filePath) {
        return {
            contents: {
                kind: 'markdown',
                value: `**SYNAPSE File Reference**\n\nPath: \`${filePath}\`\n\n*Press Ctrl+Click to open*`
            }
        };
    }
    return null;
});

connection.onDefinition((params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const line = doc.getText().split('\n')[params.position.line];
    const filePath = getFilePathAtPosition(line, params.position.character);

    if (filePath) {
        const baseUri = params.textDocument.uri;
        if (baseUri.startsWith('file://')) {
            const fsPath = baseUri.replace('file://', '');
            const baseDir = path.dirname(fsPath);
            const targetFsPath = path.resolve(baseDir, filePath);
            const targetUri = 'file://' + targetFsPath;

            return {
                uri: targetUri,
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 }
                }
            };
        }
    }
    return null;
});

// Diagnostics logic
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    const text = textDocument.getText();
    const pattern = /(?:📄|[-\*]\s+[`]?|파일:\s*)([a-zA-Z0-9_./-]+\.[a-z]+)/g;
    let m: RegExpExecArray | null;

    const baseUri = textDocument.uri;
    const fsPath = baseUri.replace('file://', '');
    const baseDir = path.dirname(fsPath);

    const diagnostics: any[] = [];
    while ((m = pattern.exec(text))) {
        const filePath = m[1];
        const targetFsPath = path.resolve(baseDir, filePath);

        if (!fs.existsSync(targetFsPath)) {
            diagnostics.push({
                severity: 2, // Warning
                range: {
                    start: textDocument.positionAt(m.index),
                    end: textDocument.positionAt(m.index + m[0].length)
                },
                message: `File not found: ${filePath}`,
                source: 'SYNAPSE'
            });
        }
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
