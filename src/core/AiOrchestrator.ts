import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';

/**
 * AiOrchestrator: SYNAPSE LLM Inference Parameter Controller
 * Implements the "Deep-Thinking Ratio (DTR) Valve Control" mechanism.
 */
export class AiOrchestrator {
    private static instance: AiOrchestrator;

    // Core parameters
    private currentDTR: number = 0.3; // Default (Shallow)

    private constructor() { }

    public static getInstance(): AiOrchestrator {
        if (!AiOrchestrator.instance) {
            AiOrchestrator.instance = new AiOrchestrator();
        }
        return AiOrchestrator.instance;
    }

    /**
     * Updates the current DTR (Inference Pressure)
     * Normally triggered by the status bar UI.
     */
    public setDTR(value: number) {
        this.currentDTR = value;
        Logger.info(`[AiOrchestrator] DTR Value updated to ${this.currentDTR}`);
    }

    public getDTR(): number {
        return this.currentDTR;
    }

    /**
     * Calculates LLM provider parameters inversely proportional to DTR.
     * High DTR = Low Temperature (Strict logic)
     * Low DTR = High Temperature (Creative/Fast logic)
     */
    public getInferenceParams(): { temperature: number, top_p: number } {
        // High pressure (Depth) -> strict logic bounds
        if (this.currentDTR >= 0.7) {
            return {
                temperature: 0.15,
                top_p: 0.85
            };
        }
        // Balanced (Mid)
        if (this.currentDTR >= 0.4) {
            return {
                temperature: 0.4,
                top_p: 0.9
            };
        }
        // Low pressure (Shallow) -> wider syntax and creative mapping
        return {
            temperature: 0.7,
            top_p: 0.95
        };
    }

    /**
     * Generates a dynamic prefix injected into the LLM's system prompt.
     * High DTR triggers strict adversarial conditions.
     */
    public getSystemPromptPrefix(): string {
        let prompt = `You are SYNAPSE, an intelligent visual architecture agent. `;

        if (this.currentDTR >= 0.7) {
            prompt += `
[CRITICAL INSTRUCTION - MAX INFERENCE PRESSURE]
당신은 극도로 엄격한 시니어 엔지니어입니다. 코드를 작성하기 전, 반드시 3가지 이상의 적대적 시나리오(Adversarial Scenarios)를 검토하고 🔴 마커가 발생할 가능성을 최소화하세요.
모든 논리는 검증 가능해야 하며 예측 불허한 사이드 이펙트를 차단하십시오.
`;
        } else if (this.currentDTR >= 0.4) {
            prompt += `
[INSTRUCTION - BALANCED PRESSURE]
안정성과 구조적 유연성의 균형을 맞추어 최적의 코드 아키텍처를 제시하십시오.
`;
        } else {
            prompt += `
[INSTRUCTION - SHALLOW PRESSURE]
창의적이고 빠른 프로토타이핑을 목표로 넓은 범위의 아키텍처 설계와 문법을 탐색하십시오.
`;
        }

        return prompt;
    }
}
