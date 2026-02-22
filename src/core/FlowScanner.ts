import * as fs from 'fs';
import * as path from 'path';

export interface FlowStep {
    id: string;
    type: 'process' | 'decision' | 'start' | 'end';
    label: string;
    description?: string;
    next?: string;
    alternateNext?: string; // For 'decision' type: true -> next, false -> alternateNext
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
        // Step 1: Entry Point
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Module Entry',
            next: 'step_analysis_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';

        // Increased limit for broader analysis
        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

            // 1. If/Switch/While detection (Flow Branches)
            if (line.match(/\b(if|switch|while|for)\b\s*\(/)) {
                const condition = this.extractCondition(line) || 'Decision Point';
                const stepId = `step_analysis_${stepCounter++}`;

                flow.steps.push({
                    id: stepId,
                    type: 'decision',
                    label: condition,
                    next: `step_analysis_${stepCounter}`,
                    alternateNext: `step_analysis_${stepCounter + 1}`
                });

                // Link previous step
                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) {
                    if (prevStep.type === 'decision') {
                        // If previous was decision, connect its TRUE path if it wasn't connected
                        if (!prevStep.next) prevStep.next = stepId;
                    } else {
                        prevStep.next = stepId;
                    }
                }

                lastStepId = stepId;
            }
            // 2. Try/Catch
            else if (line.match(/\btry\b\s*\{/)) {
                const stepId = `step_analysis_${stepCounter++}`;
                flow.steps.push({
                    id: stepId,
                    type: 'process',
                    label: 'Try Block (Safe Execution)',
                    next: `step_analysis_${stepCounter}`
                });
                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;
                lastStepId = stepId;
            }
            // 3. Methods / Functions / Exports (Enhanced Regex for TS)
            else if (line.match(/\b(export|function|async|private|public|protected|static|class|const|let)\s+([a-zA-Z0-9_]+)\b/)) {
                const label = this.extractLabel(line);
                if (!label) continue;

                // Skip common noise
                if (['from', 'import', 'return', 'const', 'let', 'var'].includes(label)) continue;

                const stepId = `step_analysis_${stepCounter++}`;
                flow.steps.push({
                    id: stepId,
                    type: 'process',
                    label: label,
                    next: `step_analysis_${stepCounter}`
                });

                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;

                lastStepId = stepId;
            }

            // Limit flow depth to 50 for performance and clarity
            if (stepCounter > 50) break;
        }

        // Final Step
        const finalStepId = 'final_end';
        flow.steps.push({
            id: finalStepId,
            type: 'end',
            label: 'Execution Complete'
        });

        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        // Cleanup: Remove dangling 'next' references
        const validIds = new Set(flow.steps.map(s => s.id));
        flow.steps.forEach(s => {
            if (s.next && !validIds.has(s.next)) s.next = undefined;
            if (s.alternateNext && !validIds.has(s.alternateNext)) s.alternateNext = undefined;
        });
    }

    private parseCppFlow(content: string, flow: FlowData) {
        // Step 1: Entry Point
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'C/C++ Initialization',
            next: 'step_cpp_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

            // 1. Blocks (if, for, while, switch, try, catch)
            const blockMatch = line.match(/^\s*(if|for|while|switch|try|catch|case)\b/);
            if (blockMatch) {
                const type = blockMatch[1];
                let label = type === 'case' ? line : this.extractCondition(line) || type;

                const stepId = `step_cpp_${stepCounter++}`;
                flow.steps.push({
                    id: stepId,
                    type: (['if', 'while', 'switch', 'case'].includes(type)) ? 'decision' : 'process',
                    label: label,
                    next: `step_cpp_${stepCounter}`
                });

                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;
                lastStepId = stepId;
            }
            // 2. Function calls or assignments that look like operations
            else if (line.match(/^\s*[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                const callMatch = line.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    if (!['if', 'for', 'while', 'switch', 'printf', 'scanf', 'try', 'catch', 'using', 'template'].includes(funcName)) {
                        const stepId = `step_cpp_${stepCounter++}`;
                        flow.steps.push({
                            id: stepId,
                            type: 'process',
                            label: `Call: ${funcName}`,
                            next: `step_cpp_${stepCounter}`
                        });
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            if (stepCounter > 50) break;
        }

        flow.steps.push({
            id: 'step_cpp_final',
            type: 'end',
            label: 'Execution Complete'
        });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = 'step_cpp_final';

        // Cleanup: Remove dangling 'next' references
        const validIds = new Set(flow.steps.map(s => s.id));
        flow.steps.forEach(s => {
            if (s.next && !validIds.has(s.next)) s.next = undefined;
            if (s.alternateNext && !validIds.has(s.alternateNext)) s.alternateNext = undefined;
        });
    }

    private parsePythonFlow(content: string, flow: FlowData) {
        // Step 1: Entry Point
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Python Initialization',
            next: 'step_py_0'
        });

        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';

        for (let i = 0; i < Math.min(lines.length, 1000); i++) {
            const rawLine = lines[i];
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;

            // 1. Blocks (if, for, while, with, try, def, class, except)
            const blockMatch = line.match(/^(def|class|if|for|while|with|try|elif|except)\s*([a-zA-Z0-9_(.]+)?/);
            if (blockMatch) {
                const type = blockMatch[1];
                let label = blockMatch[2] || type;

                // Special handling for __main__
                if (line.includes('if __name__ == "__main__"')) {
                    label = 'Main Execution Block';
                }

                const stepId = `step_py_${stepCounter++}`;
                flow.steps.push({
                    id: stepId,
                    type: (['if', 'elif', 'while'].includes(type)) ? 'decision' : 'process',
                    label: label.replace('(', ''),
                    next: `step_py_${stepCounter}`
                });

                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;
                lastStepId = stepId;
            }
            // 2. Significant Calls (e.g., logger.info, parser.parse)
            // Allow indented calls
            else if (line.match(/^[a-zA-Z0-9_.]+\s*=[^=]|^\s*[a-zA-Z0-9_.]+\(/)) {
                // Try to extract function call
                const callMatch = line.match(/([a-zA-Z0-9_.]+\s*)\(/);
                if (callMatch) {
                    const funcName = callMatch[1].trim();
                    if (!['if', 'for', 'while', 'print', 'super', 'try', 'except', 'with', 'def', 'class'].includes(funcName)) {
                        const stepId = `step_py_${stepCounter++}`;
                        flow.steps.push({
                            id: stepId,
                            type: 'process',
                            label: `Call: ${funcName}`,
                            next: `step_py_${stepCounter}`
                        });
                        const prevStep = flow.steps.find(s => s.id === lastStepId);
                        if (prevStep) prevStep.next = stepId;
                        lastStepId = stepId;
                    }
                }
            }

            if (stepCounter > 50) break;
        }

        flow.steps.push({
            id: 'step_py_final',
            type: 'end',
            label: 'Execution Complete'
        });
        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = 'step_py_final';

        // Cleanup: Remove dangling 'next' references
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
        // Handle TypeScript modifiers and async
        const match = line.match(/(?:async\s+)?(?:function\s+)?(?:const|let|var|class|interface|type|export\s+)?([a-zA-Z0-9_]+)\b/);

        // Secondary check for TS class members: private myMethod()
        const memberMatch = line.match(/(?:private|public|protected|static)\s+(?:async\s+)?([a-zA-Z0-9_]+)\s*\(/);

        const label = (memberMatch ? memberMatch[1] : (match ? match[1] : null));

        // Filter out keywords
        const keywords = ['const', 'let', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'return', 'import', 'export', 'from'];
        if (label && keywords.includes(label)) return null;

        return label ? label.trim() : null;
    }
}
