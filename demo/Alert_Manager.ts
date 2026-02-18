import { LogEntry } from './Log_Parser';

export class AlertManager {
    public async notify(entry: LogEntry) {
        console.log(`🚨 ALERT: [${entry.level}] ${entry.message}`);
        // Logic for desktop notify simulation
    }
}
