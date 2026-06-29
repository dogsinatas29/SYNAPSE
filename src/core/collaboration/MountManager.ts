import * as fs from 'fs';
import * as path from 'path';
import { execSync, execFile } from 'child_process';
import { Logger } from '../../utils/Logger';
import { SynapseIgnore } from '../SynapseIgnore';
import * as net from 'net';

export interface MountConfig {
    username: string;
    sshHost: string;
    sshPort: number;
    sshUser: string;
    remotePath: string;
    sshKey?: string;
}

interface ActiveMount {
    config: MountConfig;
    mountPoint: string;
    mountedAt: number;
    pid?: number;
}

export interface ScanResult {
    nodes: any[];
    edges: any[];
    clusters: any[];
}

// sshMountPath 검증: 클라이언트 프로젝트 폴더 경로만 허용
// 루트("/") 또는 path traversal("../") 차단
// 시스템 중요 디렉토리 정확히 차단 (하위 디렉토리는 허용)
export function validateMountPath(remotePath: string): boolean {
    if (!remotePath || typeof remotePath !== 'string') return false;
    if (remotePath.length >= 4096) return false;
    if (remotePath === '/') return false;
    if (!remotePath.startsWith('/') && !remotePath.startsWith('~/')) return false;
    if (remotePath.includes('..')) return false;
    if (remotePath.includes('*') || remotePath.includes('?')) return false;

    // 시스템 루트 디렉토리 자체만 차단 (ex: /home 은 막지만 /home/user/project 는 통과됨)
    const normalized = remotePath.replace(/\/+$/, ''); // trailing slash 제거
    const forbiddenRoots = ['/home', '/etc', '/root', '/var', '/usr', '/bin', '/sbin', '/opt', '/tmp', '/proc', '/sys', '/dev', '/boot', '/lib', '/lib64', '/snap'];
    if (forbiddenRoots.includes(normalized)) return false;

    return true;
}

export function validateSSHUser(username: string): boolean {
    if (!username || typeof username !== 'string') return false;
    if (username.length > 64) return false;
    // Allow alphanumeric, underscore, hyphen
    return /^[a-zA-Z0-9_-]+$/.test(username);
}

export function validateSSHHost(host: string): boolean {
    if (!host || typeof host !== 'string') return false;
    if (host.length > 255) return false;
    if (net.isIP(host)) return true;
    // IPv6 처리 후 콜론(:) 제거하여 영문/숫자/점/하이픈만 허용 (dev-server, nas01 등 사내망 호스트명 포함)
    return /^[a-zA-Z0-9.-]+$/.test(host);
}

export function validateSSHPort(port: any): boolean {
    const p = Number(port);
    return Number.isInteger(p) && p >= 1 && p <= 65535;
}

export class MountManager {
    private static instance: MountManager;
    private mounts: Map<string, ActiveMount> = new Map();
    private mountRoot: string = '';
    private initialized: boolean = false;
    private ignore: SynapseIgnore | null = null;

    static getInstance(): MountManager {
        if (!MountManager.instance) {
            MountManager.instance = new MountManager();
        }
        return MountManager.instance;
    }

    setIgnore(ignore: SynapseIgnore): void {
        this.ignore = ignore;
    }

    initialize(projectRoot: string): void {
        this.mountRoot = path.join(projectRoot, '.synapse', 'mnt');
        if (!fs.existsSync(this.mountRoot)) {
            fs.mkdirSync(this.mountRoot, { recursive: true });
        }
        this.initialized = true;
        Logger.info(`[MountManager] Mount root: ${this.mountRoot}`);
    }

    isSshfsAvailable(): boolean {
        try {
            execSync('which sshfs', { stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }

    async mount(config: MountConfig): Promise<string> {
        if (!this.initialized) {
            throw new Error('[MountManager] Not initialized');
        }
        if (!this.isSshfsAvailable()) {
            throw new Error('[MountManager] sshfs is not installed. Install with: sudo apt install sshfs');
        }
        if (!validateMountPath(config.remotePath)) {
            throw new Error(`[MountManager] Invalid remotePath: "${config.remotePath}". Must be an absolute project path (not "/", no "../", no "~").`);
        }
        if (!validateSSHUser(config.sshUser)) {
            throw new Error(`[MountManager] Invalid SSH User: "${config.sshUser}". Contains illegal characters.`);
        }
        if (!validateSSHHost(config.sshHost)) {
            throw new Error(`[MountManager] Invalid SSH Host: "${config.sshHost}". Contains illegal characters.`);
        }
        if (!validateSSHPort(config.sshPort)) {
            throw new Error(`[MountManager] Invalid SSH Port: "${config.sshPort}". Must be an integer between 1 and 65535.`);
        }
        if (this.mounts.has(config.username)) {
            const existing = this.mounts.get(config.username)!;
            Logger.info(`[MountManager] Already mounted: ${config.username} at ${existing.mountPoint}`);
            return existing.mountPoint;
        }

        const mountPoint = path.join(this.mountRoot, config.username);
        if (!fs.existsSync(mountPoint)) {
            fs.mkdirSync(mountPoint, { recursive: true });
        }

        let resolvedSshKey: string | undefined;
        if (config.sshKey) {
            resolvedSshKey = path.resolve(config.sshKey);
            if (!fs.existsSync(resolvedSshKey) || !fs.statSync(resolvedSshKey).isFile()) {
                throw new Error(`[MountManager] Invalid sshKey: File not found or is a directory (${resolvedSshKey})`);
            }
        }

        const args = ['-o', 'default_permissions', '-p', String(config.sshPort)];
        if (resolvedSshKey) {
            args.push('-o', `IdentityFile=${resolvedSshKey}`);
        }
        args.push(`${config.sshUser}@${config.sshHost}:${config.remotePath}`);
        args.push(mountPoint);

        return new Promise((resolve, reject) => {
            execFile('sshfs', args, { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    Logger.error(`[MountManager] Mount failed for ${config.username}: ${stderr || error.message}`);
                    reject(new Error(`Mount failed: ${stderr || error.message}`));
                    return;
                }
                this.mounts.set(config.username, {
                    config,
                    mountPoint,
                    mountedAt: Date.now()
                });
                Logger.info(`[MountManager] Mounted ${config.sshUser}@${config.sshHost}:${config.remotePath} → ${mountPoint}`);
                resolve(mountPoint);
            });
        });
    }

    async unmount(username: string): Promise<void> {
        const mount = this.mounts.get(username);
        if (!mount) {
            Logger.warn(`[MountManager] No mount found for: ${username}`);
            return;
        }

        return new Promise((resolve) => {
            const finish = () => {
                this.mounts.delete(username);
                Logger.info(`[MountManager] Unmounted: ${username}`);
                resolve();
            };

            execFile('fusermount3', ['-u', mount.mountPoint], { timeout: 5000 }, (err1) => {
                if (!err1) return finish();
                execFile('fusermount', ['-u', mount.mountPoint], { timeout: 5000 }, (err2) => {
                    if (!err2) return finish();
                    execFile('umount', ['-l', mount.mountPoint], { timeout: 5000 }, () => {
                        finish();
                    });
                });
            });
        });
    }

    isMounted(username: string): boolean {
        return this.mounts.has(username);
    }

    getMountPoint(username: string): string | null {
        const mount = this.mounts.get(username);
        return mount ? mount.mountPoint : null;
    }

    getMountConfig(username: string): MountConfig | null {
        const mount = this.mounts.get(username);
        return mount ? mount.config : null;
    }

    getAllMounts(): { username: string; mountPoint: string; mountedAt: number }[] {
        return Array.from(this.mounts.entries()).map(([username, m]) => ({
            username,
            mountPoint: m.mountPoint,
            mountedAt: m.mountedAt
        }));
    }

    scanMount(username: string): ScanResult {
        const mountPoint = this.getMountPoint(username);
        if (!mountPoint || !fs.existsSync(mountPoint)) {
            return { nodes: [], edges: [], clusters: [] };
        }
        return this._scanDirectory(mountPoint, username);
    }

    private _scanDirectory(rootPath: string, clientLabel: string): ScanResult {
        const nodes: any[] = [];
        const edges: any[] = [];
        const clusters: any[] = [];
        const sourceExtensions = new Set(['.py', '.ts', '.js', '.rs', '.cpp', '.c', '.go', '.java', '.kt', '.kts', '.swift', '.tsx', '.jsx']);
        const ignore = this.ignore;

        function walk(dir: string) {
            let entries: fs.Dirent[];
            try {
                entries = fs.readdirSync(dir, { withFileTypes: true });
            } catch {
                return;
            }
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.relative(rootPath, fullPath);
                if (entry.name.startsWith('.') && entry.name !== '.') continue;
                if (entry.isDirectory()) {
                    if (entry.name === 'node_modules' || entry.name === 'target' || entry.name === '.git') continue;
                    if (ignore && ignore.isIgnored(relPath)) continue;
                    const clusterId = `client_${clientLabel}_folder_${relPath.replace(/[\/\\]/g, '_')}`;
                    clusters.push({
                        id: clusterId,
                        label: entry.name,
                        path: relPath,
                        clientLayer: clientLabel
                    });
                    walk(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    const isSource = sourceExtensions.has(ext);
                    if (ignore && ignore.isIgnored(relPath)) continue;
                    nodes.push({
                        id: `client_${clientLabel}_${relPath}`,
                        label: entry.name,
                        type: isSource ? 'file' : 'doc',
                        layer: isSource ? 'user' : 'user',
                        data: {
                            file: relPath,
                            path: relPath,
                            extension: ext,
                            clientLayer: clientLabel
                        },
                        clientLayer: clientLabel
                    });
                }
            }
        }

        walk(rootPath);
        return { nodes, edges, clusters };
    }

    async unmountAll(): Promise<void> {
        for (const username of Array.from(this.mounts.keys())) {
            await this.unmount(username);
        }
    }
}
