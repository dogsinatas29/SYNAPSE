const workspace = {
    workspaceFolders: undefined as any,
    fs: {
        readFile: async (_uri: any) => Buffer.from(''),
        writeFile: async (_uri: any, _content: any) => {},
        createDirectory: async (_uri: any) => {},
        stat: async (_uri: any) => ({ type: 1, ctime: 0, mtime: 0, size: 0 }),
    },
    getConfiguration: (_section?: string) => ({ get: (_key: string) => undefined }),
    asRelativePath: (p: string) => p,
    onDidOpenTextDocument: (_listener: any) => ({ dispose: () => {} }),
    onDidSaveTextDocument: (_listener: any) => ({ dispose: () => {} }),
    createFileSystemWatcher: (_pattern: any) => ({ onDidChange: () => {}, onDidCreate: () => {}, onDidDelete: () => {}, dispose: () => {} }),
    onDidCreateFiles: (_listener: any) => ({ dispose: () => {} }),
    findFiles: (_pattern: any, _exclude?: any, _max?: number) => Promise.resolve([]),
};

const window = {
    createOutputChannel: (_name: string) => ({ appendLine: () => {}, append: () => {}, show: () => {}, clear: () => {}, dispose: () => {} }),
    showInformationMessage: (_msg: string, ..._items: any[]) => Promise.resolve(undefined as any),
    showErrorMessage: (_msg: string) => Promise.resolve(undefined as any),
    showWarningMessage: (_msg: string, ..._items: any[]) => Promise.resolve(undefined as any),
    createStatusBarItem: (_alignment?: any, _priority?: number) => ({ text: '', tooltip: '', command: '', color: '', show: () => {}, hide: () => {}, dispose: () => {} }),
    setStatusBarMessage: (_text: string, _timeout?: any) => ({ dispose: () => {} }),
    registerTreeDataProvider: (_id: string, _provider: any) => ({ dispose: () => {} }),
    activeTextEditor: undefined as any,
    onDidChangeVisibleTextEditors: (_listener: any) => ({ dispose: () => {} }),
    showQuickPick: (_items: any[], _options?: any) => Promise.resolve(undefined as any),
    showTextDocument: (_doc: any) => Promise.resolve(undefined as any),
    withProgress: (_options: any, _task: any) => Promise.resolve(undefined as any),
};

const commands = {
    registerCommand: (_id: string, _handler: any) => ({ dispose: () => {} }),
    executeCommand: (_id: string, ..._args: any[]) => Promise.resolve(undefined as any),
};

const languages = {
    createDiagnosticCollection: (_name: string) => ({ set: () => {}, clear: () => {}, delete: () => {}, dispose: () => {} }),
};

const Uri = {
    file: (fsPath: string) => ({ fsPath, scheme: 'file', path: fsPath, toString: () => fsPath }),
    joinPath: (base: any, ...paths: string[]) => {
        const fsPath = [base.fsPath || base, ...paths].join('/');
        return { fsPath, scheme: 'file', path: fsPath, toString: () => fsPath };
    },
    parse: (str: string) => ({ fsPath: str, scheme: 'file', path: str, toString: () => str }),
};

class EventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];
    event = (listener: (e: T) => void) => {
        this.listeners.push(listener);
        return { dispose: () => { const idx = this.listeners.indexOf(listener); if (idx >= 0) this.listeners.splice(idx, 1); } };
    };
    fire(data: T) { this.listeners.forEach(l => l(data)); }
}

class OutputChannel {
    appendLine = () => {};
    append = () => {};
    show = () => {};
    clear = () => {};
    dispose = () => {};
}

const Diagnostic = class {
    range: any;
    message: string;
    severity: any;
    constructor(range: any, message: string, severity?: any) { this.range = range; this.message = message; this.severity = severity; }
};

const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };
const Disposable = class { dispose() {} };
const Position = class { constructor(_line: number, _character: number) {} };
const Range = class { constructor(_start: any, _end: any) {} };
const RelativePattern = class { constructor(_base: any, _pattern: string) {} };
const StatusBarAlignment = { Left: 1, Right: 2 };
const ProgressLocation = { Notification: 1, Window: 10 };

const WorkspaceFolder = class {
    uri: any;
    name: string;
    index: number;
    constructor(uri: any, name: string, index: number = 0) { this.uri = uri; this.name = name; this.index = index; }
};

const ExtensionContext = class {
    subscriptions: { push: (item: any) => void };
    extensionUri: any;
    globalState: any;
    extension: any;
    constructor() {
        this.subscriptions = { push: () => {} };
        this.extensionUri = Uri.file('/');
        this.globalState = { get: (_key: string, defaultValue?: any) => defaultValue, update: (_key: string, _value: any) => Promise.resolve() };
        this.extension = { packageJSON: { version: '0.3.30' } };
    }
    asAbsolutePath(relativePath: string) { return relativePath; }
};

export {
    workspace,
    window,
    commands,
    languages,
    Uri,
    EventEmitter,
    OutputChannel,
    Diagnostic,
    DiagnosticSeverity,
    Disposable,
    Position,
    Range,
    RelativePattern,
    StatusBarAlignment,
    ProgressLocation,
    WorkspaceFolder,
    ExtensionContext,
};
