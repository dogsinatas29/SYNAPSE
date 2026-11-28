import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('SYNAPSE Security Integration E2E', () => {
    let serverProcess: cp.ChildProcess;
    let baseURL: string;
    let dummyRoot: string;
    let projectUUID = '';
    const adminSecret = 'e2e-secret-' + Date.now();
    let tokens = { admin: '', lead: '', member: '' };
    let projectStatePath: string;

    beforeAll(async () => {
        // 1. Create a dummy project root
        dummyRoot = path.join(os.tmpdir(), 'synapse-e2e-' + Date.now());
        fs.mkdirSync(path.join(dummyRoot, 'src'), { recursive: true });
        
        projectStatePath = path.join(dummyRoot, 'synapse_data', 'project_state.json');
        fs.mkdirSync(path.join(dummyRoot, 'synapse_data'), { recursive: true });
        fs.writeFileSync(projectStatePath, JSON.stringify({ nodes: [] }), 'utf-8');

        // 2. Start standalone server via child_process
        const standaloneScript = path.join(__dirname, '../../dist/server/standalone.js');
        if (!fs.existsSync(standaloneScript)) {
            cp.execSync('npx tsc', { cwd: path.join(__dirname, '../..'), stdio: 'ignore' });
        }

        const port = 38444;
        baseURL = `http://127.0.0.1:${port}`;
        
        serverProcess = cp.fork(standaloneScript, ['--root', dummyRoot, '--port', port.toString()], {
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
            env: { ...process.env, SYNAPSE_PUBLIC_MODE: '1' }
        });

        // 3. IPC Secret Handshake
        serverProcess.send({ type: 'ADMIN_SECRET', secret: adminSecret });

        // Wait for READY via polling
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Server start timeout')), 60000);
            const interval = setInterval(async () => {
                try {
                    const serverInfoPath = path.join(dummyRoot, 'synapse_data', '.server_info');
                    if (fs.existsSync(serverInfoPath)) {
                        const info = JSON.parse(fs.readFileSync(serverInfoPath, 'utf-8'));
                        baseURL = `http://127.0.0.1:${info.port}`;
                        const res = await fetch(`${baseURL}/api/ping`);
                        if (res.status === 200) {
                            clearInterval(interval);
                            clearTimeout(timeout);
                            const pingData = await res.json() as any;
                            projectUUID = pingData.projectUUID;
                            resolve();
                        }
                    }
                } catch (e) {}
            }, 500);
            serverProcess.stdout?.on('data', d => console.log(d.toString().trim()));
            serverProcess.stderr?.on('data', d => console.error(d.toString().trim()));
        });

        await new Promise(r => setTimeout(r, 1000));

        if (!projectUUID) {
            throw new Error('Failed to obtain projectUUID from /api/ping');
        }

        // 4. Authenticate Admin & Provision Lead/Member Accounts and Roles via Current APIs
        const adminAuthRes = await fetch(`${baseURL}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminSecret })
        });
        const adminAuthData = await adminAuthRes.json() as any;
        if (adminAuthRes.status !== 200 || adminAuthData.success !== true || typeof adminAuthData.token !== 'string') {
            throw new Error(`Admin auth failed: ${adminAuthRes.status} ${JSON.stringify(adminAuthData)}`);
        }
        tokens.admin = adminAuthData.token;

        const createAccount = async (username: string): Promise<string> => {
            const res = await fetch(`${baseURL}/api/admin/create-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.admin}`,
                    'x-admin-secret': adminSecret
                },
                body: JSON.stringify({ username, password: 'pass' })
            });
            const data = await res.json() as any;
            if (res.status !== 200 || data.success !== true || typeof data.user?.userId !== 'string') {
                throw new Error(`Create account failed for ${username}: ${res.status} ${JSON.stringify(data)}`);
            }
            return data.user.userId;
        };

        const assignRole = async (userId: string, role: 'lead' | 'member'): Promise<void> => {
            const res = await fetch(`${baseURL}/api/admin/assign-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.admin}`,
                    'x-admin-secret': adminSecret
                },
                body: JSON.stringify({ projectUUID, userId, role })
            });
            const data = await res.json() as any;
            if (res.status !== 200 || data.success !== true) {
                throw new Error(`Assign role failed for ${userId} (${role}): ${res.status} ${JSON.stringify(data)}`);
            }
        };

        const leadUserId = await createAccount('lead_user');
        const memberUserId = await createAccount('member_user');
        await assignRole(leadUserId, 'lead');
        await assignRole(memberUserId, 'member');

        const login = async (username: string): Promise<string> => {
            const res = await fetch(`${baseURL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: 'pass' })
            });
            const data = await res.json() as any;
            if (res.status !== 200 || data.success !== true || typeof data.token !== 'string') {
                throw new Error(`Login failed for ${username}: ${res.status} ${JSON.stringify(data)}`);
            }
            return data.token;
        };

        tokens.lead = await login('lead_user');
        tokens.member = await login('member_user');

    }, 80000);

    afterAll(() => {
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGKILL');
        }
        try { fs.rmSync(dummyRoot, { recursive: true, force: true }); } catch {}
    });

    it('[SYN-SEC-E2E-01] IPC Secret Leak Test', async () => {
        const pid = serverProcess.pid;
        expect(pid).toBeDefined();

        if (os.platform() === 'linux') {
            const environ = fs.readFileSync(`/proc/${pid}/environ`, 'utf-8');
            expect(environ).not.toContain(adminSecret);
            expect(environ).not.toContain('ADMIN_SECRET=');
        }
        
        const serverInfoPath = path.join(dummyRoot, 'synapse_data', '.server_info');
        if (fs.existsSync(serverInfoPath)) {
            const info = JSON.parse(fs.readFileSync(serverInfoPath, 'utf-8'));
            expect(info.adminSecret).toBeUndefined();
        }
    });

    it('[SYN-SEC-E2E-02] Role Matrix Test - /api/save-state', async () => {
        const testPayload = { nodes: [] };
        
        // Member should be blocked
        let res = await fetch(`${baseURL}/api/save-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.member}` },
            body: JSON.stringify(testPayload)
        });
        expect(res.status).toBe(403);
        
        // Lead should succeed
        res = await fetch(`${baseURL}/api/save-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
            body: JSON.stringify(testPayload)
        });
        expect(res.status).toBe(200);
        
        // Admin should succeed
        res = await fetch(`${baseURL}/api/save-state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.admin}` },
            body: JSON.stringify(testPayload)
        });
        expect(res.status).toBe(200);
    });

    it('[SYN-SEC-E2E-03] Role Matrix Test - /api/snapshot', async () => {
        const payload = { author: 'hacker', data: { nodes: [] } };
        
        // Member should be blocked
        let res = await fetch(`${baseURL}/api/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.member}` },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(403);

        // Lead should succeed
        res = await fetch(`${baseURL}/api/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(200);
    });

    it('[SYN-SEC-E2E-04] Snapshot Forgery Test', async () => {
        const payload = { author: 'HOST_IMPERSONATOR', __proto__: { isAdmin: true }, data: { nodes: [] } };
        
        // Send with lead token
        const res = await fetch(`${baseURL}/api/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
            body: JSON.stringify(payload)
        });
        expect(res.status).toBe(200);
        const data = await res.json() as any;
        expect(data.success).toBe(true);
        expect(data.snapshot?.id).toBeDefined();

        // Check if author was overridden to the actual session user (lead_user)
        const historyPath = path.join(dummyRoot, 'synapse_data', 'synapse_history.json');
        expect(fs.existsSync(historyPath)).toBe(true);
        const historyJson = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        const historyList = Array.isArray(historyJson) ? historyJson : (historyJson.history || []);
        expect(historyList.length).toBeGreaterThan(0);

        const snap = historyList.find((item: any) => item.id === data.snapshot.id);
        expect(snap).toBeDefined();
        expect(snap.data.author).toBe('lead_user'); // Not HOST_IMPERSONATOR
        expect((snap as any).isAdmin).toBeUndefined(); // Prototype pollution blocked
        expect((snap.data as any).isAdmin).toBeUndefined(); // Prototype pollution blocked on data
    });

    it('[SYN-SEC-E2E-05] Harvest Replay Test (Concurrency)', async () => {
        // Prepare harvest state
        // To call execute, we need session to be in Approving state.
        // But /api/harvest/execute requires lead token and a candidates array.
        // Even if candidates array is empty, we can test CAS.

        // Force state to Approving by making a direct call to start, compare, then we simulate.
        // Actually, let's just use /api/harvest/execute 100 times concurrently.
        // Wait, if it fails because it's not in Approving state, that's normal.
        // We need to put it into Approving state first!
        // To put into Approving, we need to do start -> compare.
        const startRes = await fetch(`${baseURL}/api/harvest/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
            body: JSON.stringify({ visibleClientIds: [] })
        });
        expect(startRes.status).toBe(200);

        // Now state is Locked.
        const compareRes = await fetch(`${baseURL}/api/harvest/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
            body: JSON.stringify({ visibleClientIds: [] })
        });
        expect(compareRes.status).toBe(200);

        // Now state is Approving.
        
        // Fire 100 concurrent execute requests
        const requests = Array.from({ length: 100 }).map(() => {
            return fetch(`${baseURL}/api/harvest/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.lead}` },
                body: JSON.stringify({
                    candidates: [ { filePath: '/test', sourcePath: '/test', targetPath: '/test', clientUsername: 'lead_user', userId: 'u-lead' } ]
                })
            });
        });

        const responses = await Promise.all(requests);
        let successCount = 0;
        let rejectCount = 0;
        const unexpectedResponses: Array<{ status: number; body: any }> = [];

        for (const r of responses) {
            const body = await r.json() as any;
            if (r.status === 200 && body.success === true) {
                successCount++;
            } else if (
                r.status === 409 &&
                body.success === false &&
                body.error === 'Invalid state transition or concurrent execution (Conflict)'
            ) {
                rejectCount++;
            } else {
                unexpectedResponses.push({ status: r.status, body });
            }
        }

        // Exactly one should pass the CAS, 99 rejected with 409 Conflict, 0 unexpected.
        expect(unexpectedResponses).toEqual([]);
        expect(successCount).toBe(1);
        expect(rejectCount).toBe(99);
    });

});
