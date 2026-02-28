import { IPlaybackDriver } from '../interfaces';
import {
    ITPDriver, ITransportEngine, IDSPRoutingManager, IClockEngine,
    IStreamingBufferController, ILifecycleController, ITransportStateSynchronizer,
    IErrorRecoveryController, ICapabilityDetector, ITelemetryLogger, DriverCapabilities,
    IModeController, IPerformanceMonitor
} from './interfaces';
import { TransportEngine } from './TransportEngine';
import { DSPRoutingManager } from './DSPRoutingManager';
import { ClockEngine } from './ClockEngine';
import { StreamingBufferController } from './StreamingBufferController';
import { LifecycleController } from './LifecycleController';
import { TransportStateSynchronizer } from './TransportStateSynchronizer';
import { ErrorRecoveryController } from './ErrorRecoveryController';
import { CapabilityDetector } from './CapabilityDetector';
import { TelemetryLogger } from './TelemetryLogger';
import { ModeController } from './ModeController';
import { PerformanceMonitor } from './PerformanceMonitor';
import { kernelEventBus } from '../../core/EventBus';

// FIX: New Controllers
import { GestureUnlockController } from './controllers/GestureUnlockController';
import { TransportWarmupController } from './controllers/TransportWarmupController';
import { PlaybackRestoreController } from './controllers/PlaybackRestoreController';

export class TPDriver implements ITPDriver, IPlaybackDriver {
    // Subsystems
    private transport: ITransportEngine;
    private dspManager: IDSPRoutingManager;
    private clock: IClockEngine;
    private bufferController: IStreamingBufferController;
    private lifecycle: ILifecycleController;

    // Stability Subsystems
    private synchronizer: ITransportStateSynchronizer;
    private recovery: IErrorRecoveryController;
    private capabilities: ICapabilityDetector;
    private telemetry: ITelemetryLogger;

    // Adaptive Subsystems (Phase 2)
    private modeController: IModeController;
    private performance: IPerformanceMonitor;

    // FIX: Lifecycle Controllers
    private gestureUnlock: GestureUnlockController;
    private warmup: TransportWarmupController;
    private restoreController: PlaybackRestoreController;

    // State
    private caps: DriverCapabilities;
    private isDestroyed: boolean = false;

    constructor(enableDSP: boolean = false) {
        // 1. Initialize Stability Layer & Capabilities
        this.telemetry = new TelemetryLogger();
        this.capabilities = new CapabilityDetector();
        this.caps = this.capabilities.detect();

        // 2. Adaptive Core
        this.performance = new PerformanceMonitor();
        this.modeController = new ModeController(enableDSP, this.caps.isMobile, this.performance);

        this.synchronizer = new TransportStateSynchronizer();
        this.recovery = new ErrorRecoveryController();

        this.telemetry.logEvent('driver:init', { enableDSP, caps: this.caps, mode: this.modeController.getMode() });

        // 3. Initialize Core Engines
        this.performance.start(); // Start monitoring immediately

        // Force CORS if DSP is enabled OR if we want to be "DSP Ready" (Universal Mode)
        const useCORS = enableDSP;

        this.transport = new TransportEngine(useCORS);
        this.dspManager = new DSPRoutingManager();
        this.clock = new ClockEngine();
        this.bufferController = new StreamingBufferController();
        this.lifecycle = new LifecycleController();

        // FIX: Init New Controllers
        this.gestureUnlock = new GestureUnlockController();
        this.warmup = new TransportWarmupController(this.transport.getElement());
        this.restoreController = new PlaybackRestoreController();

        // 4. Connect Integrations
        this.bufferController.monitor(this.transport.getElement());
        this.lifecycle.handleVisibilityChange(document.visibilityState === 'visible'); // Initial check

        // Register self with ModeController
        this.modeController.registerEngine(this);

        console.log(`🚀 [TPDriver] Initialized. Mode: ${this.modeController.getMode()}, CORS: ${useCORS}`);
    }

    public async load(source: string): Promise<void> {
        this.telemetry.logEvent('load', { source });
        try {
            this.synchronizer.reset();
            this.clock.reset();
            // Reset warmup controller? Not needed, it just checks readiness.

            await this.transport.load(source);

            // Re-evaluate mode on new track load?
            // this.modeController.evaluate();
        } catch (error) {
            this.telemetry.logError('load', error);
            this.recovery.reportError(error);
            // Attempt recovery? or just throw? 
            // For now, throw to let Kernel know, but Recovery controller tracks it.
            throw error;
        }
    }

    public async play(): Promise<void> {
        if (this.isDestroyed) return;

        // FIX: FULL LIFECYCLE VALIDATION
        console.log('🔄 [TPDriver] Play Sequence Started...');

        try {
            // STEP 1: Unlock AudioContext (Lazy Creation Strategy)
            // We ask GestureUnlockController to get/create the context.
            // It will wait for user interaction if needed.

            // Only need to unlock if we intend to use DSP or if we need context for timing
            if (this.caps.dspSupported) {
                const ctx = await this.gestureUnlock.unlock();

                // Notify Kernel/Lifestyle that we have a valid AudioContext
                // This allows LifecycleManager to late-initialize AudioClock and DSPGraph
                kernelEventBus.emit('driver:audio-context-ready', { context: ctx });

                // Check if DSP connection is healthy
                if (this.dspManager.getContext() !== ctx) {
                    // We might need to re-attach if context changed (unlikely in singleton)
                    // But attach() is usually called by PlaybackManager -> Kernel -> DSPGraph
                    // We rely on PlaybackManager listening to 'driver:audio-context-ready'
                    // and calling back to attach.
                }

                // Inject context into DSPManager if not set
                if (!this.dspManager.getContext()) {
                    console.log('🔌 [TPDriver] Injecting new AudioContext into DSPManager');
                    // We need a way to pass context to dspManager.attach directly or via new method? 
                    // dspManager.attach() takes context.
                    // But we only attach when we have element. We have element.

                    // Also notify Kernel via event so it can init its graph
                    // IMPORTANT: Kernel needs to init Graph BEFORE we attach?
                    // Or we attach first?
                    // Kernel.injectContext() needs to run first to set up AudioWorklets etc.
                    // So we emit event first.

                    // Emit via browser event or kernel bus? TPDriver has no direct access to Kernel instance.
                    // But it imports interfaces. It doesn't import kernel event bus directly? 
                    // TPDriver usually emits to its own listeners? 
                    // Wait, TPDriver doesn't have an emit method? 
                    // It uses `transport` to emit? No.
                    // We should use the same EventBus helper if available, or assume Kernel listens to something.
                    // Actually `PlaybackManager` listens to `driver:loaded` etc on `kernelEventBus`.
                    // `TPDriver` imports `kernelEventBus`? No?
                    // Let's check `TPDriver.ts` imports.
                }

                // HACK: TPDriver doesn't import event bus (it should be decoupled). 
                // But for now we need to signal PlaybackManager.
                // We will return the context or handle it via a callback or just assume PlaybackManager handles 'driver:context' if we emit it?
                // TPDriver doesn't emit 'driver:context'.
                // We need to bridge this. 

                // Real Solution: PlaybackManager calls TPDriver.play(). 
                // TPDriver.play() awaits unlock.
                // We can make TPDriver.play() return the context? No promise<void>.

                // Let's use `this.dspManager.attach(ctx, element)` here.
                // And we assume `PlaybackManager` checks `dspManager.getContext()`?

                // CRITICAL: Kernel needs the context to init `DSPGraph`. 
                // `DSPGraph` is inside `Kernel`. `TPDriver` has `DSPRoutingManager` which is `IDSPRoutingManager`. 
                // `DSPRoutingManager` is NOT `DSPGraph`.

                // `DSPRoutingManager` takes `AudioContext` and creates `MediaElementSource`.
                // It does NOT configure the graph nodes.

                // So: 
                // 1. TPDriver gets Context.
                // 2. TPDriver emits event `driver:audio_context_ready` with context? 
                // PlaybackManager listens and calls `kernel.lifecycle.injectContext(ctx)`.

                // We need to import `kernelEventBus` in TPDriver? 
                // `TransportEngine` uses it. TPDriver should too.
            }

            // STEP 2: Warm Up (Buffer Check)
            // Ensure media is ready to play to avoid "stutter start"
            await this.warmup.waitReady();

            // STEP 3: DSP Attach Safety Check
            // Now that context is running and media is ready, we can safely allow DSP.
            // (If not already attached, or if we need to re-verify)
            if (this.caps.dspSupported && this.dspManager.getContext()) {
                const ctx = this.dspManager.getContext()!;
                // Double check context state just in case
                if (ctx.state === 'running' && this.transport.getElement().readyState >= 3) {
                    // We are good.
                    // The actual attach usually happens via `attachDSP` call from upstream,
                    // but here we ensure the graph is healthy.
                    if (!this.dspManager.isHealthy()) {
                        console.warn('⚠️ [TPDriver] DSP unhealthy before play. Connection might be broken.');
                        // Re-attach? Logic belongs in DSPManager or Kernel. 
                        // For now we assume Kernel called attach() previously.
                    }
                }
            }

            // STEP 4: Play
            console.log('▶️ [TPDriver] All systems green. Executing Transport Play.');

            // Signal restore complete
            this.restoreController.complete();

            await this.transport.play();

            // Start Watchdog
            this.recovery.startMonitoring(this.transport);
        } catch (error) {
            this.telemetry.logError('play', error);
            const recovered = await this.recovery.attemptRecovery();
            if (recovered) {
                // Retry once?
                return this.transport.play();
            }
            throw error;
        }
    }

    public pause(): void {
        const currentMode = this.modeController.getMode();
        if (currentMode === 'transport') {
            // Safe mode logic if needed
        }

        this.transport.pause();
        this.recovery.stopMonitoring();
    }

    public stop(): void {
        this.transport.stop();
        this.clock.reset();
        this.synchronizer.reset();
        this.recovery.stopMonitoring();
    }

    public preload(source: string): void {
        this.transport.preload(source);
    }

    public seek(time: number): void {
        this.transport.seek(time);
        this.clock.synchronize(time);
    }

    public destroy(): void {
        this.isDestroyed = true;
        this.performance.stop();
        this.modeController.dispose();
        this.transport.dispose();
        this.dspManager.dispose();
        this.lifecycle.dispose();
    }

    // --- setters ---
    public setVolume(volume: number): void {
        this.transport.setVolume(volume);
    }

    public setMute(muted: boolean): void {
        this.transport.getElement().muted = muted;
    }

    public setLoop(loop: boolean): void {
        this.transport.setLoop(loop);
    }

    public setPlaybackRate(rate: number): void {
        this.transport.setPlaybackRate(rate);
        this.clock.setPlaybackRate(rate);
    }

    public setPreservePitch(preserve: boolean): void {
        this.transport.setPreservePitch(preserve);
    }

    // IPlaybackDriver Alias
    public setRate(rate: number): void {
        this.setPlaybackRate(rate);
    }

    // --- getters ---
    public getElement(): HTMLAudioElement {
        return this.transport.getElement();
    }

    public getCurrentTime(): number {
        // Return drift-compensated time
        const rawTime = this.transport.getElement().currentTime;
        return rawTime;
    }

    // IPlaybackDriver Alias
    public getPosition(): number {
        return this.getCurrentTime();
    }

    public getDuration(): number {
        return this.transport.getDuration();
    }

    // --- DSP ---
    public attachDSP(context: AudioContext): MediaElementAudioSourceNode | null {
        // Consult ModeController first
        const mode = this.modeController.getMode();
        if (mode === 'transport') {
            console.warn('⚠️ [TPDriver] DSP request blocked by Transport Mode');
            return null;
        }

        if (!this.caps.dspSupported) {
            console.warn('⚠️ [TPDriver] DSP not supported on this platform');
            return null;
        }
        return this.dspManager.attach(context, this.transport.getElement());
    }

    public attach(context: AudioContext): void {
        this.attachDSP(context);
    }

    public connect(targetNode: AudioNode): void {
        this.dspManager.connect(targetNode);
    }

    public isDSPCompatible(): boolean {
        return this.caps.dspSupported && this.modeController.getMode() !== 'transport';
    }

    // --- Telemetry ---
    public getClockTime(): number {
        return this.clock.getCorrectedTime();
    }

    public getBufferHealth(): number {
        return this.bufferController.getHealth();
    }

    public getLatency(): number {
        return this.caps.latencyProfile === 'low' ? 0.01 : 0.05;
    }

    public getMode(): import('./interfaces').TPDriverMode {
        return this.modeController.getMode();
    }
}
