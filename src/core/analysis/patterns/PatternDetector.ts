import { DetectorContext } from './DetectorContext';
import { PatternFinding } from './PatternFinding';

export interface PatternDetector {
    detect(context: any, simContext?: any): PatternFinding[];
}
