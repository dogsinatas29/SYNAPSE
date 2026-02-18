import { LogStore } from './Log_Store';
import { AlertManager } from './Alert_Manager';
import { LogEntry } from './Log_Parser';

export class FilterEngine {
    private store: LogStore;
    private alert: AlertManager;

    constructor() {
        this.store = new LogStore();
        this.alert = new AlertManager();
    }

    public async process(entry: LogEntry) {
        if (entry.level === 'ERROR' || entry.level === 'CRITICAL') {
            await this.alert.notify(entry);
        }

        await this.store.save(entry);
    }
}
