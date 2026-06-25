import { PromptLogger } from '../core/PromptLogger';
import { MountManager } from '../core/collaboration/MountManager';
import { CanvasPanel } from '../webview/CanvasPanel';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');
jest.mock('vscode', () => ({
    window: { showErrorMessage: jest.fn(), showInformationMessage: jest.fn(), showWarningMessage: jest.fn() },
    workspace: { getConfiguration: jest.fn(() => ({ get: jest.fn() })), onDidSaveTextDocument: jest.fn() },
    Uri: { joinPath: jest.fn(), file: jest.fn() }
}), { virtual: true });

import { HarvestEngine } from '../core/collaboration/HarvestEngine';
import { ProjectMetadata } from '../core/ProjectMetadata';

describe('SYNAPSE Security Regression Harness (Tier 1)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[SYN-SEC-001] MountManager Command Injection 방어', async () => {
        // exec를 더 이상 호출하지 않아야 함
        const execSpy = jest.spyOn(cp, 'exec');
        const execFileSpy = jest.spyOn(cp, 'execFile').mockImplementation((cmd, args, cb) => {
            if (cb) (cb as any)(null, '', '');
            return {} as any;
        });

        // Test validateMountPath and others logic to prevent arbitrary strings
        const mountManager = (MountManager as any).getInstance();
        mountManager.initialized = true;
        mountManager.isSshfsAvailable = jest.fn().mockReturnValue(true);
        
        // Mock configuration
        const testConfig = {
            sshHost: '127.0.0.1',
            sshPort: 22,
            sshUser: 'validUser',
            remotePath: '/home/user/workspace',
            sshKey: '/tmp/id_rsa'
        };

        // Try mount with malicious username
        testConfig.sshUser = 'dog; rm -rf /';
        try {
            await mountManager.mount(testConfig);
        } catch (e: any) {
            expect(e.message).toContain('Invalid SSH User');
        }

        // Verify exec was never called (only execFile)
        expect(execSpy).not.toHaveBeenCalled();
    });

    it('[SYN-SEC-002] PromptLogger Command Injection 방어', () => {
        const logger = (PromptLogger as any).getInstance();
        
        const execSpy = jest.spyOn(cp, 'exec');
        const execFileSpy = jest.spyOn(cp, 'execFile').mockImplementation(() => ({} as any));
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('');

        // We simulate a malicious file path
        const maliciousPath = '"; rm -rf /; "';
        
        // Call appendAction which triggers gitStageFile
        logger.appendAction(maliciousPath, 'TEST_ACTION', 'file.ts', '/mock/root');

        expect(execSpy).not.toHaveBeenCalled();
        expect(execFileSpy).toHaveBeenCalledWith('git', ['add', maliciousPath], expect.anything());
    });

    it('[SYN-SEC-003] CanvasPanel pkill Command Injection 방어', () => {
        const execSpy = jest.spyOn(cp, 'exec');
        const execFileSpy = jest.spyOn(cp, 'execFile').mockImplementation(() => ({} as any));

        // We test that no cp.exec('pkill ...') exist by reviewing the mock interactions
        // CanvasPanel's _spawnNewServer uses execFile
        const panel = new (CanvasPanel as any)(
            { webview: { postMessage: jest.fn(), onDidReceiveMessage: jest.fn(), asWebviewUri: jest.fn() }, dispose: jest.fn(), onDidDispose: jest.fn() },
            { fsPath: '/ext/uri' } as any,
            { uri: { fsPath: '/workspace' } } as any,
            'test_user'
        );

        // Trigger logic that kills server
        (panel as any)._restartServerProcess();
        
        expect(execSpy).not.toHaveBeenCalled();
        expect(execFileSpy).toHaveBeenCalledWith('pkill', ['-f', 'standalone.js'], expect.anything());
    });

});

describe('SYNAPSE Security Regression Harness (Tier 2 - File System Constraints)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock ProjectMetadata
        (ProjectMetadata as any).getInstance = jest.fn().mockReturnValue({
            getProjectRoot: () => '/mock/project/root',
            get: () => ({ projectUUID: 'mock-uuid' })
        });
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
        (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
        (fs.realpathSync as unknown as jest.Mock).mockImplementation((p: string) => p);
    });

    test('[SYN-SEC-013] HarvestEngine Arbitrary File Write (clientUsername validation)', async () => {
        const engine = HarvestEngine.getInstance();
        const candidates = [
            { clientUsername: '../../../etc', targetPath: 'passwd', sourcePath: 'passwd', filePath: 'passwd', userId: 'user1' }
        ];

        const result = await engine.harvest(candidates, async () => 'malicious_content');
        
        expect(result.failedFiles).toHaveLength(1);
        expect(result.failedFiles[0].reason).toBe('PATH_TRAVERSAL');
        expect(result.failedFiles[0].detail).toContain('Invalid clientUsername');
    });

    test('[SYN-SEC-010] HarvestEngine Path Traversal (targetPath validation)', async () => {
        const engine = HarvestEngine.getInstance();
        const candidates = [
            { clientUsername: 'validUser', targetPath: '../../etc/passwd', sourcePath: 'safe', filePath: 'safe', userId: 'user1' }
        ];

        const result = await engine.harvest(candidates, async () => 'content');
        
        expect(result.failedFiles).toHaveLength(1);
        expect(result.failedFiles[0].reason).toBe('PATH_TRAVERSAL');
        expect(result.failedFiles[0].detail).toContain('Path contains directory traversal characters');
    });

    test('[SYN-SEC-011] HarvestEngine Symlink Escape Check', async () => {
        const engine = HarvestEngine.getInstance();
        const candidates = [
            { clientUsername: 'validUser', targetPath: 'symlink_dir/file', sourcePath: 'safe', filePath: 'safe', userId: 'user1' }
        ];

        // Mock realpathSync to simulate a symlink escape scenario
        (fs.realpathSync as unknown as jest.Mock).mockImplementation((p: string) => {
            if (p.includes('symlink_dir')) return '/root'; // Escape!
            return p;
        });

        const result = await engine.harvest(candidates, async () => 'content');
        
        expect(result.failedFiles).toHaveLength(1);
        expect(result.failedFiles[0].reason).toBe('PATH_TRAVERSAL');
        expect(result.failedFiles[0].detail).toContain('Symlink escape detected');
    });
});
