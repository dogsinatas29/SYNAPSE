import * as fs from 'fs';
import * as ts from 'typescript';

export interface ASTVerificationResult {
    filePath: string;
    nodeCount: {
        interface: number;
        type: number;
        enum: number;
        class: number;
        function: number;
        variable: number;
        statement: number;
        total: number;
    };
    ratios: {
        interface: number;
        type: number;
        enum: number;
        class: number;
        function: number;
        variable: number;
        statement: number;
    };
    classification: 'RUNTIME_HUB' | 'HEALTHY_CONTRACT' | 'TYPE_ONLY' | 'CONTRACT_HUB' | 'BARREL_EXPORT' | 'HEADER_CONTRACT' | 'TEST_ARTIFACT' | 'DATA_HUB' | 'DEGRADED';
    classificationReason: string[];
    multiplier: number;
    confidence: number;
    degraded: boolean;
    error?: string;
}

const cache = new Map<string, ASTVerificationResult>();

function getCacheKey(filePath: string): string {
    try {
        return `${filePath}:${fs.statSync(filePath).mtimeMs}`;
    } catch {
        return filePath;
    }
}

function countNodes(sourceFile: ts.SourceFile): ASTVerificationResult['nodeCount'] {
    const counts = { interface: 0, type: 0, enum: 0, class: 0, function: 0, variable: 0, statement: 0, total: 0 };
    function visit(node: ts.Node) {
        let isTracked = false;
        if (ts.isInterfaceDeclaration(node)) { counts.interface++; isTracked = true; }
        else if (ts.isTypeAliasDeclaration(node)) { counts.type++; isTracked = true; }
        else if (ts.isEnumDeclaration(node)) { counts.enum++; isTracked = true; }
        else if (ts.isClassDeclaration(node)) { counts.class++; isTracked = true; }
        else if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) { counts.function++; isTracked = true; }
        else if (ts.isVariableDeclaration(node)) { counts.variable++; isTracked = true; }
        else if (ts.isExpressionStatement(node) || ts.isReturnStatement(node) || ts.isIfStatement(node)) { counts.statement++; isTracked = true; }
        
        if (isTracked) counts.total++;
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return counts;
}

function classify(counts: ASTVerificationResult['nodeCount'], filePath: string): { classification: ASTVerificationResult['classification']; reason: string[]; multiplier: number } {
    const total = counts.total || 1;
    const reasons: string[] = [];

    // Test artifact — highest priority
    if (filePath.includes('.test.') || filePath.includes('__tests__') || filePath.includes('.spec.')) {
        return { classification: 'TEST_ARTIFACT', reason: ['Test 파일'], multiplier: 0.1 };
    }

    const hasRuntime = counts.function > 0 || counts.statement > 0 || counts.variable > 3;
    const hasTypes = counts.interface > 0 || counts.type > 0 || counts.enum > 0 || counts.class > 0;

    const runtimeRatio = (counts.function + counts.statement) / total;
    const typeRatio = (counts.interface + counts.type + counts.enum) / total;

    // Barrel export: index file with no runtime
    if ((filePath.endsWith('index.ts') || filePath.includes('/barrel')) && !hasRuntime) {
        return { classification: 'BARREL_EXPORT', reason: ['Re-export 전용'], multiplier: 0.3 };
    }

    // TYPE_ONLY: no runtime, has types
    if (!hasRuntime && hasTypes) {
        if (counts.interface > 5 && counts.type > 10) {
            return { classification: 'CONTRACT_HUB', reason: ['Contract Hub: 타입 정의 집중'], multiplier: 0.5 };
        }
        return { classification: 'TYPE_ONLY', reason: ['Runtime Logic 없음'], multiplier: 0.2 };
    }

    // RUNTIME_HUB: heavy runtime
    if (runtimeRatio > 0.3) {
        reasons.push(`Runtime ${Math.round(runtimeRatio * 100)}%`);
        return { classification: 'RUNTIME_HUB', reason: reasons, multiplier: 1.0 };
    }

    // HEADER_CONTRACT: declarations only, low runtime
    if (hasTypes && !hasRuntime) {
        return { classification: 'HEADER_CONTRACT', reason: ['Declaration 중심, Runtime 없음'], multiplier: 0.4 };
    }

    // DATA_HUB: tiny file
    if (counts.total < 5) {
        return { classification: 'DATA_HUB', reason: ['데이터 전용'], multiplier: 0.4 };
    }

    return { classification: 'HEALTHY_CONTRACT', reason: ['계약 + 구현 혼재'], multiplier: 0.8 };
}

export class ASTVerificationEngine {
    verifyFile(filePath: string, workspaceRoot: string = ''): ASTVerificationResult {
        const path = require('path');
        const absPath = path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
        const key = getCacheKey(absPath);
        if (cache.has(key)) {
            const cached = { ...cache.get(key)! };
            cached.filePath = filePath; // keep relative
            return cached;
        }

        try {
            const content = fs.readFileSync(absPath, 'utf8');
            const source = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true);
            const counts = countNodes(source);
            const { classification, reason, multiplier } = classify(counts, filePath);
            const total = counts.total || 1;
            const ratios = {
                interface: Math.round((counts.interface / total) * 100),
                type: Math.round((counts.type / total) * 100),
                enum: Math.round((counts.enum / total) * 100),
                class: Math.round((counts.class / total) * 100),
                function: Math.round((counts.function / total) * 100),
                variable: Math.round((counts.variable / total) * 100),
                statement: Math.round((counts.statement / total) * 100)
            };
            const result: ASTVerificationResult = {
                filePath,
                nodeCount: counts,
                ratios,
                classification,
                classificationReason: reason,
                multiplier,
                confidence: 0.95,
                degraded: false
            };
            cache.set(key, result);
            return result;
        } catch (e) {
            console.error('[AST_VERIFY]', absPath, e instanceof Error ? e.stack : e);
            const degraded: ASTVerificationResult = {
                filePath,
                nodeCount: { interface: 0, type: 0, enum: 0, class: 0, function: 0, variable: 0, statement: 0, total: 0 },
                ratios: { interface: 0, type: 0, enum: 0, class: 0, function: 0, variable: 0, statement: 0 },
                classification: 'DEGRADED',
                classificationReason: ['AST 파싱 실패 - 기존 보고서 유지'],
                multiplier: 1.0,
                confidence: 0.0,
                degraded: true,
                error: e instanceof Error ? e.message : String(e)
            };
            cache.set(key, degraded);
            return degraded;
        }
    }

    verifyTopFiles(filePaths: string[], workspaceRoot: string = ''): ASTVerificationResult[] {
        return filePaths.map(f => this.verifyFile(f, workspaceRoot));
    }
}
