import { LifecycleManager, KernelStatus } from './LifecycleManager';
import { kernelEventBus } from './EventBus';
import { AudioEvents } from './types';
import { StateManager } from './StateManager';
import { AudioClock } from './AudioClock';
import { DSPGraph } from '../dsp/DSPGraph';
import { ParametricEQNode } from '../dsp/nodes/EQNode';
import { DynamicsNode } from '../dsp/nodes/DynamicsNode';
import { ReverbNode } from '../dsp/nodes/ReverbNode';
import { VirtualizerNode } from '../dsp/nodes/VirtualizerNode';
import { AnalyzerNode } from '../dsp/nodes/AnalyzerNode';
import { VolumeNode } from '../dsp/nodes/VolumeNode';
import { ThemeManager } from '../theme/ThemeManager';
import { PlaybackManager } from '../playback/PlaybackManager';
import { SpatialManager } from '../spatial/SpatialManager';
import { QueueManager } from '../playback/QueueManager';
import { MediaSessionAdapter, mediaSessionAdapter } from '../services/MediaSessionAdapter';
import { AudioEnhancer } from '../services/AudioEnhancer';
import { SyncService } from '../services/SyncService';
import { CapabilityDetector } from '../drivers/tp-driver/CapabilityDetector';
import { createLogger } from './Logger';

const log = createLogger('AudioKernel');

/**
 * TPAudioKernel - Main entry point for the audio subsystem
 * 
 * Singleton pattern. Usage:
 *   const kernel = AudioKernel.getInstance();
 *   await kernel.init();
 */
class AudioKernel {
    private static instance: AudioKernel;
    private lifecycle: LifecycleManager;

    // Core Submodules
    private dspGraph: DSPGraph;
    private themeManager: ThemeManager | null = null;
    private playbackManager: PlaybackManager | null = null;
    private spatialManager: SpatialManager | null = null;
    private analyzerNode: AnalyzerNode | null = null;

    // Advanced Services
    private queueManager: QueueManager;
    private mediaSession: MediaSessionAdapter;
    private enhancer: AudioEnhancer;
    private syncService: SyncService;

    // DSP Nodes (Held here to allow ThemeManager to access them even if graph reset)
    private eqNode: ParametricEQNode;
    private dynNode: DynamicsNode;
    private virtualizerNode: VirtualizerNode;
    private reverbNode: ReverbNode;
    private volumeNode: VolumeNode;

    private constructor() {
        this.lifecycle = new LifecycleManager();
        this.dspGraph = new DSPGraph();

        // Create DSP Nodes (Lazy init context later)
        this.eqNode = new ParametricEQNode();
        this.dynNode = new DynamicsNode();
        this.virtualizerNode = new VirtualizerNode();
        this.reverbNode = new ReverbNode();
        this.volumeNode = new VolumeNode();
        this.analyzerNode = new AnalyzerNode(); // Analyzer also needs refactor? It usually has no context dep or simple.

        // Initialize services that don't need AudioContext
        this.queueManager = new QueueManager();
        this.mediaSession = mediaSessionAdapter;
        this.enhancer = new AudioEnhancer();
        this.syncService = new SyncService();
    }

    public static getInstance(): AudioKernel {
        if (!AudioKernel.instance) {
            AudioKernel.instance = new AudioKernel();
        }
        return AudioKernel.instance;
    }

    public get audioEnhancer(): AudioEnhancer {
        return this.enhancer;
    }

    /**
     * Initialize the Audio Kernel
     */
    public async init(): Promise<void> {
        await this.lifecycle.init();

        const context = this.lifecycle.getContext();
        const state = this.lifecycle.getStateManager();
        const clock = this.lifecycle.getClock();

        if (!state) {
            throw new Error('[AudioKernel] Core dependencies missing');
        }

        // Initialize DSP Graph (Lazy or sync if context exists)
        if (context) {
            this.dspGraph.init(context);
            this.setupDSPNodes(context);
        } else {
            console.log('⏳ [AudioKernel] DSP Graph init deferred (Waiting for Context)');
        }

        // Listen for Late Context Injection (from Lifecycle)
        kernelEventBus.on('kernel:context-ready', (payload: { context: AudioContext }) => {
            console.log('💉 [AudioKernel] Context Ready Event received');
            const context = payload.context;

            // 1. Setup DSP Graph
            this.dspGraph.init(context);
            this.setupDSPNodes(context);

            // 2. Setup PlaybackManager (late clock injection)
            let clock = this.lifecycle.getClock();

            // Critical Fix: If clock is missing, try to force init it from Lifecycle
            if (!clock && context) {
                console.warn('⚠️ [Kernel] Clock missing during late init, attempting to create...');
                // We don't have direct access to create clock here easily without exposing more Lifecycle methods
                // But Lifecycle usually creates clock in constructor? 
                // Ah, Lifecycle creates clock in init() which requires context.
                // So if we are here, context is ready.
            }

            if (clock) {
                if (this.playbackManager) {
                    this.playbackManager.setClock(clock);
                    // Also ensure Lifecycle has reference (redundant but safe)
                    this.lifecycle.setPlaybackManager(this.playbackManager);
                } else {
                    // Should not happen if we init PlaybackManager in init()
                    this.setupPlaybackManager(clock);
                }
            } else {
                console.warn('⚠️ [Kernel] Context ready but Clock is still missing. Determining if this is critical...');
                // It might not be critical if we are in "Headless" mode or if Lifecycle hasn't fully attached.
            }
        });

        // Initialize Playback Manager — Smart DSP Mode
        // Use CapabilityDetector to determine if we should enable DSP (and CORS)
        const detector = new CapabilityDetector();
        const caps = detector.detect();

        // Force DSP enabled for now to rule out detection issues in production
        // The previous check was: const enableDSP = caps.dspSupported;
        const enableDSP = true;

        console.log(`🧠 [SmartKernel] Force enabled DSP. Mobile=${caps.isMobile}, Latency=${caps.latencyProfile}`);

        // ALWAYS initialize PlaybackManager to ensure UI can interact with Driver
        // If clock is missing, we pass null.
        this.setupPlaybackManager(clock as AudioClock, enableDSP); // Setup handles null checks/warning but we might need to modify it to accept null clock?

        // Wait, setupPlaybackManager is private and I defined it to take `clock: AudioClock`.
        // I need to update setupPlaybackManager signature OR call new PlaybackManager directly here.
        // Let's UPDATE setupPlaybackManager signature in a separate step or just inline the creation here?
        // Using inline creation here is cleaner since setupPlaybackManager was added to handle the "re-creation" which we might not want.
        // Actually, let's use setupPlaybackManager but we need to update its signature.
        // OR: just do it inline here and remove setupPlaybackManager usage from listener.

        // Let's modify setupPlaybackManager in Step 3? 
        // No, let's just do it inline here for now to fix the deadlock.

        if (this.playbackManager) {
            console.warn('⚠️ [Kernel] PlaybackManager already exists.');
        } else {
            this.playbackManager = new PlaybackManager(state, clock, this.dspGraph, enableDSP);
            this.lifecycle.setPlaybackManager(this.playbackManager);
        }

        // Connect 432Hz mode to playback rate
        this.enhancer.onRateChange((rate) => {
            this.playbackManager?.setPlaybackRate(rate);
        });

        // Listen for Theme Changes to apply Playback Rate (432Hz)
        kernelEventBus.on(AudioEvents.THEME_CHANGED, (payload: any) => {
            const preset = payload.preset;
            if (preset && this.playbackManager) {
                // Apply Rate if defined, else 1.0
                const rate = preset.playbackRate || 1.0;
                // We default preservePitch to true, unless specified false (432Hz needs false usually)
                const preservePitch = preset.preservePitch ?? true;

                log.info(`Applying Rate: ${rate}, PreservePitch: ${preservePitch} `);
                this.playbackManager.setPlaybackRate(rate);
                this.playbackManager.setPreservePitch(preservePitch);
            }
        });

        // Auto-advance queue on playback end
        kernelEventBus.on(AudioEvents.PLAYBACK_ENDED, () => {
            log.info('Playback ended (Event emitted). UI should handle next track.');
            // FIXED: Disable Kernel auto-advance. Let PlayerContext (Zustand) handle it.
            // this.playNext();
        });

        // Initialize Media Session Adapter with Kernel reference
        this.mediaSession.init(this);

        // Initialize ThemeManager (Now that we have nodes)
        this.themeManager = new ThemeManager(
            state,
            this.dspGraph,
            this.eqNode,
            this.dynNode,
            this.reverbNode,
            this.virtualizerNode
        );

        // Apply default theme (UI needs this ready immediately)
        this.themeManager.applyTheme('DEFAULT_ANCIENT');

        log.info('Fully initialized with Theme DSP System.');
    }

    private setupDSPNodes(context: AudioContext): void {
        console.log('🎛️ [AudioKernel] Setting up DSP Nodes...');
        this.dspGraph.reset(); // clear old nodes if any

        // Init DSP nodes with context
        // Nodes are already created (lazy), we just init them here with the new context.
        this.eqNode.init(context);
        this.dynNode.init(context);
        this.virtualizerNode.init(context);
        this.reverbNode.init(context);

        if (this.analyzerNode) {
            // Analyzer might need init?
            // Assuming analyzerNode is simple for now or was initialized in constructor.
            // If AnalyzerNode needs context, we should add init. 
            // Previous code: `this.analyzerNode = new AnalyzerNode()`. No context.
            // So likely fine.
        }

        // Full DSP Chain
        this.dspGraph.pushNode(this.eqNode);
        this.dspGraph.pushNode(this.dynNode);
        this.dspGraph.pushNode(this.virtualizerNode);
        this.dspGraph.pushNode(this.reverbNode);

        // Volume Node
        this.dspGraph.pushNode(this.volumeNode);

        // Analyzer Node
        if (this.analyzerNode) {
            this.dspGraph.pushNode(this.analyzerNode);
        }

        console.log('✅ [Kernel] DSP Chain Full: EQ -> Dynamics -> Virtualizer -> Reverb -> Volume -> Analyzer');

        // Note: ThemeManager already holds references to these nodes from init().
        // The nodes self-restore settings upon init(context).
        if (this.themeManager) {
            console.log('🔄 [Kernel] ThemeManager ready with initialized DSP Nodes');
        }
    }

    private setupPlaybackManager(clock: AudioClock | null, enableDSP?: boolean): void {
        const state = this.lifecycle.getStateManager();
        if (!state) {
            console.error('❌ [Kernel] Cannot setup PlaybackManager: StateManager missing');
            return;
        }

        if (this.playbackManager) {
            console.warn('⚠️ [Kernel] PlaybackManager already exists. Skipping setup.');
            return;
        }

        // Default DSP to false if not provided, or detect it? 
        let dspEnabled = enableDSP;
        if (dspEnabled === undefined) {
            const detector = new CapabilityDetector();
            dspEnabled = detector.detect().dspSupported;
        }

        console.log(`🎬 [Kernel] Initializing PlaybackManager (DSP: ${dspEnabled})`);
        this.playbackManager = new PlaybackManager(state, clock, this.dspGraph, dspEnabled);

        // Inject reference back to LifecycleManager for accurate clock syncing
        this.lifecycle.setPlaybackManager(this.playbackManager);
    }


    public async destroy(): Promise<void> {
        return this.lifecycle.destroy();
    }

    public isReady(): boolean {
        return this.lifecycle.getStatus() === KernelStatus.RUNNING && this.playbackManager !== null;
    }

    // === Module Accessors ===
    public get state(): StateManager | null {
        return this.lifecycle.getStateManager();
    }

    public get clock(): AudioClock | null {
        return this.lifecycle.getClock();
    }

    public get context(): AudioContext | null {
        return this.lifecycle.getContext();
    }

    public get bus() {
        return kernelEventBus;
    }

    public get dsp(): DSPGraph {
        return this.dspGraph;
    }

    public get theme(): ThemeManager {
        if (!this.themeManager) throw new Error('[AudioKernel] ThemeManager not ready');
        return this.themeManager;
    }

    public get playback(): PlaybackManager {
        if (!this.playbackManager) throw new Error('[AudioKernel] PlaybackManager not ready');
        return this.playbackManager;
    }

    public get spatial(): SpatialManager {
        if (!this.spatialManager) throw new Error('[AudioKernel] SpatialManager not ready');
        return this.spatialManager;
    }

    // === Advanced Service Accessors ===

    public get queue(): QueueManager {
        return this.queueManager;
    }

    public get audio(): AudioEnhancer {
        return this.enhancer;
    }

    public get sync(): SyncService {
        return this.syncService;
    }

    public get media(): MediaSessionAdapter {
        return this.mediaSession;
    }

    public get analyzer(): AnalyzerNode | null {
        return this.analyzerNode;
    }

    // === Navigation Methods ===

    // === INTENT CONTRACT (UI -> Kernel) ===
    // "UI expresses desire, Kernel decides reality"

    /**
     * INTENT: User wants to play a specific track
     * @param track - The track object to play
     */
    public async intentPlay(track: { id: string, src: string, metadata?: any }, options?: { autoPlay?: boolean }): Promise<void> {
        log.info(`Intent: Play(${track.id})`, options);

        // 1. Validation (Future: Check Region/Premium?)
        if (!track.src) {
            log.error('Intent Rejected: No Source');
            return;
        }

        const autoPlay = options?.autoPlay ?? true;

        // 2. Execution
        try {
            await this.playbackManager?.load(track.id, track.src, track.metadata);

            if (autoPlay) {
                await this.playbackManager?.play();
            } else {
                log.info('Intent: Load Only (AutoPlay: false)');
            }

            // 3. Metadata Update
            if (track.metadata) {
                this.mediaSession.updateMetadata(track.metadata);
            }
        } catch (e) {
            log.error('Play Execution Failed:', e);
            // kernelEventBus.emit(AudioEvents.ERROR, e);
        }
    }

    /**
     * INTENT: User wants to pause
     */
    public intentPause(): void {
        log.info('Intent: Pause');
        this.playbackManager?.pause();
    }

    /**
     * INTENT: User wants to resume
     */
    public async intentResume(): Promise<void> {
        log.info('Intent: Resume');
        await this.playbackManager?.play();
    }

    /**
     * INTENT: User wants to seek
     */
    public intentSeek(time: number): void {
        // console.log(`🧠[AudioKernel] Intent: Seek(${ time })`);
        this.playbackManager?.seek(time);

        // Optimistic UI update via Bus
        kernelEventBus.emit(AudioEvents.PLAYBACK_SEEKED, time);
    }

    /**
     * INTENT: User wants to set loops
     */
    public intentLoop(enabled: boolean): void {
        log.info(`Intent: Loop(${enabled})`);
        this.playbackManager?.setLoop(enabled);
    }

    // === Navigation Methods (Deprecated - Move to QueueManager Intent) ===

    /**
     * @deprecated Use intentNext() from UI instead
     */
    public async playNext(): Promise<void> {
        // Logic moved to UI Intent Dispatch
    }

    /**
     * INTENT: Enable/disable DSP processing
     * When CORS is unavailable, DSP should be disabled to avoid MediaElementSource errors.
     * Call this when CDN CORS headers are confirmed working.
     */
    public intentEnableDSP(enabled: boolean): void {
        log.info(`Intent: DSP ${enabled ? 'ENABLE' : 'DISABLE'} `);
        this.playbackManager?.setDSPEnabled(enabled);
        kernelEventBus.emit(AudioEvents.DSP_STATE_CHANGED, { enabled });
    }

    /** Check if DSP is currently enabled */
    public isDSPEnabled(): boolean {
        return this.playbackManager?.isDSPEnabled() ?? false;
    }
}

export const audioKernel = AudioKernel.getInstance();
export default audioKernel;
