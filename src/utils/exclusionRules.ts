import { RuleEngine } from '../core/RuleEngine';

/**
 * Checks if a directory should be ignored.
 * @param dirName The name of the directory (not the full path).
 */
export function isIgnoredFolder(dirName: string): boolean {
    return RuleEngine.getInstance().shouldIgnoreFolder(dirName);
}

/**
 * Checks if a file should be ignored based on its name or extension.
 * @param filePath The relative path or filename.
 */
export function isIgnoredFile(filePath: string): boolean {
    return RuleEngine.getInstance().shouldIgnoreFile(filePath);
}
