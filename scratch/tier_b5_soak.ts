import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');
const historyPath = path.join(dataDir, 'synapse_history.json');
const auditPath = path.join(dataDir, 'synapse_audit.json');
const csvPath = path.join(dataDir, 'soak_metrics.csv');

function getFileSizeMB(filePath: string): string {
    if (!fs.existsSync(filePath)) return '0.00';
    const stats = fs.statSync(filePath);
    return (stats.size / 1024 / 1024).toFixed(2);
}

function getHistoryLength(): number {
    try {
        if (!fs.existsSync(historyPath)) return 0;
        const hData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        const history = Array.isArray(hData) ? hData : (hData.history || []);
        return history.length;
    } catch {
        return 0;
    }
}

async function pingServer(pathName: string, port: number, body: any = {}, method: string = 'POST', token?: string): Promise<{ status: number, body: any, latency: number }> {
    return new Promise((resolve) => {
        const start = performance.now();
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: '127.0.0.1',
            port: port,
            path: pathName,
            method: method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const latency = performance.now() - start;
                try { resolve({ status: res.statusCode || 0, body: JSON.parse(data), latency }); }
                catch { resolve({ status: res.statusCode || 0, body: data, latency }); }
            });
        });
        req.on('error', () => resolve({ status: 0, body: '', latency: performance.now() - start }));
        if (method !== 'GET') req.end(JSON.stringify(body));
        else req.end();
    });
}

function getPercentile(latencies: number[], p: number): string {
    if (latencies.length === 0) return '0.00';
    latencies.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * latencies.length) - 1;
    return latencies[index].toFixed(2);
}

async function startSoak() {
    console.log('--- Tier B-5: 24h Soak Test Script ---');

    let port = 3000;
    try {
        const info = JSON.parse(fs.readFileSync(path.join(dataDir, '.server_info'), 'utf8'));
        port = info.port;
    } catch {
        console.error('Server is not running. Please start standalone.ts first.');
        process.exit(1);
    }

    const adminRes = await pingServer('/api/admin/auth', port, { userId: 'soak_client', username: 'Soak Tester', adminSecret: 'tier-b-secret' });
    const token = adminRes.body.token;
    if (!token) {
        console.error('Authentication failed.');
        process.exit(1);
    }

    const header = 'timestamp,heap_used_mb,rss_mb,fd_count,active_handles,active_requests,history_length,snapshot_count,harvest_count,event_loop_lag_ms,uptime_seconds,history_file_size_mb,audit_file_size_mb,ping_p99_ms,snapshot_latency_p99_ms\n';
    if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, header);

    let pingLatencies: number[] = [];
    let snapshotLatencies: number[] = [];
    let snapshotCount = 0;
    let harvestCount = 0;
    const startTime = Date.now();

    // 1. 주기적인 Ping 스레드 (매 1초)
    setInterval(async () => {
        const res = await pingServer('/api/ping', port, null, 'GET');
        pingLatencies.push(res.latency);
    }, 1000);

    // 2. 주기적인 Snapshot 스레드 (매 10초)
    setInterval(async () => {
        const res = await pingServer('/api/snapshot', port, { label: 'Soak Snapshot', data: { nodes: [] } }, 'POST', token);
        snapshotLatencies.push(res.latency);
        if (res.status === 200) snapshotCount++;
    }, 10000);

    // 3. 주기적인 Harvest 스레드 (매 30초)
    setInterval(async () => {
        const startRes = await pingServer('/api/harvest/start', port, { visibleClientIds: ['soak_client'] }, 'POST', token);
        if (startRes.status === 200) {
            const compRes = await pingServer('/api/harvest/compare', port, { visibleClientIds: ['soak_client'] }, 'POST', token);
            if (compRes.status === 200) {
                const execRes = await pingServer('/api/harvest/execute', port, { candidates: [{ id: 'soak_client', hash: 'none' }] }, 'POST', token);
                if (execRes.status === 200) harvestCount++;
            }
        }
    }, 30000);

    // 4. 주기적인 Telemetry 수집 및 CSV 기록 (매 1분)
    setInterval(async () => {
        await pingServer('/api/debug/gc', port, null, 'POST', token); // Force GC for accurate heap
        const metricsRes = await pingServer('/api/debug/metrics', port, null, 'GET', token);
        const m = metricsRes.body;

        const timestamp = new Date().toISOString();
        const heap = m.memory ? (m.memory.heapUsed / 1024 / 1024).toFixed(2) : '0';
        const rss = m.memory ? (m.memory.rss / 1024 / 1024).toFixed(2) : '0';
        const fd = m.fdCount || 0;
        const handles = m.activeHandles || 0;
        const requests = m.activeRequests || 0;
        const lag = m.eventLoopLagMs ? m.eventLoopLagMs.toFixed(2) : '0';
        const uptime = ((Date.now() - startTime) / 1000).toFixed(0);
        
        const historyLen = getHistoryLength();
        const historyMB = getFileSizeMB(historyPath);
        const auditMB = getFileSizeMB(auditPath);
        
        const pingP99 = getPercentile(pingLatencies, 99);
        const snapP99 = getPercentile(snapshotLatencies, 99);
        pingLatencies = []; // Reset for next minute
        snapshotLatencies = [];

        const row = `${timestamp},${heap},${rss},${fd},${handles},${requests},${historyLen},${snapshotCount},${harvestCount},${lag},${uptime},${historyMB},${auditMB},${pingP99},${snapP99}\n`;
        fs.appendFileSync(csvPath, row);
        
        console.log(`[${timestamp}] Telemetry Appended: Heap=${heap}MB, Ping P99=${pingP99}ms, Snap P99=${snapP99}ms`);
    }, 60000);

    console.log(`Soak test started. Logging to ${csvPath} every 1 minute.`);
    console.log(`Random load: 1 Ping/sec, 1 Snapshot/10s, 1 Harvest/30s.`);
}

startSoak().catch(console.error);
