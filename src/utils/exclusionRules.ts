import * as path from 'path';
import { RuleEngine } from '../core/RuleEngine';

const BUILD_SCRIPT_EXACT_NAMES = new Set([
    'build.rs',
    'build.py',
    'build.sh',
    'build.bat',
    'build.ps1',
    'configure',
    'configure.ac',
    'makefile',
    'gnumakefile',
    'kbuild',
    'cmakelists.txt',
    'meson.build',
    'meson_options.txt',
    'sconstruct',
    'scsub',
    'build',
    'build.bazel',
    'workspace',
    'workspace.bazel',
    'podfile',
    'fastfile',
    'justfile',
    'taskfile.yml',
    'taskfile.yaml',
    // Build manifests & lockfiles (consumed by BuildMetadataAdapter, excluded from graph nodes)
    'cargo.toml',
    'cargo.lock',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'pyproject.toml',
    'poetry.lock',
    'pipfile',
    'pipfile.lock',
    'setup.py',
    'setup.cfg',
    'requirements.txt',
    'tsconfig.json',
    'jsconfig.json',
    'go.mod',
    'go.sum',
    'go.work',
    'go.work.sum',
    'pom.xml',
    'composer.json',
    'composer.lock',
    'gemfile',
    'gemfile.lock',
    'code-of-conduct.md',
    'code_of_conduct.md',
    'support.md'
]);

const BUILD_CONFIG_PREFIXES = [
    'webpack.config.',
    'vite.config.',
    'rollup.config.',
    'esbuild.',
    'tsup.config.',
    'babel.config.',
    '.babelrc',
    'jest.config.',
    'vitest.config.',
    'playwright.config.',
    'cypress.config.',
    'tailwind.config.',
    'postcss.config.',
    'eslint.config.',
    '.eslintrc',
    'prettier.config.',
    '.prettierrc',
    'gulpfile.',
    'gruntfile.',
    'tsconfig.',
    'requirements-',
    'changelog-',
    'contributing-',
    'code_of_conduct-'
];

const BUILD_SCRIPT_EXTENSIONS = [
    '.cmake',
    '.bzl',
    '.gradle',
    '.gradle.kts'
];

const PACKAGING_DIR_SEGMENTS = new Set([
    'installer',
    'packaging',
    'msi',
    'wix',
    'nsis',
    'innosetup',
    'debian',
    'rpm',
    'flatpak',
    'snap',
    '.github',
    '.circleci',
    '.gitlab',
    'ci',
    '.cargo',
    '.mvn',
    '.gradle',
    'cmake',
    'changelog',
    'testdata'
]);

/**
 * Checks if a relative path or filename belongs to a build system, packaging/installer script,
 * or build manifest that must be excluded from domain graph nodes ($V_{app}$).
 */
export function isBuildOrPackagingAsset(filePath: string): boolean {
    if (!filePath) return false;
    if (filePath.startsWith('external://') || filePath.startsWith('ghost://')) return false;
    const norm = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
    const lowerPath = norm.toLowerCase();
    const base = path.posix.basename(lowerPath);

    // Preserve TypeScript declaration contracts (.d.ts)
    if (base.endsWith('.d.ts')) return false;

    if (BUILD_SCRIPT_EXACT_NAMES.has(base)) return true;

    for (const ext of BUILD_SCRIPT_EXTENSIONS) {
        if (base.endsWith(ext)) return true;
    }

    for (const prefix of BUILD_CONFIG_PREFIXES) {
        if (base.startsWith(prefix)) return true;
    }

    const segments = lowerPath.split('/');
    // Check directory segments against universal compiler/packaging standard directories
    for (let i = 0; i < segments.length; i++) {
        if (PACKAGING_DIR_SEGMENTS.has(segments[i])) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if a directory should be ignored.
 * @param dirName The name of the directory (not the full path).
 */
export function isIgnoredFolder(dirName: string): boolean {
    if (isBuildOrPackagingAsset(dirName)) return true;
    return RuleEngine.getInstance().shouldIgnoreFolder(dirName);
}

/**
 * Checks if a file should be ignored based on its name or extension.
 * @param filePath The relative path or filename.
 */
export function isIgnoredFile(filePath: string): boolean {
    if (isBuildOrPackagingAsset(filePath)) return true;
    return RuleEngine.getInstance().shouldIgnoreFile(filePath);
}
