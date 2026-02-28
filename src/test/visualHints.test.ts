import { getVisualHints } from '../utils/visualHints';

describe('VisualHints', () => {
    it('should assign Layer 0 and high priority to scanner/mapping files', () => {
        const hints = getVisualHints('src/core/FileScanner.ts');
        expect(hints.layer).toBe(0);
        expect(hints.priority).toBeLessThanOrEqual(10);

        const hints2 = getVisualHints('src/systems/mapping.rs');
        expect(hints2.layer).toBe(0);
    });

    it('should assign Layer 1 and medium priority to logic/router/prompt files', () => {
        const hints = getVisualHints('src/core/router.rs');
        expect(hints.layer).toBe(1);
        expect(hints.priority).toBe(20);

        const hints2 = getVisualHints('prompts/system_prompt.py');
        expect(hints2.layer).toBe(1);
        expect(hints2.priority).toBe(20);
    });

    it('should assign Layer 2 and low priority to database/storage/action files', () => {
        const hints = getVisualHints('src/db/sqlite.rs');
        expect(hints.layer).toBe(2);
        expect(hints.priority).toBe(70);

        const hints2 = getVisualHints('src/actions/rclone_sync.py');
        expect(hints2.layer).toBe(2);
        expect(hints2.priority).toBe(90);
    });

    it('should handle markdown files as priority 1 in Layer 0', () => {
        const hints = getVisualHints('GEMINI.md');
        expect(hints.layer).toBe(0);
        expect(hints.priority).toBe(1);
    });

    it('should assign Layer 1 as default', () => {
        const hints = getVisualHints('src/utils/math.ts');
        expect(hints.layer).toBe(1);
        expect(hints.priority).toBe(50);
    });
});
