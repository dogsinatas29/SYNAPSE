import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export class JVMAuditor {
    public static runAudit(files: string[], projectRoot: string) {
        Logger.info(`\n======================================================`);
        Logger.info(`[SYNAPSE] STARTING JVM DIAGNOSTIC AUDIT`);
        Logger.info(`======================================================\n`);

        let javaFiles = 0, kotlinFiles = 0;
        
        let javaStats = { classes: 0, interfaces: 0, enums: 0, records: 0 };
        let ktStats = { classes: 0, objects: 0, companionObjects: 0, dataClasses: 0, sealedClasses: 0, topLevelFunctions: 0 };
        
        const packageMap = new Map<string, string[]>();

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (ext !== '.java' && ext !== '.kt' && ext !== '.kts') continue;

            const fullPath = path.isAbsolute(file) ? file : path.join(projectRoot, file);
            if (!fs.existsSync(fullPath)) continue;

            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Extract Package
            const pkgMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)/m);
            if (pkgMatch) {
                const pkg = pkgMatch[1];
                if (!packageMap.has(pkg)) packageMap.set(pkg, []);
                packageMap.get(pkg)!.push(file);
            }

            if (ext === '.java') {
                javaFiles++;
                javaStats.classes += (content.match(/\bclass\s+\w+/g) || []).length;
                javaStats.interfaces += (content.match(/\binterface\s+\w+/g) || []).length;
                javaStats.enums += (content.match(/\benum\s+\w+/g) || []).length;
                javaStats.records += (content.match(/\brecord\s+\w+/g) || []).length;
            } else {
                kotlinFiles++;
                ktStats.classes += (content.match(/(?<!data\s+|sealed\s+)\bclass\s+\w+/g) || []).length;
                ktStats.objects += (content.match(/(?<!companion\s+)\bobject\s+\w*/g) || []).length;
                ktStats.companionObjects += (content.match(/\bcompanion\s+object\b/g) || []).length;
                ktStats.dataClasses += (content.match(/\bdata\s+class\s+\w+/g) || []).length;
                ktStats.sealedClasses += (content.match(/\bsealed\s+class\s+\w+/g) || []).length;
                ktStats.topLevelFunctions += (content.match(/^[ \t]*(?:private\s+|public\s+|internal\s+)?fun\s+\w+/gm) || []).length;
            }
        }

        Logger.info(`[JAVA_AUDIT]`);
        Logger.info(`files=${javaFiles}`);
        Logger.info(`classes=${javaStats.classes}`);
        Logger.info(`interfaces=${javaStats.interfaces}`);
        Logger.info(`enums=${javaStats.enums}`);
        Logger.info(`records=${javaStats.records}`);
        Logger.info('');

        Logger.info(`[KOTLIN_AUDIT]`);
        Logger.info(`files=${kotlinFiles}`);
        Logger.info(`classes=${ktStats.classes}`);
        Logger.info(`objects=${ktStats.objects}`);
        Logger.info(`companionObjects=${ktStats.companionObjects}`);
        Logger.info(`dataClasses=${ktStats.dataClasses}`);
        Logger.info(`sealedClasses=${ktStats.sealedClasses}`);
        Logger.info(`topLevelFunctions=${ktStats.topLevelFunctions}`);
        Logger.info('');

        let maxPkg = '', maxFiles = 0;
        let totalFilesWithPkg = 0;
        let potentialEdges = 0;

        for (const [pkg, fileList] of packageMap.entries()) {
            const count = fileList.length;
            totalFilesWithPkg += count;
            if (count > maxFiles) {
                maxFiles = count;
                maxPkg = pkg;
            }
            potentialEdges += (count * (count - 1)); // Assuming N * (N-1) directed edges if fully connected
        }

        Logger.info(`[PACKAGE_AUDIT]`);
        Logger.info(`packageCount=${packageMap.size}`);
        Logger.info(`largestPackage=${maxPkg} (${maxFiles} files)`);
        const avg = packageMap.size > 0 ? (totalFilesWithPkg / packageMap.size).toFixed(2) : '0';
        Logger.info(`avgFilesPerPackage=${avg}`);
        Logger.info('');

        Logger.info(`[POTENTIAL_PACKAGE_EDGES]`);
        const sortedPackages = Array.from(packageMap.entries()).sort((a, b) => b[1].length - a[1].length);
        for (let i = 0; i < Math.min(5, sortedPackages.length); i++) {
            const [pkg, fileList] = sortedPackages[i];
            const count = fileList.length;
            const edges = count * (count - 1);
            Logger.info(`package=${pkg} | files=${count} | potentialEdges=${edges}`);
        }
        Logger.info(`...`);
        Logger.info(`Total Potential Implicit Edges across all packages: ${potentialEdges}`);
        Logger.info(`\n======================================================\n`);
    }
}
