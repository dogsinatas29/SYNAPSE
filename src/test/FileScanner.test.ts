import { FileScanner } from '../webview/FileScanner';
import * as fs from 'fs';
import * as path from 'path';

describe('FileScanner', () => {
    const scanner = new FileScanner();
    const testFilePath = path.join(__dirname, 'test_sample.py');

    beforeAll(() => {
        const content = `
class TestClass:
    def method_one(self):
        pass

def standalone_func():
    pass
`;
        fs.writeFileSync(testFilePath, content);
    });

    afterAll(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it('should correctly extract classes and functions from Python files', () => {
        const summary = scanner.scanFile(testFilePath);
        expect(summary.classes).toContain('TestClass');
        expect(summary.functions).toContain('method_one');
        expect(summary.functions).toContain('standalone_func');
    });

    it('should return empty summary for non-existent files', () => {
        const summary = scanner.scanFile('non_existent_file.py');
        expect(summary.classes).toEqual([]);
        expect(summary.functions).toEqual([]);
    });
});
