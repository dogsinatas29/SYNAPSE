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
        // Step 1: Entry Point (Main functions/classes)
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Module Entry',
            next: 'step_analysis_0'
        });

        // Step 2: Very simple regex-based "logical block" extractor
        // In a real Phase 3, we would use a proper AST parser like 'typescript'
        const lines = content.split('\n');
        let stepCounter = 0;
        let lastStepId = 'entry';

        for (let i = 0; i < Math.min(lines.length, 500); i++) {
            const line = lines[i].trim();

            // 1. If/Switch detection
            if (line.startsWith('if (') || line.includes(' if (') || line.startsWith('switch (') || line.includes(' switch (')) {
                const condition = this.extractCondition(line) || 'Decision Point';
                const stepId = `step_analysis_${stepCounter++}`;

                flow.steps.push({
                    id: stepId,
                    type: 'decision',
                    label: condition,
                    next: `step_analysis_${stepCounter++}`,
                    alternateNext: `step_analysis_${stepCounter + 1}`
                });

                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;

                lastStepId = stepId;
            }
            // 2. Try/Catch detection
            else if (line.startsWith('try {') || line.includes(' try {')) {
                const stepId = `step_analysis_${stepCounter++}`;
                flow.steps.push({
                    id: stepId,
                    type: 'process',
                    label: 'Try Block',
                    next: `step_analysis_${stepCounter++}`
                });
                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;
                lastStepId = stepId;
            }
            // 3. Exported components/functions/async methods
            else if (line.startsWith('export ') || line.startsWith('function ') || line.includes('function(') || line.includes('async ')) {
                const label = this.extractLabel(line) || 'Process Task';
                const stepId = `step_analysis_${stepCounter++}`;

                flow.steps.push({
                    id: stepId,
                    type: 'process',
                    label: label,
                    next: `step_analysis_${stepCounter++}`
                });

                const prevStep = flow.steps.find(s => s.id === lastStepId);
                if (prevStep) prevStep.next = stepId;

                lastStepId = stepId;
            }

            // Limit flow depth for now
            if (stepCounter > 8) break;
        }

        // Final Step
        const finalStepId = `step_analysis_${stepCounter}`;
        flow.steps.push({
            id: finalStepId,
            type: 'end',
            label: 'Execution Complete'
        });

        const lastStep = flow.steps.find(s => s.id === lastStepId);
        if (lastStep) lastStep.next = finalStepId;

        // Cleanup: Remove dangling 'next' references that don't exist
        const validIds = new Set(flow.steps.map(s => s.id));
        flow.steps.forEach(s => {
            if (s.next && !validIds.has(s.next)) s.next = undefined;
            if (s.alternateNext && !validIds.has(s.alternateNext)) s.alternateNext = undefined;
        });
    }

    private parsePythonFlow(content: string, flow: FlowData) {
        // Similar pattern for Python...
        flow.steps.push({
            id: 'entry',
            type: 'start',
            label: 'Python Initialization',
            next: 'final'
        });
        flow.steps.push({
            id: 'final',
            type: 'end',
            label: 'End'
        });
    }

    private extractCondition(line: string): string | null {
        const match = line.match(/(?:if|switch)\s*\((.*)\)/);
        return match ? match[1].trim() : null;
    }

    private extractLabel(line: string): string | null {
        const match = line.match(/(?:function|class|export|const)\s+([a-zA-Z0-9_]+)/);
        return match ? match[1].trim() : null;
    }
}
