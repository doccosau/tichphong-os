export interface ITPDriver {
    load(source: string): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    seek(time: number): void;
    stop(): void;
    destroy(): void;

    setVolume(volume: number): void;
    setMute(muted: boolean): void;
    setLoop(loop: boolean): void;
    setPlaybackRate(rate: number): void;
    setPreservePitch(preserve: boolean): void;

    getElement(): HTMLAudioElement;
    getCurrentTime(): number;
    getDuration(): number;

    // DSP & Routing
    attachDSP(context: AudioContext): MediaElementAudioSourceNode | null;
    connect(targetNode: AudioNode): void;
    isDSPCompatible(): boolean;

    // Telemetry & Health
    getClockTime(): number;
    getBufferHealth(): number;
    getLatency(): number;
    getMode(): TPDriverMode;
    preload(source: string): void;
}

export interface ITransportEngine {
    load(src: string): Promise<void>;
    preload(src: string): void;
    play(): Promise<void>;
    pause(): void;
    seek(time: number): void;
    stop(): void;
    setVolume(volume: number): void;
    setLoop(loop: boolean): void;
    setPlaybackRate(rate: number): void;
    setPreservePitch(preserve: boolean): void;
    getElement(): HTMLAudioElement;
    getDuration(): number;
    dispose(): void;
}

export interface IClockEngine {
    synchronize(transportTime: number): void;
    getCorrectedTime(): number;
    reset(): void;
    setPlaybackRate(rate: number): void;
}

export interface IDSPRoutingManager {
    attach(context: AudioContext, element: HTMLAudioElement): MediaElementAudioSourceNode;
    connect(destination: AudioNode): void;
    disconnect(): void;
    isHealthy(): boolean;
    getContext(): AudioContext | null;
    dispose(): void;
}

export interface IStreamingBufferController {
    monitor(element: HTMLAudioElement): void;
    getHealth(): number; // 0.0 - 1.0
    isStalled(): boolean;
    reset(): void;
}

export interface ILifecycleController {
    registerInteraction(): void;
    handleVisibilityChange(isVisible: boolean): void;
    dispose(): void;
}

export interface ITransportStateSynchronizer {
    validateEvent(event: string, state: any): boolean;
    getCurrentState(): any;
    reset(): void;
}

export interface IErrorRecoveryController {
    reportError(error: any): void;
    attemptRecovery(): Promise<boolean>;
    startMonitoring(transport: ITransportEngine): void;
    stopMonitoring(): void;
    reset(): void;
}

export interface ICapabilityDetector {
    detect(): DriverCapabilities;
}

export interface DriverCapabilities {
    dspSupported: boolean;
    latencyProfile: 'low' | 'balanced' | 'high';
    isMobile: boolean;
    streamingOptimized: boolean;
}

export interface ITelemetryLogger {
    logEvent(name: string, data?: any): void;
    logError(context: string, error: any): void;
    getMetrics(): any;
}

// --- Phase 2: Adaptive Architecture ---

export type TPDriverMode = 'audiophile' | 'light' | 'transport';

export interface IModeController {
    setMode(mode: TPDriverMode): Promise<boolean>;
    getMode(): TPDriverMode;
    registerEngine(engine: ITPDriver): void; // Loopback to orchestrate
    evaluate(metrics: any): void; // Decide to switch?
    dispose(): void;
}

export interface IPerformanceMonitor {
    start(): void;
    stop(): void;
    reportFrameDrop(): void;
    getScore(): number; // 0 - 100
    isHealthy(): boolean;
}
