import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ArchitectureExplorerProvider implements vscode.TreeDataProvider<ExplorerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ExplorerItem | undefined | void> = new vscode.EventEmitter<ExplorerItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ExplorerItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string | undefined) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ExplorerItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ExplorerItem): Promise<ExplorerItem[]> {
        if (!this.workspaceRoot) {
            return [];
        }

        if (!element) {
            // Root items
            return [
                new ExplorerItem(
                    '📚 Documentation Shelf',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'shelf_root',
                    { iconName: 'library' }
                ),
                new ExplorerItem(
                    '🧠 Context Vault',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'vault_root',
                    { iconName: 'history' }
                )
            ];
        }

        if (element.contextValue === 'shelf_root') {
            return this.getDocShelfItems();
        }

        if (element.contextValue === 'vault_root') {
            return this.getContextVaultItems();
        }

        return [];
    }

    private async getDocShelfItems(): Promise<ExplorerItem[]> {
        if (!this.workspaceRoot) return [];

        const mdFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(this.workspaceRoot, '**/*.md'),
            '**/node_modules/**'
        );

        return mdFiles.map(uri => {
            const fileName = path.basename(uri.fsPath);
            return new ExplorerItem(
                fileName,
                vscode.TreeItemCollapsibleState.None,
                'doc_file',
                { 
                    iconName: 'file-type-markdown',
                    command: {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [uri]
                    },
                    description: vscode.workspace.asRelativePath(uri)
                }
            );
        });
    }

    private async getContextVaultItems(): Promise<ExplorerItem[]> {
        if (!this.workspaceRoot) return [];

        const vaultPath = path.join(this.workspaceRoot, '.synapse_contexts');
        if (!fs.existsSync(vaultPath)) return [];

        const files = fs.readdirSync(vaultPath)
            .filter(f => f.endsWith('.md'))
            .sort((a, b) => b.localeCompare(a)); // Descending order (latest first)

        return files.map(file => {
            const filePath = path.join(vaultPath, file);
            return new ExplorerItem(
                file,
                vscode.TreeItemCollapsibleState.None,
                'vault_file',
                {
                    iconName: 'record',
                    command: {
                        command: 'vscode.open',
                        title: 'Open Context',
                        arguments: [vscode.Uri.file(filePath)]
                    }
                }
            );
        });
    }
}

class ExplorerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        options?: {
            iconName?: string;
            command?: vscode.Command;
            description?: string;
        }
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.description = options?.description;
        
        if (options?.iconName) {
            this.iconPath = new vscode.ThemeIcon(options.iconName);
        }
        
        if (options?.command) {
            this.command = options.command;
        }
    }
}
