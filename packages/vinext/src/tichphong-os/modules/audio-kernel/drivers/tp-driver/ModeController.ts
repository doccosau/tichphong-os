import { IModeController, TPDriverMode, ITPDriver, IPerformanceMonitor } from './interfaces';
import { kernelEventBus } from '../../core/EventBus';

export class ModeController implements IModeController {
    private currentMode: TPDriverMode = 'audiophile'; // Default target
    private engine: ITPDriver | null = null;
    private performance: IPerformanceMonitor | null = null;

    constructor(
        private enableDSP: boolean,
        private isMobile: boolean,
        performanceMonitor?: IPerformanceMonitor
    ) {
        if (performanceMonitor) {
            this.performance = performanceMonitor;
        }

        // Initial Decision Logic
        if (!this.enableDSP) {
            this.currentMode = 'transport'; // Safe Mode forced
        } else if (this.isMobile) {
            this.currentMode = 'light'; // Mobile defaults to light DSP
        } else {
            this.currentMode = 'audiophile';
        }
    }

    public registerEngine(engine: ITPDriver): void {
        this.engine = engine;
        this.applyMode();
    }

    public async setMode(mode: TPDriverMode): Promise<boolean> {
        if (this.currentMode === mode) return true;

        console.log(`🔄 [ModeController] Switching mode: ${this.currentMode} -> ${mode}`);
        this.currentMode = mode;

        // Notify System
        kernelEventBus.emit('driver:mode', { mode });

        return this.applyMode();
    }

    public getMode(): TPDriverMode {
        return this.currentMode;
    }

    public evaluate(metrics: any): void {
        if (!this.performance) return;

        const score = this.performance.getScore();

        // Auto-Downgrade Logic
        if (this.currentMode === 'audiophile' && score < 60) {
            console.warn(`📉 [ModeController] Performance drop (Score: ${score}). Downgrading to Light Mode.`);
            this.setMode('light');
        } else if (this.currentMode === 'light' && score < 40) {
            console.warn(`📉 [ModeController] Critical performance drop (Score: ${score}). Downgrading to Transport Mode.`);
            this.setMode('transport');
        }

        // Auto-Upgrade Logic (Conservative)
        // Only upgrade if score is near perfect for sustained period
        if (this.currentMode === 'light' && score > 95 && !this.isMobile) {
            // Maybe user closed a heavy tab?
            // For now, let's Stick to Light once downgraded to avoid "flip-flopping"
        }
    }

    public dispose(): void {
        this.engine = null;
    }

    private async applyMode(): Promise<boolean> {
        if (!this.engine) return false;

        try {
            switch (this.currentMode) {
                case 'transport':
                    // Detach DSP, strictly via Transport
                    // In current architecture, Transport is always running.
                    // We just need to ensure DSP is bypassed.
                    // TPDriver.attachDSP will return null or disconnect.
                    // But TPDriver is orchestrator. 
                    // ModeController instructs TPDriver what to do?
                    // Or TPDriver queries ModeController?
                    // Better: ModeController signals TPDriver.
                    // For now, we update internal state, TPDriver will read getMode().
                    break;
                case 'light':
                case 'audiophile':
                    // Ensure DSP is connected if it was disconnected
                    break;
            }
            return true;
        } catch (e) {
            console.error('❌ [ModeController] Mode switch failed:', e);
            return false;
        }
    }
}
