import * as fs from 'fs';

/**
 * 🔍 SYNAPSE Verification Layer (v0.3.11)
 * 
 * Commit 완료 후 파일 시스템의 정합성을 검증합니다. (STAGE 5)
 */

export interface VerificationResult {
    success: boolean;
    errors: string[];
}

export class VerificationLayer {
    /**
     * 생성/수정된 파일들에 대한 정밀 검증을 수행합니다.
     */
    public verify(files: string[]): VerificationResult {
        const errors: string[] = [];

        for (const file of files) {
            // 1. 존재 여부 확인
            if (!fs.existsSync(file)) {
                errors.push(`MISSING_FILE: ${file}`);
                continue;
            }

            // 2. 파일 크기 확인 (Empty File 방지)
            const stat = fs.statSync(file);
            if (stat.size === 0) {
                errors.push(`EMPTY_FILE: ${file}`);
            }

            // 3. 구문 유효성 간이 검사 (Simple Regex or AST Parse simulation)
            const content = fs.readFileSync(file, 'utf8');
            if (!content.includes('export') && !file.endsWith('.md')) {
                errors.push(`INVALID_EXPORT: ${file} (No export found in TS file)`);
            }

            // 4. Import 경로 유효성 검사 (Future Enhancement)
            // TODO: Resolve imports and check existence
        }

        return {
            success: errors.length === 0,
            errors
        };
    }
}

export const verificationLayer = new VerificationLayer();
