import { LogParser } from './Log_Parser';

export class LogWatcher {
    private parser: LogParser;

    constructor() {
        this.parser = new LogParser();
    }

    public async startWatching(filePath: string) {
        console.log(`👀 Watching ${filePath}...`);

        // Pseudo-code for tailing a file
        while (true) {
            const rawLine = "2024-02-18 13:40:00 [ERROR] Database connection failed";
            await this.parser.parse(rawLine);
            break; // Demo exit
        }
    }
}
