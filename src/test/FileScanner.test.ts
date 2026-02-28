import { FileScanner } from '../core/FileScanner';
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

    it('should correctly extract classes and functions from C++ files', () => {
        const cppFilePath = path.join(__dirname, 'test_sample.cpp');
        const content = `
#include "MyHeader.h"
#include <iostream>

class MyClass {
public:
    void myMethod() {
    }
};

struct MyStruct : public Base {
};

int main(int argc, char** argv) {
    return 0;
}

void Namespace::Function() {
}

void PointerFunc(int* p) {
}
`;
        fs.writeFileSync(cppFilePath, content);
        try {
            const summary = scanner.scanFile(cppFilePath);
            expect(summary.classes).toContain('MyClass');
            expect(summary.classes).toContain('MyStruct');
            expect(summary.functions).toContain('main');
            expect(summary.functions).toContain('Namespace::Function');
            expect(summary.functions).toContain('PointerFunc');
            expect(summary.references).toContainEqual({ target: 'MyHeader', type: 'dependency' });
        } finally {
            if (fs.existsSync(cppFilePath)) fs.unlinkSync(cppFilePath);
        }
    });

    it('should correctly extract structs and functions from Rust files', () => {
        const rsFilePath = path.join(__dirname, 'test_sample.rs');
        const rustCode = `
            use std::collections::HashMap;
            use crate::models::{User, Account};

            pub struct Database {
                pub connection: String,
            }

            trait Fly { fn fly(&self); }

            impl Database {
                pub async fn connect(&self) -> bool {
                    true
                }
            }

            impl Fly for Database {
                fn fly(&self) {}
            }

            fn helper_func() {}
        `;
        fs.writeFileSync(rsFilePath, rustCode);

        try {
            const summary = scanner.scanFile(rsFilePath);

            expect(summary.classes).toContain('Database');
            expect(summary.classes).toContain('Fly');
            expect(summary.functions).toContain('connect');
            expect(summary.functions).toContain('fly');
            expect(summary.functions).toContain('helper_func');
            expect(summary.references).toContainEqual({ target: 'models', type: 'dependency' });
        } finally {
            if (fs.existsSync(rsFilePath)) {
                fs.unlinkSync(rsFilePath);
            }
        }
    });

    it('should return empty summary for non-existent files', () => {
        const summary = scanner.scanFile('non_existent_file.py');
        expect(summary.classes).toEqual([]);
        expect(summary.functions).toEqual([]);
    });
});
