import { ITelemetryLogger } from './interfaces';

export class TelemetryLogger implements ITelemetryLogger {
    private logs: any[] = [];
    private maxLogs: number = 100;

    public logEvent(name: string, data?: any): void {
        const entry = {
            timestamp: Date.now(),
            type: 'EVENT',
            name,
            data
        };
        this.addLog(entry);

        // In dev mode, maybe print critical ones
        if (name.includes('error') || name.includes('stall')) {
            console.debug(`📊 [Telemetry] ${name}`, data);
        }
    }

    public logError(context: string, error: any): void {
        const entry = {
            timestamp: Date.now(),
            type: 'ERROR',
            context,
            error
        };
        this.addLog(entry);
        console.error(`📊 [Telemetry] ERROR in ${context}:`, error);
    }

    private addLog(entry: any): void {
        if (this.logs.length >= this.maxLogs) {
            this.logs.shift();
        }
        this.logs.push(entry);
    }

    public getMetrics(): any {
        return {
            logCount: this.logs.length,
            recentLogs: this.logs.slice(-5)
        };
    }
}
