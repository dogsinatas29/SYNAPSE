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

    it('should correctly parse files with icons and spaces', async () => {
        const content = `
## Files
├── 📄 login.py
├── 📄 board.py
└── 📄 schema.sql
        `;
        (fs.readFileSync as jest.Mock).mockReturnValue(content);
        const structure = await parser.parseGeminiMd('GEMINI.md');
        const paths = structure.files.map(f => f.path);
        expect(paths).toContain('login.py');
        expect(paths).toContain('board.py');
        expect(paths).toContain('schema.sql');
    });

    it('should ignore filenames in the middle of sentences with hyphens', async () => {
        const content = `
[Scene 2: Analysis - GEMINI.md Analysis and Approval]
- This is a bullet point.
- another_file.ts: description
        `;
        (fs.readFileSync as jest.Mock).mockReturnValue(content);
        const structure = await parser.parseGeminiMd('GEMINI.md');
        const paths = structure.files.map(f => f.path);
        expect(paths).not.toContain('GEMINI.md');
        expect(paths).toContain('another_file.ts');
    });

    it('should match multiple files correctly with the new regex', async () => {
        const content = `
- src/main.ts
* src/utils.ts
📄 config.json
        `;
        (fs.readFileSync as jest.Mock).mockReturnValue(content);
        const structure = await parser.parseGeminiMd('GEMINI.md');
        const paths = structure.files.map(f => f.path);
        expect(paths).toContain('src/main.ts');
        expect(paths).toContain('src/utils.ts');
        expect(paths).toContain('config.json');
    });

    it('should return empty structure when no files are found', async () => {
        (fs.readFileSync as jest.Mock).mockReturnValue('Empty file without any markers');
        const structure = await parser.parseGeminiMd('GEMINI.md');
        expect(structure.files.length).toBe(0);
    });
});
