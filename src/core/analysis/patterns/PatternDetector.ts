import { ValidationContext } from '../../validation/ValidationContext';
import { SimulationContext } from '../../../types/schema';

export interface PatternFinding {
    patternId: string;
    targetId: string;
    confidence: number;
    evidence: Record<string, any>;
}

export interface PatternDetector {
    detect(context: ValidationContext, simContext?: SimulationContext): PatternFinding[];
}
