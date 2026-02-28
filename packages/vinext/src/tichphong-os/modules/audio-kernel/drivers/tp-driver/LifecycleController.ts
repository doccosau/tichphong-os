import { ILifecycleController } from './interfaces';

export class LifecycleController implements ILifecycleController {
    private onVisibilityChange?: (isVisible: boolean) => void;

    constructor() {
        this.setupVisibilityListener();
    }

    private setupVisibilityListener(): void {
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.handleVisibility);
        }
    }

    private handleVisibility = (): void => {
        const isVisible = document.visibilityState === 'visible';
        console.log(`👁️ [Lifecycle] Visibility changed: ${isVisible}`);
        if (this.onVisibilityChange) {
            this.onVisibilityChange(isVisible);
        }
    }

    public registerInteraction(): void {
        // Hook to unlock AudioContext if needed (usually handled by Kernel)
    }

    public handleVisibilityChange(isVisible: boolean): void {
        // Logic to suspend/resume heavy visuals, but keep audio running.
        // TPDriver primarily cares about keeping audio running.
        // Implementation might involve reducing polling rates.
    }

    public dispose(): void {
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibility);
        }
    }
}
