import { IDSPRoutingManager } from './interfaces';

export class DSPRoutingManager implements IDSPRoutingManager {
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private context: AudioContext | null = null;
    private isConnectedToGraph: boolean = false;

    public attach(context: AudioContext, element: HTMLAudioElement): MediaElementAudioSourceNode {
        // GUARD: Media Element Source Singleton
        if (this.sourceNode) {
            console.warn('⚠️ [DSP] MediaElementSource already exists. Reusing singleton.');

            // Check context mismatch (Critical Error)
            if (this.context !== context) {
                console.error('❌ [DSP] Context Mismatch! Cannot reuse node from different context.');
                // We cannot recover easily because 'element' is bound to old context.
                // We might need to disconnect old? But we can't 'unbind' element from context in Web Audio API.
                // This usually requires re-creating the Audio Element.
            }
            return this.sourceNode;
        }

        // GUARD: DSP Attach Timing (Part 7)
        if (context.state !== 'running') {
            console.warn(`⚠️ [DSP] Attach rejected: Context state is ${context.state} (Must be 'running')`);
            throw new Error('DSP_ATTACH_CONTEXT_SUSPENDED');
        }

        if (element.readyState < 3) { // HAVE_FUTURE_DATA = 3
            console.warn(`⚠️ [DSP] Attach rejected: ReadyState is ${element.readyState} (Must be >= 3)`);
            // We allow strict mode failure here? 
            // If we throw, TPDriver must handle it. 
            // User prompt: "DSPRoutingManager MUST attach DSP only when... audio.readyState >= 3"
            throw new Error('DSP_ATTACH_NOT_READY');
        }

        try {
            this.context = context;
            this.sourceNode = context.createMediaElementSource(element);
            console.log('🔌 [DSP] MediaElementSource created');
            return this.sourceNode;
        } catch (error) {
            console.error('❌ [DSP] Failed to create MediaElementSource:', error);
            throw error;
        }
    }

    public connect(destination: AudioNode): void {
        if (!this.sourceNode) {
            console.warn('⚠️ [DSP] Cannot connect: No source node.');
            return;
        }

        try {
            this.sourceNode.connect(destination);
            this.isConnectedToGraph = true;
            console.log('🔗 [DSP] Connected to Graph');
        } catch (error) {
            console.error('❌ [DSP] Connect failed:', error);
            this.isConnectedToGraph = false;
        }
    }

    public disconnect(): void {
        if (this.sourceNode && this.isConnectedToGraph) {
            try {
                this.sourceNode.disconnect();
                this.isConnectedToGraph = false;
                console.log('🔌 [DSP] Disconnected from Graph');
            } catch (error) {
                console.warn('⚠️ [DSP] Disconnect warning:', error);
            }
        }
    }

    public isHealthy(): boolean {
        return !!(this.sourceNode && this.context && this.context.state === 'running');
    }

    public getContext(): AudioContext | null {
        return this.context;
    }

    public dispose(): void {
        this.disconnect();
        this.sourceNode = null;
        this.context = null;
    }
}
