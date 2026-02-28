/**
 * IPlaybackDriver - Interface for audio playback implementations
 * 
 * Abstracts the underlying audio library (Howler, native WebAudio, etc.)
 */
export interface IPlaybackDriver {
    /** Load an audio source */
    load(src: string, options?: any): Promise<void>;

    /** Start playback */
    play(): Promise<void>;

    /** Pause playback */
    pause(): void;

    /** Stop and unload */
    stop(): void;

    /** Seek to position in seconds */
    seek(position: number): void;

    /** Set volume (0.0 - 1.0) */
    setVolume(volume: number): void;

    /** Set loop state */
    setLoop(loop: boolean): void;

    /** Set playback rate */
    setRate(rate: number): void;
    setPlaybackRate(rate: number): void;

    /** Set pitch preservation */
    setPreservePitch(preserve: boolean): void;

    /** Get duration in seconds */
    getDuration(): number;

    /** Get current playback position in seconds */
    getPosition(): number;

    /** Connect output to an AudioNode (for DSP routing) */
    connect(targetNode: AudioNode): void;

    /** Attach to AudioContext (required for Web Audio API) */
    attach(context: AudioContext): void;

    /** Get current driver mode (e.g. 'audiophile', 'transport') */
    getMode(): string;
}

/**
 * IDSPDriver - Interface for DSP processing implementations
 * 
 * Abstracts the DSP backend (WebAudio, AudioWorklet, WASM, etc.)
 */
export interface IDSPDriver {
    /** Initialize with AudioContext */
    init(context: AudioContext): void;

    /** Get input node for routing */
    getInput(): AudioNode;

    /** Get output node for routing */
    getOutput(): AudioNode;

    /** Set a parameter value */
    setParameter(name: string, value: number): void;

    /** Get a parameter value */
    getParameter(name: string): number;

    /** Reset to default state */
    reset(): void;

    /** Cleanup resources */
    dispose(): void;
}

/**
 * ISyncDriver - Interface for synchronization implementations
 * 
 * Abstracts the sync backend (Supabase Realtime, WebSocket, WebRTC, etc.)
 */
export interface ISyncDriver {
    /** Connect to a room */
    connect(roomId: string): Promise<boolean>;

    /** Disconnect from room */
    disconnect(): void;

    /** Send a message to other participants */
    broadcast(type: string, data: any): void;

    /** Register message handler */
    onMessage(callback: (type: string, data: any) => void): () => void;

    /** Get connection status */
    isConnected(): boolean;

    /** Get current latency estimate in ms */
    getLatency(): number;

    /** Get server time offset */
    getServerTimeOffset(): number;
}

/**
 * IAnalyzerDriver - Interface for audio analysis implementations
 */
export interface IAnalyzerDriver {
    /** Get frequency domain data */
    getFrequencyData(): Uint8Array | Float32Array;

    /** Get time domain data */
    getWaveformData(): Uint8Array | Float32Array;

    /** Set FFT size */
    setFFTSize(size: number): void;

    /** Get frequency bin count */
    getBinCount(): number;
}
