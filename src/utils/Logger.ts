let vscode: any = undefined;
try {
    vscode = require('vscode');
} catch { /* standalone mode — no vscode module */ }

export class Logger {
    private static _outputChannel: any = null;

    public static initialize(context?: any) {
        if (!vscode) {
            console.log('[SYNAPSE] Logger initialized (standalone mode)');
            return;
        }
        this._outputChannel = vscode.window.createOutputChannel('Synapse');
        if (context) context.subscriptions.push(this._outputChannel);
        this.info('Logger initialized');
    }

    public static info(message: string, ...args: any[]) {
        this._log('INFO', message, args);
    }

    public static warn(message: string, ...args: any[]) {
        this._log('WARN', message, args);
    }

    public static error(message: string, ...args: any[]) {
        this._log('ERROR', message, args);
    }

    public static show() {
        if (this._outputChannel) {
            this._outputChannel.show(true);
        }
    }

    private static _log(level: string, message: string, args: any[]) {
        const timestamp = new Date().toLocaleTimeString();
        let formattedMessage = `[${timestamp}] [${level}] ${message}`;

        if (args && args.length > 0) {
            formattedMessage += ' ' + args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : arg
            ).join(' ');
        }

        if (this._outputChannel) {
            this._outputChannel.appendLine(formattedMessage);
        }

        console.log(`[SYNAPSE] ${formattedMessage}`);
    }
}
