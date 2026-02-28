import { ITransportStateSynchronizer } from './interfaces';

export class TransportStateSynchronizer implements ITransportStateSynchronizer {
    private lastState: string = 'STOPPED';

    public validateEvent(event: string, state: any): boolean {
        // Simple state machine or deduplication logic
        if (event === 'transport:playing' && this.lastState === 'PLAYING') {
            console.warn('⚠️ [Synchronizer] Duplicate PLAYING event suppressed');
            return false;
        }
        if (event === 'transport:paused' && this.lastState === 'PAUSED') {
            return false;
        }

        // Update state
        if (event === 'transport:playing') this.lastState = 'PLAYING';
        if (event === 'transport:paused') this.lastState = 'PAUSED';
        if (event === 'transport:ended') this.lastState = 'STOPPED';
        if (event === 'transport:loaded') this.lastState = 'LOADED';

        return true;
    }

    public getCurrentState(): any {
        return this.lastState;
    }

    public reset(): void {
        this.lastState = 'STOPPED';
    }
}
