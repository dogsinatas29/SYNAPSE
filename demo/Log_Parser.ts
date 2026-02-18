import { FilterEngine } from './Filter_Engine';

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

export class LogParser {
    private filter: FilterEngine;

    constructor() {
        this.filter = new FilterEngine();
    }

    public async parse(line: string) {
        const regex = /^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(\\w+)\\] (.*)$/;
        const match = line.match(regex);

        if (match) {
            const entry: LogEntry = {
                timestamp: match[1],
                level: match[2],
                message: match[3]
            };
            await this.filter.process(entry);
        }
    }
}
