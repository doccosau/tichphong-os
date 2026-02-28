/**
 * IDSPNode - Interface for all DSP processor nodes
 * 
 * Each node wraps one or more WebAudio nodes and exposes
 * input/output for chaining.
 */
export interface IDSPNode {
    /** Initialize the node with an AudioContext */
    init(context: AudioContext): void;

    /** Get the input AudioNode for this processor */
    getInput(): AudioNode;

    /** Get the output AudioNode for this processor */
    getOutput(): AudioNode;

    /** Clean up resources */
    dispose?(): void;
}
