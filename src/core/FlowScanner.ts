import * as fs from 'fs';
import * as path from 'path';

export interface FlowStep {
    id: string;
    type: 'process' | 'decision' | 'start' | 'end';
    label: string;
    description?: string;
    next?: string;
    alternateNext?: string; // For 'decision' type: true -> next, false -> alternateNext
    hidden?: boolean;
}

export interface FlowData {
    id: string;
    name: string;
    steps: FlowStep[];
}

export class FlowScanner {
    /**
     * 파일 내용을 분석하여 실행 흐름(Flow)을 추출
     */
    public scanForFlow(filePath: string): FlowData {
        const flowData: FlowData = {
            id: `flow_${path.basename(filePath)}`,
            name: `${path.basename(filePath)} Execution Flow`,
            steps: []
        };

        if (!fs.existsSync(filePath)) {
            return flowData;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath);

            if (['.ts', '.js'].includes(ext)) {
                this.parseJSFlow(content, flowData);
            } else if (ext === '.py') {
                this.parsePythonFlow(content, flowData);
            } else if (['.c', '.cpp', '.h', '.hpp', '.cc'].includes(ext)) {
                this.parseCppFlow(content, flowData);
            } else if (ext === '.rs') {
                this.parseRustFlow(content, flowData);
            } else {
                // Fallback: Simple file sequence
                flowData.steps.push({
                    id: 'step_0',
                    type: 'start',
                    label: `Start: ${path.basename(filePath)}`,
                    next: 'step_1'
                });
                flowData.steps.push({
                    id: 'step_1',
                    type: 'process',
                    label: 'Generic Processing',
                    next: 'step_2'
                });
                flowData.steps.push({
                    id: 'step_2',
                    type: 'end',
                    label: 'End'
                });
            }
        } catch (error) {
            console.error(`[SYNAPSE] Failed to scan flow for ${filePath}:`, error);
        }

        return flowData;
    }

    private parseJSFlow(content: string, flow: FlowData) {
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Module Entry',
            next: 'step_js_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';
        let lastPoppedBlock: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string } | null = null;

        const blockStack: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string }[] = [];
        let currentBracketLevel = 0;

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

            const openBrackets = (line.match(/\{/g) || []).length;
            const closeBrackets = (line.match(/\}/g) || []).length;

            if (line.startsWith('}') && blockStack.length > 0) {
                const top = blockStack[blockStack.length - 1];
                if (currentBracketLevel <= top.bracketLevel + 1 && closeBrackets > 0) {
                    lastPoppedBlock = blockStack.pop() || null;
                    if (lastPoppedBlock) {
                        if (lastPoppedBlock.type === 'while' || lastPoppedBlock.type === 'for') {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep) lastStep.next = lastPoppedBlock.headerId;
                            lastStepId = lastPoppedBlock.headerId;
                        } else if (lastPoppedBlock.joinPointId) {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep && !lastStep.next) lastStep.next = lastPoppedBlock.joinPointId;
                            lastStepId = lastPoppedBlock.joinPointId;
                        }
                    }
                }
            }

            const branchMatch = line.match(/\b(if|switch|while|for|catch|try)\b/);
            if (branchMatch) {
                const type = branchMatch[1];
                const condition = this.extractCondition(line) || type;
                const stepId = `step_js_${stepCounter++}`;
                const isDecision = ['if', 'while', 'switch'].includes(type);

                // Semantic tagging for EdgeType hints
                let edgeTypeHint: string | undefined;
                if (type === 'while' || type === 'for') edgeTypeHint = 'loop_back';

                flow.steps.push({
                    id: stepId,
                    type: isDecision ? 'decision' : 'process',
                    label: condition,
                    data: { edgeType: edgeTypeHint }
                } as any);

                if ((line.startsWith('else') || line.startsWith('} else')) && lastPoppedBlock && lastPoppedBlock.lastDecisionId) {
                    const decStep = flow.steps.find(s => s.id === lastPoppedBlock!.lastDecisionId);
                    if (decStep) decStep.alternateNext = stepId;

                    // If this else has a block, keep the same joinPointId
                    if (line.includes('{')) {
                        blockStack.push({
                            bracketLevel: currentBracketLevel,
                            headerId: stepId,
                            type,
                            joinPointId: lastPoppedBlock.joinPointId,
                            lastDecisionId: stepId
                        });
                    }
                } else {
                    const prevStep = flow.steps.find(s => s.id === lastStepId);
                    if (prevStep) prevStep.next = stepId;

                    if (line.includes('{')) {
                        let joinPointId: string | undefined;
                        if (type === 'if') {
                            joinPointId = `join_js_${stepCounter++}`;
                            flow.steps.push({ id: joinPointId, type: 'process', label: 'Merge', hidden: true });
                        }
                        blockStack.push({ bracketLevel: currentBracketLevel, headerId: stepId, type, joinPointId, lastDecisionId: stepId });
                    }
                }
                lastStepId = stepId;
            } else if (line.match(/^[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                const callMatch = line.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    if (!['if', 'switch', 'while', 'for', 'loop', 'require'].includes(funcName)) {
                        const stepId = `step_js_${stepCounter++}`;

                        // Check for API/DB semantic hints or Print
                        let semanticType: 'api_call' | 'db_query' | 'process' = 'process';
                        let labelPrefix = 'Call';

                        if (funcName.match(/fetch|axios|request|api|http/i)) semanticType = 'api_call';
                        else if (funcName.match(/query|find|save|update|delete|db|sql/i)) semanticType = 'db_query';
                        else if (funcName === 'console.log' || funcName === 'print') labelPrefix = 'Print';

                        flow.steps.push({
                            id: stepId,
                            type: 'process',
                            label: `${labelPrefix}: ${funcName === 'console.log' ? line.trim() : funcName}`,
                            data: { edgeType: semanticType === 'process' ? undefined : semanticType }
                        } as any);
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            currentBracketLevel += (openBrackets - closeBrackets);
            if (stepCounter > 100) break;
        }

        const finalStepId = 'step_js_final';
        flow.steps.push({ id: finalStepId, type: 'end', label: 'Execution Complete' });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        this.cleanupFlow(flow);
    }

    private parsePythonFlow(content: string, flow: FlowData) {
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Python Initialization',
            next: 'step_py_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';

        // { indent: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string }
        const blockStack: { indent: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string }[] = [];

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const rawLine = lines[i];
            const trimmedLine = rawLine.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            const currentIndent = rawLine.search(/\S/);

            // Check if blocks ended
            while (blockStack.length > 0 && currentIndent <= blockStack[blockStack.length - 1].indent &&
                !trimmedLine.startsWith('elif') && !trimmedLine.startsWith('else') && !trimmedLine.startsWith('except')) {
                const endedBlock = blockStack.pop();
                if (endedBlock) {
                    if (endedBlock.type === 'while' || endedBlock.type === 'for') {
                        const lastStep = flow.steps.find(s => s.id === lastStepId);
                        if (lastStep) lastStep.next = endedBlock.headerId;
                        lastStepId = endedBlock.headerId;
                    } else if (endedBlock.joinPointId) {
                        const lastStep = flow.steps.find(s => s.id === lastStepId);
                        if (lastStep && !lastStep.next) lastStep.next = endedBlock.joinPointId;
                        lastStepId = endedBlock.joinPointId;
                    }
                }
            }

            const blockMatch = trimmedLine.match(/^(def|class|if|for|while|with|try|elif|else|except|finally)\b\s*([a-zA-Z0-9_(.]+)?/);
            if (blockMatch) {
                const type = blockMatch[1];
                let label = blockMatch[2] || type;
                if (trimmedLine.includes('if __name__ == "__main__"')) label = 'Main Execution Block';

                const stepId = `step_py_${stepCounter++}`;
                const isDecision = ['if', 'elif', 'while'].includes(type);

                flow.steps.push({ id: stepId, type: isDecision ? 'decision' : 'process', label: label.replace(':', '').trim() });

                // Link logic
                if (type === 'elif' || type === 'else') {
                    const topBlock = blockStack.length > 0 ? blockStack[blockStack.length - 1] : null;

                    // [Fix] Before starting elif/else, link the PREVIOUS branch's last step to the join point
                    if (topBlock && topBlock.joinPointId) {
                        const lastStepInPrevBranch = flow.steps.find(s => s.id === lastStepId);
                        if (lastStepInPrevBranch && !lastStepInPrevBranch.next) {
                            lastStepInPrevBranch.next = topBlock.joinPointId;
                        }
                    }

                    if (topBlock && topBlock.lastDecisionId) {
                        const decisionNode = flow.steps.find(s => s.id === topBlock.lastDecisionId);
                        if (decisionNode) {
                            decisionNode.alternateNext = stepId;
                        }
                    }
                } else {
                    const prevStep = flow.steps.find(s => s.id === lastStepId);
                    if (prevStep) prevStep.next = stepId;
                }

                if (trimmedLine.endsWith(':')) {
                    let joinPointId: string | undefined;
                    if (type === 'if') {
                        joinPointId = `join_py_${stepCounter++}`;
                        flow.steps.push({ id: joinPointId, type: 'process', label: 'Merge', hidden: true });
                        blockStack.push({ indent: currentIndent, headerId: stepId, type, joinPointId, lastDecisionId: stepId });
                    } else if (type === 'elif') {
                        // Update the lastDecisionId for the next elif/else
                        const topBlock = blockStack[blockStack.length - 1];
                        if (topBlock) topBlock.lastDecisionId = stepId;
                    } else {
                        blockStack.push({ indent: currentIndent, headerId: stepId, type });
                    }
                }
                lastStepId = stepId;
            } else if (trimmedLine.match(/^[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                const callMatch = trimmedLine.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    // Include print in Python
                    if (!['super', 'len', 'range', 'enumerate', 'dict', 'list', 'set', 'str', 'int'].includes(funcName)) {
                        const stepId = `step_py_${stepCounter++}`;
                        const label = funcName === 'print' ? trimmedLine : `Call: ${funcName}`;
                        flow.steps.push({ id: stepId, type: 'process', label: label });
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            if (stepCounter > 100) break;
        }

        const finalStepId = 'step_py_final';
        flow.steps.push({ id: finalStepId, type: 'end', label: 'Execution Complete' });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        this.cleanupFlow(flow);
    }

    private parseCppFlow(content: string, flow: FlowData) {
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'C++ Main Entry',
            next: 'step_cpp_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';
        let lastPoppedBlock: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string } | null = null;

        const blockStack: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string }[] = [];
        let currentBracketLevel = 0;

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

            const openBrackets = (line.match(/\{/g) || []).length;
            const closeBrackets = (line.match(/\}/g) || []).length;

            if (line.startsWith('}') && blockStack.length > 0) {
                const top = blockStack[blockStack.length - 1];
                if (currentBracketLevel <= top.bracketLevel + 1 && closeBrackets > 0) {
                    lastPoppedBlock = blockStack.pop() || null;
                    if (lastPoppedBlock) {
                        if (lastPoppedBlock.type === 'while' || lastPoppedBlock.type === 'for') {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep) lastStep.next = lastPoppedBlock.headerId;
                            lastStepId = lastPoppedBlock.headerId;
                        } else if (lastPoppedBlock.joinPointId) {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep && !lastStep.next) lastStep.next = lastPoppedBlock.joinPointId;
                            lastStepId = lastPoppedBlock.joinPointId;
                        }
                    }
                }
            }

            const branchMatch = line.match(/\b(if|switch|while|for)\b\s*\(/);
            if (branchMatch) {
                const type = branchMatch[1];
                const condition = this.extractCondition(line) || type;
                const stepId = `step_cpp_${stepCounter++}`;
                const isDecision = ['if', 'while', 'switch'].includes(type);

                flow.steps.push({ id: stepId, type: isDecision ? 'decision' : 'process', label: condition });

                if ((line.startsWith('else') || line.startsWith('} else')) && lastPoppedBlock && lastPoppedBlock.lastDecisionId) {
                    const decStep = flow.steps.find(s => s.id === lastPoppedBlock!.lastDecisionId);
                    if (decStep) decStep.alternateNext = stepId;

                    if (line.includes('{')) {
                        blockStack.push({
                            bracketLevel: currentBracketLevel,
                            headerId: stepId,
                            type,
                            joinPointId: lastPoppedBlock.joinPointId,
                            lastDecisionId: stepId
                        });
                    }
                } else {
                    const prevStep = flow.steps.find(s => s.id === lastStepId);
                    if (prevStep) prevStep.next = stepId;

                    if (line.includes('{')) {
                        let joinPointId: string | undefined;
                        if (type === 'if') {
                            joinPointId = `join_cpp_${stepCounter++}`;
                            flow.steps.push({ id: joinPointId, type: 'process', label: 'Merge', hidden: true });
                        }
                        blockStack.push({ bracketLevel: currentBracketLevel, headerId: stepId, type, joinPointId, lastDecisionId: stepId });
                    }
                }
                lastStepId = stepId;
            } else if (line.match(/^[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                const callMatch = line.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    if (!['if', 'switch', 'while', 'for', 'loop', 'printf', 'fprintf', 'std::cout'].includes(funcName)) {
                        const stepId = `step_cpp_${stepCounter++}`;
                        flow.steps.push({ id: stepId, type: 'process', label: `Call: ${funcName}` });
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            currentBracketLevel += (openBrackets - closeBrackets);
            if (stepCounter > 100) break;
        }

        const finalStepId = 'step_cpp_final';
        flow.steps.push({ id: finalStepId, type: 'end', label: 'Execution Complete' });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        this.cleanupFlow(flow);
    }

    private parseRustFlow(content: string, flow: FlowData) {
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Rust Main Entry',
            next: 'step_rs_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';
        let lastPoppedBlock: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string } | null = null;

        const blockStack: { bracketLevel: number, headerId: string, type: string, joinPointId?: string, lastDecisionId?: string }[] = [];
        let currentBracketLevel = 0;

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

            const openBrackets = (line.match(/\{/g) || []).length;
            const closeBrackets = (line.match(/\}/g) || []).length;

            if (line.startsWith('}') && blockStack.length > 0) {
                const top = blockStack[blockStack.length - 1];
                if (currentBracketLevel <= top.bracketLevel + 1 && closeBrackets > 0) {
                    lastPoppedBlock = blockStack.pop() || null;
                    if (lastPoppedBlock) {
                        if (lastPoppedBlock.type === 'while' || lastPoppedBlock.type === 'for' || lastPoppedBlock.type === 'loop') {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep) lastStep.next = lastPoppedBlock.headerId;
                            lastStepId = lastPoppedBlock.headerId;
                        } else if (lastPoppedBlock.joinPointId) {
                            const lastStep = flow.steps.find(s => s.id === lastStepId);
                            if (lastStep && !lastStep.next) lastStep.next = lastPoppedBlock.joinPointId;
                            lastStepId = lastPoppedBlock.joinPointId;
                        }
                    }
                }
            }

            const branchMatch = line.match(/\b(if|match|while|for|loop)\b/);
            if (branchMatch) {
                const type = branchMatch[1];
                const stepId = `step_rs_${stepCounter++}`;
                const isDecision = ['if', 'while', 'match'].includes(type);

                flow.steps.push({ id: stepId, type: isDecision ? 'decision' : 'process', label: type });

                if ((line.startsWith('else') || line.startsWith('} else')) && lastPoppedBlock && lastPoppedBlock.lastDecisionId) {
                    const decStep = flow.steps.find(s => s.id === lastPoppedBlock!.lastDecisionId);
                    if (decStep) decStep.alternateNext = stepId;

                    if (line.includes('{')) {
                        blockStack.push({
                            bracketLevel: currentBracketLevel,
                            headerId: stepId,
                            type,
                            joinPointId: lastPoppedBlock.joinPointId,
                            lastDecisionId: stepId
                        });
                    }
                } else {
                    const prevStep = flow.steps.find(s => s.id === lastStepId);
                    if (prevStep) prevStep.next = stepId;

                    if (line.includes('{')) {
                        let joinPointId: string | undefined;
                        if (type === 'if' || type === 'match') {
                            joinPointId = `join_rs_${stepCounter++}`;
                            flow.steps.push({ id: joinPointId, type: 'process', label: 'Merge', hidden: true });
                        }
                        blockStack.push({ bracketLevel: currentBracketLevel, headerId: stepId, type, joinPointId, lastDecisionId: stepId });
                    }
                }
                lastStepId = stepId;
            } else if (line.match(/^[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                const callMatch = line.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    if (!['if', 'match', 'while', 'for', 'loop', 'println', 'format', 'panic'].includes(funcName)) {
                        const stepId = `step_rs_${stepCounter++}`;
                        flow.steps.push({ id: stepId, type: 'process', label: `Call: ${funcName}` });
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            currentBracketLevel += (openBrackets - closeBrackets);
            if (stepCounter > 100) break;
        }

        const finalStepId = 'step_rs_final';
        flow.steps.push({ id: finalStepId, type: 'end', label: 'Execution Complete' });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        this.cleanupFlow(flow);
    }

    private cleanupFlow(flow: FlowData) {
        const validIds = new Set(flow.steps.map(s => s.id));
        flow.steps.forEach(s => {
            if (s.next && !validIds.has(s.next)) s.next = undefined;
            if (s.alternateNext && !validIds.has(s.alternateNext)) s.alternateNext = undefined;
        });
    }

    private extractCondition(line: string): string | null {
        const match = line.match(/(?:if|switch|while|for)\s*\((.*)\)/);
        return match ? match[1].trim() : null;
    }

    private extractLabel(line: string): string | null {
        const match = line.match(/(?:async\s+)?(?:function\s+)?(?:const|let|var|class|interface|type|export\s+)?([a-zA-Z0-9_]+)\b/);
        const memberMatch = line.match(/(?:private|public|protected|static)\s+(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);
        const label = (memberMatch ? memberMatch[1] : (match ? match[1] : null));
        const keywords = ['const', 'let', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'return', 'import', 'export', 'from'];
        if (label && keywords.includes(label)) return null;
        return label ? label.trim() : null;
    }
}
