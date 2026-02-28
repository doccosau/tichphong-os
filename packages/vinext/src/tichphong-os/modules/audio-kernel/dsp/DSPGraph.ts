import { IDSPNode } from './IDSPNode';

/**
 * DSPGraph - WebAudio processing chain manager
 * 
 * ARCHITECTURE:
 * [Source] → InputGain → [Node1] → [Node2] → ... → MasterGain → Destination
 * 
 * The InputGain is where external sources (like Howler) connect.
 * The MasterGain always connects to context.destination.
 */
export class DSPGraph {
    private context: AudioContext | null = null;
    private inputNode: GainNode | null = null;
    private masterGain: GainNode | null = null;
    private nodes: IDSPNode[] = [];
    private isInitialized: boolean = false;

    /**
     * Initialize with AudioContext
     */
    public init(context: AudioContext): void {
        if (this.isInitialized) {
            console.warn('[DSPGraph] Already initialized.');
            return;
        }

        this.context = context;

        // Create input (where sources connect) and output (master volume)
        this.inputNode = context.createGain();
        this.masterGain = context.createGain();

        // Initial chain: Input → Master → Destination
        this.inputNode.connect(this.masterGain);
        this.masterGain.connect(context.destination);

        this.isInitialized = true;
        console.log('🎛️ [DSPGraph] Initialized. Chain: Input → Master → Destination');
    }

    /**
     * Reset the graph (clear all custom nodes)
     * Keeps input and master intact.
     */
    public reset(): void {
        this.nodes = [];
        // If we were connected, we'd need to disconnect old nodes. 
        // But for now we just clear the list and assume caller re-builds.
        // Ideally we should disconnect all nodes in 'this.nodes'.

        // Disconnect Input from Master (reset to default state)
        if (this.inputNode && this.masterGain) {
            this.inputNode.disconnect();
            this.inputNode.connect(this.masterGain);
        }
    }

    /**
     * Get the input node for external sources to connect
     */
    public getInputNode(): AudioNode {
        if (!this.inputNode) {
            throw new Error('[DSPGraph] Not initialized - call init() first');
        }
        return this.inputNode;
    }

    /**
     * Add a DSP processor node to the chain
     */
    public pushNode(node: IDSPNode): void {
        if (!this.context) {
            console.error('[DSPGraph] Cannot add node - not initialized');
            return;
        }

        node.init(this.context);
        this.nodes.push(node);
        this.rebuildChain();
    }

    /**
     * Remove a node from the chain
     */
    public removeNode(node: IDSPNode): void {
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
            node.dispose?.();
            this.rebuildChain();
        }
    }

    /**
     * Rebuild the audio routing chain
     * 
     * Called after adding/removing nodes to ensure correct connections.
     */
    private rebuildChain(): void {
        if (!this.context || !this.inputNode || !this.masterGain) {
            console.error('[DSPGraph] Cannot rebuild - not initialized');
            return;
        }

        // Step 1: Disconnect everything (errors expected for unconnected nodes)
        try { this.inputNode.disconnect(); } catch (e) { /* expected */ }
        try { this.masterGain.disconnect(); } catch (e) { /* expected */ }

        for (const node of this.nodes) {
            // FIX: DO NOT disconnect input! It breaks internal chains (e.g., Input -> Filter).
            // Only disconnect outputs to break the chain between nodes.
            // try { node.getInput().disconnect(); } catch (e) { /* expected */ }

            try { node.getOutput().disconnect(); } catch (e) { /* expected */ }
        }

        // Step 2: Rebuild chain
        // Input → Node1 → Node2 → ... → MasterGain → Destination
        let current: AudioNode = this.inputNode;

        for (const node of this.nodes) {
            try {
                // Connect current output to node input
                current.connect(node.getInput());

                // Move current to node output
                current = node.getOutput();
            } catch (e) {
                console.error('❌ [DSPGraph] Failed to connect node:', node, e);
            }
        }

        // Connect to master gain
        current.connect(this.masterGain);

        // Step 3: CRITICAL - Master always goes to destination
        this.masterGain.connect(this.context.destination);

        console.log(`🎛️ [DSPGraph] Chain rebuilt: Input → ${this.nodes.length} nodes → Master → Destination`);
    }

    /**
     * Set master volume (0.0 - 1.0)
     */
    public setMasterVolume(value: number): void {
        if (this.masterGain && this.context) {
            this.masterGain.gain.setValueAtTime(
                Math.max(0, Math.min(1, value)),
                this.context.currentTime
            );
        }
    }

    /**
     * Get the AudioContext
     */
    public getContext(): AudioContext | null {
        return this.context;
    }

    /**
     * Check if initialized
     */
    public ready(): boolean {
        return this.isInitialized;
    }
}
