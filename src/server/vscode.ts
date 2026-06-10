export namespace window {
    export function createOutputChannel(_name: string) {
        return {
            appendLine: (msg: string) => console.log(`[${_name}] ${msg}`),
            append: (msg: string) => process.stdout.write(msg),
            show: () => {},
            clear: () => {},
            dispose: () => {},
        };
    }
    export function showInformationMessage(_msg: string, ..._items: any[]): Promise<any> { return Promise.resolve(undefined); }
    export function showErrorMessage(_msg: string): Promise<any> { return Promise.resolve(undefined); }
    export function showWarningMessage(_msg: string, ..._items: any[]): Promise<any> { return Promise.resolve(undefined); }
}
export namespace workspace {
    export const workspaceFolders: any = undefined;
    export const fs: any = {};
}
export namespace commands {
    export function registerCommand(_id: string, _handler: any): any { return { dispose: () => {} }; }
}
export class Disposable {
    dispose() {}
}
export class Uri {
    static file(fsPath: string): any { return { fsPath, scheme: 'file', path: fsPath }; }
    static joinPath(base: any, ...paths: string[]): any {
        const fsPath = [base.fsPath || base, ...paths].join('/');
        return { fsPath, scheme: 'file', path: fsPath };
    }
}
