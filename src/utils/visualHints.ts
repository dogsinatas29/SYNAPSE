/**
 * SYNAPSE Visual Hints Utility
 * 파일명 패턴을 기반으로 레이어 및 우선순위 제안
 */

export interface VisualHints {
    layer: number;    // 0: Discovery, 1: Reasoning, 2: Action
    priority: number; // 0-100 (낮을수록 먼저 실행)
}

export function getVisualHints(filePath: string): VisualHints {
    const fileName = filePath.toLowerCase();

    // Default hints
    let layer = 1; // Reasoning as default
    let priority = 50;

    // 1. Layer 0: Discovery (Mapping, Scanning, Input)
    if (
        fileName.includes('scanner') ||
        fileName.includes('mapping') ||
        fileName.includes('discovery') ||
        fileName.includes('search') ||
        fileName.includes('parser') ||
        fileName.includes('bootstrap') ||
        fileName.includes('physical') ||
        fileName.includes('main.rs') ||
        fileName.includes('main.ts') ||
        fileName.includes('main.py')
    ) {
        layer = 0;
        priority = 10;
        if (fileName.includes('main')) priority = 5;
        if (fileName.includes('scanner') || fileName.includes('discovery')) priority = 8;
    }

    // 2. Layer 1: Reasoning (Logic, Prompts, Router)
    if (
        fileName.includes('router') ||
        fileName.includes('prompt') ||
        fileName.includes('engine') ||
        fileName.includes('logic') ||
        fileName.includes('reasoning') ||
        fileName.includes('processor') ||
        fileName.includes('inference') ||
        (fileName.endsWith('.py') && !fileName.includes('main'))
    ) {
        layer = 1;
        priority = 30;
        if (fileName.includes('router') || fileName.includes('prompt')) priority = 20;
        if (fileName.includes('engine') || fileName.includes('inference')) priority = 25;
    }

    // 3. Layer 2: Action (Database, Storage, Cloud, UI)
    if (
        fileName.includes('rclone') ||
        fileName.includes('sqlite') ||
        fileName.includes('db') ||
        fileName.includes('storage') ||
        fileName.includes('action') ||
        fileName.includes('executor') ||
        fileName.includes('reporting') ||
        fileName.includes('ui') ||
        fileName.includes('enforcement') ||
        fileName.includes('client')
    ) {
        layer = 2;
        priority = 80;
        if (fileName.includes('db') || fileName.includes('sqlite')) priority = 70;
        if (fileName.includes('enforcement') || fileName.includes('action')) priority = 90;
    }

    // Heuristics for file extensions
    if (fileName.endsWith('.md')) {
        layer = 0;
        priority = 1; // Docs usually come first in logical view
    }

    if (fileName.endsWith('.py') && layer === 1 && priority === 50) {
        // Python scripts in reasoning layer (if not special like prompt/router)
        priority = 25;
    }

    return { layer, priority };
}
