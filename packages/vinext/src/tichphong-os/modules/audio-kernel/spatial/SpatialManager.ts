/**
 * SpatialManager - Manages 3D Audio and Spatial Presets
 * 
 * Combines EQ, BassBoost, Virtualizer, and Reverb effects
 * to create immersive spatial audio experiences.
 */
import { BassBoostNode } from '../dsp/nodes/BassBoostNode';
import { VirtualizerNode } from '../dsp/nodes/VirtualizerNode';
import { ReverbNode, ReverbPreset } from '../dsp/nodes/ReverbNode';
import {
    SpatialPreset,
    ALL_SPATIAL_PRESETS,
    getSpatialPresetById,
    AudioSource,
    AUDIO_SOURCES
} from './SpatialPresets';
import { EQPreset, ALL_EQ_PRESETS, getEQPresetById, EQ_FREQUENCIES } from './EQPresets';
import { kernelEventBus } from '../core/EventBus';

export interface SpatialState {
    is3DAudioEnabled: boolean;
    currentSpatialPresetId: string | null;
    currentEQPresetId: string;
    bassStrength: number;
    virtualizerStrength: number;
    reverbPreset: ReverbPreset;
}

export class SpatialManager {
    private context: AudioContext;
    private bassBoost: BassBoostNode;
    private virtualizer: VirtualizerNode;
    private reverb: ReverbNode;

    // 5-band EQ filters
    private eqFilters: BiquadFilterNode[] = [];

    // State
    private is3DAudioEnabled: boolean = false;
    private currentSpatialPresetId: string | null = null;
    private currentEQPresetId: string = 'flat';

    constructor(context: AudioContext) {
        this.context = context;

        // Create effect nodes
        this.bassBoost = new BassBoostNode(context);
        this.virtualizer = new VirtualizerNode(context);
        this.reverb = new ReverbNode(context);

        // Create 5-band EQ
        EQ_FREQUENCIES.forEach(freq => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.5;
            filter.gain.value = 0;
            this.eqFilters.push(filter);
        });

        // Chain: EQ → BassBoost → Virtualizer → Reverb
        this.chainNodes();
    }

    private chainNodes(): void {
        // Chain EQ filters together
        for (let i = 0; i < this.eqFilters.length - 1; i++) {
            this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }

        // EQ → BassBoost → Virtualizer → Reverb
        const lastEQ = this.eqFilters[this.eqFilters.length - 1];
        lastEQ.connect(this.bassBoost.getInputNode());
        this.bassBoost.getOutputNode().connect(this.virtualizer.getInputNode());
        this.virtualizer.getOutputNode().connect(this.reverb.getInputNode());
    }

    /**
     * Get the input node for the spatial chain
     */
    public getInputNode(): AudioNode {
        return this.eqFilters[0];
    }

    /**
     * Get the output node for the spatial chain
     */
    public getOutputNode(): AudioNode {
        return this.reverb.getOutputNode();
    }

    /**
     * Apply a spatial preset (Dolby, Mi Sound, DTS, Sony)
     */
    public applySpatialPreset(presetId: string): void {
        const preset = getSpatialPresetById(presetId);

        this.currentSpatialPresetId = presetId;
        this.is3DAudioEnabled = true;

        // Apply virtualizer
        this.virtualizer.setStrength(preset.virtualizerStrength);
        this.virtualizer.setEnabled(true);

        // Apply bass boost
        this.bassBoost.setStrength(preset.bassBoostStrength);

        // Apply reverb
        this.reverb.setPreset(preset.reverbPreset);
        this.reverb.setEnabled(true);

        // Apply 5-band EQ from spatial preset
        preset.eqGains.forEach((gain, i) => {
            if (this.eqFilters[i]) {
                this.eqFilters[i].gain.value = gain;
            }
        });

        console.log(`🎧 [SpatialManager] Applied preset: ${preset.nameVi} (${preset.source})`);
        kernelEventBus.emit('spatial:presetApplied', { presetId, preset });
    }

    /**
     * Apply an EQ-only preset (instrument-specific)
     */
    public applyEQPreset(presetId: string): void {
        const preset = getEQPresetById(presetId);

        this.currentEQPresetId = presetId;

        // Apply 5-band EQ gains
        preset.gains.forEach((gain, i) => {
            if (this.eqFilters[i]) {
                this.eqFilters[i].gain.value = gain;
            }
        });

        console.log(`🎛️ [SpatialManager] Applied EQ: ${preset.nameVi}`);
        kernelEventBus.emit('spatial:eqApplied', { presetId, preset });
    }

    /**
     * Enable/disable 3D Audio mode
     */
    public set3DAudioEnabled(enabled: boolean): void {
        this.is3DAudioEnabled = enabled;

        if (enabled) {
            // If no preset was selected, apply default Dolby Music
            if (!this.currentSpatialPresetId) {
                this.applySpatialPreset('dolby_music');
            }
        } else {
            // Disable all spatial effects
            this.virtualizer.setEnabled(false);
            this.reverb.setEnabled(false);
            this.bassBoost.setStrength(0);

            // Reset EQ to current EQ preset (or flat)
            this.applyEQPreset(this.currentEQPresetId);
            this.currentSpatialPresetId = null;
        }

        console.log(`🔊 [SpatialManager] 3D Audio: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        kernelEventBus.emit('spatial:3dAudioChanged', { enabled });
    }

    /**
     * Set individual effect strengths
     */
    public setBassStrength(strength: number): void {
        this.bassBoost.setStrength(strength);
    }

    public setVirtualizerStrength(strength: number): void {
        this.virtualizer.setStrength(strength);
        this.virtualizer.setEnabled(strength > 0);
    }

    public setReverbPreset(preset: ReverbPreset): void {
        this.reverb.setPreset(preset);
        this.reverb.setEnabled(preset !== 'NONE');
    }

    /**
     * Get current state
     */
    public getState(): SpatialState {
        return {
            is3DAudioEnabled: this.is3DAudioEnabled,
            currentSpatialPresetId: this.currentSpatialPresetId,
            currentEQPresetId: this.currentEQPresetId,
            bassStrength: 0, // TODO: track this
            virtualizerStrength: 0,
            reverbPreset: this.reverb.getCurrentPreset()
        };
    }

    /**
     * Get available presets
     */
    public getSpatialPresets(): SpatialPreset[] {
        return ALL_SPATIAL_PRESETS;
    }

    public getEQPresets(): EQPreset[] {
        return ALL_EQ_PRESETS;
    }

    public getAudioSources(): typeof AUDIO_SOURCES {
        return AUDIO_SOURCES;
    }

    /**
     * Clean up
     */
    public dispose(): void {
        this.eqFilters.forEach(f => f.disconnect());
        this.bassBoost.dispose();
        this.virtualizer.dispose();
        this.reverb.dispose();
    }
}
