import * as vscode from 'vscode';

export class Logger {
    private static _outputChannel: vscode.OutputChannel;

    public static initialize(context: vscode.ExtensionContext) {
        this._outputChannel = vscode.window.createOutputChannel('Synapse');
        context.subscriptions.push(this._outputChannel);
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
        if (!this._outputChannel) return;

        const timestamp = new Date().toLocaleTimeString();
        let formattedMessage = `[${timestamp}] [${level}] ${message}`;

        if (args && args.length > 0) {
            formattedMessage += ' ' + args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : arg
            ).join(' ');
        }

        this._outputChannel.appendLine(formattedMessage);

        // Also log to console for development/debugging
        console.log(`[SYNAPSE] ${formattedMessage}`);
    }
}
