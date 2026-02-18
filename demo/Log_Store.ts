import { LogEntry } from './Log_Parser';

export class LogStore {
    public async save(entry: LogEntry) {
        console.log(`💾 Saving to SQLite: ${entry.message}`);
    }
}
