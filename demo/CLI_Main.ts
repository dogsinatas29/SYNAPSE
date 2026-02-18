/**
 * CLI_Main.ts
 * Entry point for Log-Hunter CLI
 */

import { LogWatcher } from './Log_Watcher';

export class CLIMain {
    private watcher: LogWatcher;

    constructor() {
        this.watcher = new LogWatcher();
    }

    public async main(args: string[]) {
        console.log("🚀 Starting Log-Hunter CLI...");

        if (args.includes('-f')) {
            await this.watcher.startWatching("/var/log/syslog");
        } else {
            console.log("Usage: log-hunter -f");
        }
    }
}

const app = new CLIMain();
app.main(process.argv);
