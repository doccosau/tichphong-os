import { IDSPNode } from '../IDSPNode';

/**
 * VolumeNode - AudioWorklet Implementation
 * 
 * Uses 'gain-processor' to control volume.
 * Demonstrates AudioWorklet integration in DSP Graph.
 */
export class VolumeNode implements IDSPNode {
    private context: AudioContext | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private gainParam: AudioParam | null = null;
    private currentVolume: number = 1.0;

    public init(context: AudioContext): void {
        this.context = context;
        try {
            // Need to ensure module is added. Usually done in global init. 
            // If not, this might fail unless "gain-processor" uses native ScriptProcessor or is pre-loaded by Kernel?
            // Assuming Kernel loaded it? Kernel does NOT load it in this conversation.
            // If this fails, we fall back to Gain.

            this.workletNode = new AudioWorkletNode(context, 'gain-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                parameterData: {
                    gain: this.currentVolume
                }
            });

            // Get parameter for automation
            this.gainParam = this.workletNode.parameters.get('gain') || null;

            console.log('✅ [VolumeNode] Initialized (AudioWorklet)');
        } catch (e) {
            console.warn('⚠️ [VolumeNode] Failed to create AudioWorkletNode, falling back to GainNode', e);
            // Fallback to standard GainNode
            this.workletNode = context.createGain() as any;
            if (this.workletNode) {
                (this.workletNode as unknown as GainNode).gain.value = this.currentVolume;
                this.gainParam = (this.workletNode as unknown as GainNode).gain;
            }
        }
    }

    public getInput(): AudioNode {
        if (!this.workletNode) throw new Error('VolumeNode not initialized');
        return this.workletNode;
    }

    public getOutput(): AudioNode {
        if (!this.workletNode) throw new Error('VolumeNode not initialized');
        return this.workletNode;
    }

    public setVolume(value: number): void {
        this.currentVolume = value;
        if (this.gainParam && this.context) {
            const now = this.context.currentTime;
            this.gainParam.cancelScheduledValues(now);
            this.gainParam.linearRampToValueAtTime(value, now + 0.05); // 50ms smooth
        }
    }

    public dispose(): void {
        this.workletNode?.disconnect();
        this.workletNode = null;
        this.gainParam = null;
    }
}
