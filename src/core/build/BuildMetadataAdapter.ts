// encoding: utf-8
import * as fs from 'fs';
import * as path from 'path';
import { BuildMetadataResult, DeclaredDependencyFact, JsPackageScope, PyPackageScope } from './BuildMetadataTypes';

/**
 * SYNAPSE EXP-C Track B: Build Metadata Adapter
 * Responsibilities:
 * - Collect declared dependency metadata and local package roots from build configurations (Cargo, npm, Python).
 * - Keep ReferenceResolver purely focused on reference matching against collected facts.
 */
export class BuildMetadataAdapter {
    public static collect(projectRoot: string | undefined, existingNodeIds: ReadonlySet<string>): BuildMetadataResult {
        const rustCrateMap = new Map<string, string>();
        const rustExternalPackages = new Set<string>();
        const jsLocalPackages = new Map<string, string>();
        const jsPackageScopes: JsPackageScope[] = [];
        const pyPackageScopes: PyPackageScope[] = [];
        const facts: DeclaredDependencyFact[] = [];

        if (!projectRoot) {
            return {
                projectRoot: '',
                rustCrateMap,
                rustExternalPackages,
                jsLocalPackages,
                jsPackageScopes,
                pyPackageScopes,
                facts
            };
        }

        // -------------------------------------------------------------
        // 1. Rust Workspace / Local Crate Mapping & External Cargo Dependencies
        // -------------------------------------------------------------
        try {
            const rootCargo = path.join(projectRoot, 'Cargo.toml');
            if (fs.existsSync(rootCargo)) {
                const parseCargoFile = (cPath: string) => {
                    if (!fs.existsSync(cPath)) return null;
                    const txt = fs.readFileSync(cPath, 'utf8');
                    const lines = txt.split('\n');
                    let pkgName: string | null = null;
                    let inPkg = false;
                    let libName: string | null = null;
                    let inLib = false;
                    let libPath: string | null = null;
                    const members: string[] = [];
                    let inMembers = false;
                    const pathDeps: { name: string; path: string }[] = [];
                    let section = '';

                    for (const raw of lines) {
                        const line = raw.replace(/#.*$/, '').trim();
                        if (!line) continue;
                        if (line.startsWith('[')) {
                            section = line;
                            inPkg = line === '[package]';
                            inLib = line === '[lib]';
                            if (line.startsWith('[workspace]')) inMembers = false;
                            continue;
                        }
                        if (inPkg && !pkgName) {
                            const m = line.match(/^name\s*=\s*\"([^\"]+)\"/);
                            if (m) pkgName = m[1].trim();
                        }
                        if (inLib) {
                            const mn = line.match(/^name\s*=\s*\"([^\"]+)\"/);
                            if (mn) libName = mn[1].trim();
                            const mp = line.match(/^path\s*=\s*\"([^\"]+)\"/);
                            if (mp) libPath = mp[1].trim();
                        }
                        if (line.includes('members') && line.includes('[')) {
                            inMembers = true;
                        }
                        if (inMembers) {
                            const itemMatches = line.matchAll(/\"([^\"]+)\"/g);
                            for (const im of itemMatches) members.push(im[1].trim());
                            if (line.includes(']')) inMembers = false;
                        }

                        const isDepSection = section === '[dependencies]' ||
                            section.startsWith('[dependencies.') ||
                            section === '[workspace.dependencies]' ||
                            section.startsWith('[workspace.dependencies.') ||
                            section === '[dev-dependencies]' ||
                            section.startsWith('[dev-dependencies.') ||
                            section === '[build-dependencies]' ||
                            section.startsWith('[build-dependencies.') ||
                            section.includes('.dependencies') ||
                            section.startsWith('[patch.');
                        if (isDepSection) {
                            const pdMatch = line.match(/^([a-zA-Z0-9_\-]+)\s*=\s*\{[^}]*path\s*=\s*\"([^\"]+)\"/);
                            if (pdMatch) {
                                pathDeps.push({ name: pdMatch[1].trim(), path: pdMatch[2].trim() });
                            } else {
                                const m = line.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.*)$/);
                                if (m) {
                                    const depAlias = m[1].trim();
                                    const val = m[2].trim();
                                    const pathMatch = val.match(/path\s*=\s*\"([^\"]+)\"/);
                                    if (pathMatch) {
                                        pathDeps.push({ name: depAlias, path: pathMatch[1].trim() });
                                    } else {
                                        const pkgMatch = val.match(/package\s*=\s*\"([^\"]+)\"/);
                                        const actualPkg = pkgMatch ? pkgMatch[1].trim() : depAlias;
                                        rustExternalPackages.add(depAlias);
                                        rustExternalPackages.add(depAlias.replace(/-/g, '_'));
                                        rustExternalPackages.add(actualPkg);
                                        rustExternalPackages.add(actualPkg.replace(/-/g, '_'));
                                    }
                                }
                            }
                        }
                    }
                    return { pkgName, libName, libPath, members, pathDeps };
                };

                const cargoQueue = [rootCargo];
                const visited = new Set<string>([rootCargo]);

                const rootMeta = parseCargoFile(rootCargo);
                if (rootMeta) {
                    for (const m of rootMeta.members) {
                        const sub = path.resolve(projectRoot, m, 'Cargo.toml');
                        if (fs.existsSync(sub) && !visited.has(sub)) {
                            visited.add(sub);
                            cargoQueue.push(sub);
                        }
                    }
                    for (const pd of rootMeta.pathDeps) {
                        const sub = path.resolve(projectRoot, pd.path, 'Cargo.toml');
                        if (fs.existsSync(sub) && !visited.has(sub)) {
                            visited.add(sub);
                            cargoQueue.push(sub);
                        }
                    }
                }

                for (let i = 0; i < cargoQueue.length; i++) {
                    const cPath = cargoQueue[i];
                    const meta = parseCargoFile(cPath);
                    if (!meta) continue;
                    const pkgDir = path.dirname(cPath);
                    for (const pd of meta.pathDeps) {
                        const sub = path.resolve(pkgDir, pd.path, 'Cargo.toml');
                        if (fs.existsSync(sub) && !visited.has(sub)) {
                            visited.add(sub);
                            cargoQueue.push(sub);
                        }
                    }

                    let entryRel: string | null = null;
                    if (meta.libPath) {
                        const cand = path.relative(projectRoot, path.join(pkgDir, meta.libPath)).replace(/\\/g, '/');
                        if (existingNodeIds.has(cand)) entryRel = cand;
                    }
                    if (!entryRel) {
                        const cand = path.relative(projectRoot, path.join(pkgDir, 'src/lib.rs')).replace(/\\/g, '/');
                        if (existingNodeIds.has(cand)) entryRel = cand;
                    }
                    if (!entryRel) {
                        const cand = path.relative(projectRoot, path.join(pkgDir, 'src/main.rs')).replace(/\\/g, '/');
                        if (existingNodeIds.has(cand)) entryRel = cand;
                    }

                    if (entryRel) {
                        if (meta.pkgName) {
                            rustCrateMap.set(meta.pkgName, entryRel);
                            rustCrateMap.set(meta.pkgName.replace(/-/g, '_'), entryRel);
                            rustExternalPackages.delete(meta.pkgName);
                            rustExternalPackages.delete(meta.pkgName.replace(/-/g, '_'));
                        }
                        if (meta.libName) {
                            rustCrateMap.set(meta.libName, entryRel);
                            rustCrateMap.set(meta.libName.replace(/-/g, '_'), entryRel);
                            rustExternalPackages.delete(meta.libName);
                            rustExternalPackages.delete(meta.libName.replace(/-/g, '_'));
                        }
                    }
                }
            }
        } catch { }

        // -------------------------------------------------------------
        // 2. JS/TS Scoped Manifest & Local Package Mapping
        // -------------------------------------------------------------
        try {
            const packageJsonFiles: string[] = [];
            const walkForPackageJson = (dir: string) => {
                if (!fs.existsSync(dir)) return;
                for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                    if (['node_modules', '.git', 'target', 'dist', 'build', '.synapse', 'out'].includes(ent.name)) continue;
                    const full = path.join(dir, ent.name);
                    if (ent.isDirectory()) {
                        walkForPackageJson(full);
                    } else if (ent.name === 'package.json') {
                        packageJsonFiles.push(full);
                    }
                }
            };
            walkForPackageJson(projectRoot);

            for (const pkgPath of packageJsonFiles) {
                try {
                    const raw = fs.readFileSync(pkgPath, 'utf8');
                    const data = JSON.parse(raw);
                    const pkgDir = path.dirname(pkgPath);
                    const dirRel = path.relative(projectRoot, pkgDir).replace(/\\/g, '/');

                    // 1. Register self as local package if named and entry exists
                    if (data.name) {
                        const mainCandidates = [
                            data.main,
                            data.module,
                            'index.ts',
                            'index.tsx',
                            'index.js',
                            'index.jsx',
                            'src/index.ts',
                            'src/index.tsx',
                            'src/index.js',
                            'src/index.jsx',
                            'src/main.ts',
                            'src/main.tsx',
                            'src/main.js'
                        ].filter(Boolean);

                        for (const cand of mainCandidates) {
                            const relCand = path.relative(projectRoot, path.join(pkgDir, cand)).replace(/\\/g, '/');
                            if (existingNodeIds.has(relCand)) {
                                jsLocalPackages.set(data.name, relCand);
                                break;
                            }
                        }
                    }

                    // 2. Collect dependencies declared in this scope
                    const declaredDeps = {
                        ...(data.dependencies || {}),
                        ...(data.devDependencies || {}),
                        ...(data.peerDependencies || {})
                    };

                    const externalPackages = new Set<string>();
                    for (const [depName, spec] of Object.entries(declaredDeps)) {
                        // If local protocol (file:, link:, workspace:), do NOT treat as external
                        if (typeof spec === 'string' && (spec.startsWith('file:') || spec.startsWith('link:') || spec.startsWith('workspace:'))) {
                            continue;
                        }
                        externalPackages.add(depName);
                    }

                    jsPackageScopes.push({
                        dirRel: dirRel === '' ? '.' : dirRel,
                        externalPackages
                    });
                } catch { }
            }

            // Sort scopes by directory path depth descending (most specific scope first)
            jsPackageScopes.sort((a, b) => {
                const depthA = a.dirRel === '.' ? 0 : a.dirRel.split('/').length;
                const depthB = b.dirRel === '.' ? 0 : b.dirRel.split('/').length;
                return depthB - depthA;
            });
        } catch { }

        // -------------------------------------------------------------
        // 3. Python Scoped Manifest Collector
        // -------------------------------------------------------------
        try {
            const pyManifestFiles: { filePath: string; type: 'req' | 'pyproject' | 'setup_cfg' }[] = [];
            const walkForPyManifests = (dir: string) => {
                if (!fs.existsSync(dir)) return;
                for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                    if (['node_modules', '.git', 'target', 'dist', 'build', '.synapse', 'out', '__pycache__', '.venv', 'venv'].includes(ent.name)) continue;
                    const full = path.join(dir, ent.name);
                    if (ent.isDirectory()) {
                        walkForPyManifests(full);
                    } else {
                        if (ent.name === 'pyproject.toml') {
                            pyManifestFiles.push({ filePath: full, type: 'pyproject' });
                        } else if (ent.name === 'setup.cfg') {
                            pyManifestFiles.push({ filePath: full, type: 'setup_cfg' });
                        } else if (ent.name.startsWith('requirements') && ent.name.endsWith('.txt')) {
                            pyManifestFiles.push({ filePath: full, type: 'req' });
                        }
                    }
                }
            };
            walkForPyManifests(projectRoot);

            // Group manifests by relative directory
            const dirToFiles = new Map<string, { filePath: string; type: 'req' | 'pyproject' | 'setup_cfg' }[]>();
            for (const mf of pyManifestFiles) {
                const dirRel = path.relative(projectRoot, path.dirname(mf.filePath)).replace(/\\/g, '/') || '.';
                if (!dirToFiles.has(dirRel)) dirToFiles.set(dirRel, []);
                dirToFiles.get(dirRel)!.push(mf);
            }

            const cleanPkgName = (raw: string): string => {
                return raw.trim().split(/[<>=!~; \t\r\n\[]/)[0].toLowerCase().replace(/[-_.]+/g, '-');
            };

            for (const [dirRel, files] of dirToFiles.entries()) {
                const externalPackages = new Set<string>();

                for (const f of files) {
                    try {
                        const content = fs.readFileSync(f.filePath, 'utf8');
                        const lines = content.split('\n');

                        if (f.type === 'req') {
                            for (const rawLine of lines) {
                                const line = rawLine.replace(/#.*$/, '').trim();
                                if (!line || line.startsWith('-') || line.startsWith('@')) continue;
                                const pkg = cleanPkgName(line);
                                if (pkg) externalPackages.add(pkg);
                            }
                        } else if (f.type === 'setup_cfg') {
                            let inInstallRequires = false;
                            for (const rawLine of lines) {
                                const line = rawLine.replace(/#.*$/, '').replace(/;.*$/, '');
                                if (line.startsWith('[')) {
                                    inInstallRequires = false;
                                    continue;
                                }
                                if (line.match(/^install_requires\s*=/)) {
                                    inInstallRequires = true;
                                    const afterEq = line.replace(/^install_requires\s*=/, '').trim();
                                    if (afterEq) {
                                        const pkg = cleanPkgName(afterEq);
                                        if (pkg) externalPackages.add(pkg);
                                    }
                                    continue;
                                }
                                if (inInstallRequires) {
                                    if (rawLine.startsWith(' ') || rawLine.startsWith('\t')) {
                                        const trimmed = line.trim();
                                        if (trimmed) {
                                            const pkg = cleanPkgName(trimmed);
                                            if (pkg) externalPackages.add(pkg);
                                        }
                                    } else if (line.trim()) {
                                        inInstallRequires = false;
                                    }
                                }
                            }
                        } else if (f.type === 'pyproject') {
                            let section = '';
                            let inPep621Deps = false;
                            for (const rawLine of lines) {
                                const line = rawLine.replace(/#.*$/, '').trim();
                                if (!line) continue;
                                if (line.startsWith('[')) {
                                    section = line;
                                    inPep621Deps = false;
                                    continue;
                                }

                                // PEP 621: [project] dependencies = [ ... ]
                                if (section === '[project]') {
                                    if (line.startsWith('dependencies') && line.includes('=')) {
                                        inPep621Deps = true;
                                        const bracketStart = line.indexOf('[');
                                        if (bracketStart !== -1) {
                                            const items = line.substring(bracketStart).matchAll(/\"([^\"]+)\"|'([^']+)'/g);
                                            for (const it of items) {
                                                const rawVal = it[1] || it[2];
                                                const pkg = cleanPkgName(rawVal);
                                                if (pkg) externalPackages.add(pkg);
                                            }
                                        }
                                        if (line.includes(']')) inPep621Deps = false;
                                        continue;
                                    }
                                    if (inPep621Deps) {
                                        const items = line.matchAll(/\"([^\"]+)\"|'([^']+)'/g);
                                        for (const it of items) {
                                            const rawVal = it[1] || it[2];
                                            const pkg = cleanPkgName(rawVal);
                                            if (pkg) externalPackages.add(pkg);
                                        }
                                        if (line.includes(']')) inPep621Deps = false;
                                    }
                                }

                                // Poetry: [tool.poetry.dependencies]
                                if (section === '[tool.poetry.dependencies]') {
                                    const m = line.match(/^([a-zA-Z0-9_\-]+)\s*=/);
                                    if (m) {
                                        const depName = m[1].trim();
                                        if (depName.toLowerCase() !== 'python') {
                                            externalPackages.add(cleanPkgName(depName));
                                        }
                                    }
                                }
                            }
                        }
                    } catch { }
                }

                if (externalPackages.size > 0) {
                    pyPackageScopes.push({
                        dirRel,
                        externalPackages
                    });
                }
            }

            // Sort scopes by directory path depth descending (most specific scope first)
            pyPackageScopes.sort((a, b) => {
                const depthA = a.dirRel === '.' ? 0 : a.dirRel.split('/').length;
                const depthB = b.dirRel === '.' ? 0 : b.dirRel.split('/').length;
                return depthB - depthA;
            });
        } catch { }

        return {
            projectRoot,
            rustCrateMap,
            rustExternalPackages,
            jsLocalPackages,
            jsPackageScopes,
            pyPackageScopes,
            facts
        };
    }
}
