export class GestureUnlockController {
    private audioContext: AudioContext | null = null;
    private hasUnlocked: boolean = false;
    private unlockPromise: Promise<AudioContext> | null = null;
    private resolveUnlock!: (ctx: AudioContext) => void;
    private listeners: { type: string, handler: () => void }[] = [];

    constructor() { }

    /**
     * Unlock or Create AudioContext on interaction
     */
    public async unlock(): Promise<AudioContext> {
        // Warning: if we already have a context, we reuse it.
        // If we don't, we create it BUT we must check if we are in a gesture.
        // If not in gesture, we wait.

        if (this.audioContext && this.audioContext.state === 'running') {
            return this.audioContext;
        }

        // Return existing promise if waiting
        if (this.unlockPromise) return this.unlockPromise;

        console.log('🔒 [Unlock] Requesting AudioContext unlock...');

        this.unlockPromise = new Promise<AudioContext>((resolve) => {
            this.resolveUnlock = resolve;
            this.setupListeners();
        });

        // HACK: If we are already executing inside a call stack driven by an event handler 
        // (e.g. User clicked Play -> play() -> unlock()), we might be able to create it NOW.
        // But checking `event.isTrusted` is tricky here. 
        // We assume IF `unlock()` is called, it's LIKELY from a click.
        // Let's try to create/resume immediately. If it suspends, we listen.
        try {
            if (!this.audioContext) {
                // @ts-ignore
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🆕 [Unlock] AudioContext Created:', this.audioContext.state);
            }

            if (this.audioContext.state === 'suspended') {
                console.log('⚠️ [Unlock] Context is suspended. Attempting resume...');
                await this.audioContext.resume();
            }

            if (this.audioContext.state === 'running') {
                console.log('✅ [Unlock] Auto-resume success (Active Gesture Detect?).');
                this.hasUnlocked = true;
                this.finish(this.audioContext);
                return this.audioContext;
            }
        } catch (e) {
            console.warn('⚠️ [Unlock] Auto-unlock failed:', e);
        }

        return this.unlockPromise;
    }

    private setupListeners(): void {
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        // Remove old if any
        this.removeListeners();

        const handler = async () => {
            console.log('🔓 [Unlock] User gesture detected!');
            try {
                if (!this.audioContext) {
                    // @ts-ignore
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }

                console.log(`✅ [Unlock] Context Resumed. State: ${this.audioContext.state}`);
                this.hasUnlocked = true;
                this.finish(this.audioContext);
            } catch (error) {
                console.warn('⚠️ [Unlock] Resume failed:', error);
            }
        };

        this.listeners = events.map(type => ({ type, handler }));
        events.forEach(type => {
            window.addEventListener(type, handler, { capture: true, once: true });
        });
    }

    private finish(ctx: AudioContext): void {
        this.removeListeners();
        if (this.resolveUnlock) {
            this.resolveUnlock(ctx);
        }
    }

    private removeListeners(): void {
        this.listeners.forEach(({ type, handler }) => {
            window.removeEventListener(type, handler, { capture: true });
        });
        this.listeners = [];
    }

    public isUnlocked(): boolean {
        return this.hasUnlocked && this.audioContext?.state === 'running';
    }
}
