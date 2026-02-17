import { GeminiParser } from '../core/GeminiParser';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('GeminiParser', () => {
    const parser = new GeminiParser();

    it('should correctly parse C++ and Rust files from GEMINI.md', async () => {
        const mockContent = `
🚀 [프로젝트 구조]
📂 src/
📄 src/main.cpp
📄 include/utils.h
📄 src/lib.rs
📄 data/config.json
        `;
        (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

        const structure = await parser.parseGeminiMd('GEMINI.md');

        const files = structure.files.map(f => f.path);
        expect(files).toContain('src/main.cpp');
        expect(files).toContain('include/utils.h');
        expect(files).toContain('src/lib.rs');
        expect(files).toContain('data/config.json');
    });

    it('should trigger fallback when no files are found', async () => {
        (fs.readFileSync as jest.Mock).mockReturnValue('Empty file');
        const structure = await parser.parseGeminiMd('GEMINI.md');
        expect(structure.files.length).toBeGreaterThan(0);
        expect(structure.files[0].path).toBe('src/main.ts');
    });
});
