import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { LanguageResolver } from './LanguageResolver';
import { CodeSummary, EdgeProvenance } from '../../types/schema';
import { Logger } from '../../utils/Logger';

interface CacheEntry {
    mtime: number;
    provenances: Record<string, EdgeProvenance>;
}

export class TypeScriptResolver implements LanguageResolver {
    private cache: Map<string, CacheEntry> = new Map();

    supportsExtension(ext: string): boolean {
        return ['.ts', '.js', '.tsx', '.jsx'].includes(ext);
    }

    resolve(filePath: string, content: string, summary: CodeSummary): boolean {
        if (!summary.references || summary.references.length === 0) return true;

        try {
            const stat = fs.statSync(filePath);
            const mtime = stat.mtimeMs;
            
            // 1. Cache Check
            const cached = this.cache.get(filePath);
            if (cached && cached.mtime === mtime) {
                // Apply cached provenances
                this.applyProvenances(summary, cached.provenances);
                return true;
            }

            // 2. Parse AST
            const sourceFile = ts.createSourceFile(
                filePath,
                content,
                ts.ScriptTarget.Latest,
                true
            );

            // 3. Map imported symbols to their modules
            const importSymbolMap = new Map<string, string>(); // symbol -> module target
            const typeOnlyImports = new Set<string>(); // target -> true if module is only imported for types

            ts.forEachChild(sourceFile, node => {
                if (ts.isImportDeclaration(node)) {
                    const moduleSpecifier = node.moduleSpecifier;
                    if (ts.isStringLiteral(moduleSpecifier)) {
                        let target = moduleSpecifier.text;
                        // Match JsTsScanner logic: extract basename
                        target = path.basename(target, path.extname(target));

                        const isTypeImport = node.importClause?.isTypeOnly || false;
                        if (isTypeImport) {
                            typeOnlyImports.add(target);
                        }

                        // Default import: import Foo from './foo'
                        if (node.importClause?.name) {
                            importSymbolMap.set(node.importClause.name.text, target);
                        }
                        // Named & Namespace imports
                        if (node.importClause?.namedBindings) {
                            if (ts.isNamedImports(node.importClause.namedBindings)) {
                                node.importClause.namedBindings.elements.forEach(el => {
                                    importSymbolMap.set(el.name.text, target);
                                });
                            } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                                // Namespace import: import * as Foo from './foo'
                                importSymbolMap.set(node.importClause.namedBindings.name.text, target);
                            }
                        }
                    }
                }
            });

            // 4. Track usage
            const usedInConstructor = new Set<string>(); // target
            const usedInFunctionCall = new Set<string>(); // target
            const usedInInheritance = new Set<string>(); // target
            const usedInDecorator = new Set<string>(); // target
            const usedInRegistration = new Set<string>(); // target
            const usedAsType = new Set<string>(); // target
            
            const visit = (node: ts.Node) => {
                // Decorator
                if (ts.isDecorator(node)) {
                    let expr = node.expression;
                    if (ts.isCallExpression(expr)) {
                        expr = expr.expression;
                    }
                    if (ts.isIdentifier(expr)) {
                        const target = importSymbolMap.get(expr.text);
                        if (target) usedInDecorator.add(target);
                    }
                }
                
                // Function Call
                if (ts.isCallExpression(node)) {
                    let expr = node.expression;
                    let isRegistration = false;
                    
                    // Handle Foo.bar() or registerAction()
                    if (ts.isPropertyAccessExpression(expr)) {
                        if (expr.name.text.startsWith('register')) {
                            isRegistration = true;
                        }
                        expr = expr.expression;
                    } else if (ts.isIdentifier(expr) && expr.text.startsWith('register')) {
                        isRegistration = true;
                    }

                    if (ts.isIdentifier(expr)) {
                        const target = importSymbolMap.get(expr.text);
                        if (target) {
                            if (isRegistration) {
                                usedInRegistration.add(target);
                            } else {
                                usedInFunctionCall.add(target);
                            }
                        }
                    }
                }

                // Constructor / New
                if (ts.isNewExpression(node)) {
                    const expr = node.expression;
                    if (ts.isIdentifier(expr)) {
                        const target = importSymbolMap.get(expr.text);
                        if (target) usedInConstructor.add(target);
                    }
                }

                // Inheritance (extends / implements)
                if (ts.isHeritageClause(node)) {
                    node.types.forEach(typeNode => {
                        const expr = typeNode.expression;
                        if (ts.isIdentifier(expr)) {
                            const target = importSymbolMap.get(expr.text);
                            if (target) usedInInheritance.add(target);
                        }
                    });
                }
                
                // Type References
                if (ts.isTypeReferenceNode(node)) {
                    const typeName = node.typeName;
                    if (ts.isIdentifier(typeName)) {
                        const target = importSymbolMap.get(typeName.text);
                        if (target) usedAsType.add(target);
                    }
                }

                ts.forEachChild(node, visit);
            };

            visit(sourceFile);

            // 5. Assign Provenance
            const provenances: Record<string, EdgeProvenance> = {};
            
            // First drop unused edges by marking them, or keeping them UNKNOWN_RUNTIME if we don't know
            // Wait, we only resolve targets that were mapped. What about raw requires or dynamic imports?
            // If the scanner found it, we check if it was imported statically.
            
            summary.references.forEach(ref => {
                const target = ref.target;
                
                if (usedInInheritance.has(target)) {
                    provenances[target] = EdgeProvenance.INHERITANCE;
                } else if (usedInConstructor.has(target)) {
                    provenances[target] = EdgeProvenance.CONSTRUCTOR_CALL;
                } else if (usedInRegistration.has(target)) {
                    provenances[target] = EdgeProvenance.FRAMEWORK_REGISTRATION;
                } else if (usedInFunctionCall.has(target)) {
                    provenances[target] = EdgeProvenance.FUNCTION_CALL;
                } else if (usedInDecorator.has(target)) {
                    provenances[target] = EdgeProvenance.DECORATOR;
                } else if (usedAsType.has(target) || typeOnlyImports.has(target)) {
                    provenances[target] = EdgeProvenance.TYPE_ONLY;
                } else {
                    // It might be a dynamic import, or a require(), or we just couldn't track it.
                    // Keep it as UNKNOWN_RUNTIME.
                    // If it was statically imported but never used, it could be UNUSED_IMPORT,
                    // but we agreed to just drop those. Let's see if it's in the import map.
                    const isImported = Array.from(importSymbolMap.values()).includes(target);
                    if (isImported) {
                        // Imported but not used in our tracked scenarios. Could be a variable reference.
                        // For safety, let's keep it UNKNOWN_RUNTIME.
                        provenances[target] = EdgeProvenance.UNKNOWN_RUNTIME;
                    } else {
                        // Scanner found it via regex but not statically imported (e.g., require, import()).
                        provenances[target] = EdgeProvenance.UNKNOWN_RUNTIME;
                    }
                }
            });

            // Update cache
            this.cache.set(filePath, { mtime, provenances });

            // Apply
            this.applyProvenances(summary, provenances);
            
            return true;
        } catch (error) {
            Logger.warn(`[TypeScriptResolver] Error resolving ${filePath}: ${error}`);
            return false;
        }
    }

    private applyProvenances(summary: CodeSummary, provenances: Record<string, EdgeProvenance>) {
        // Apply provenance, removing edges that are effectively unused if we were to implement UNUSED_IMPORT
        // Currently we fallback to UNKNOWN_RUNTIME.
        summary.references.forEach(ref => {
            if (provenances[ref.target]) {
                ref.provenance = provenances[ref.target];
            }
        });
    }
}
