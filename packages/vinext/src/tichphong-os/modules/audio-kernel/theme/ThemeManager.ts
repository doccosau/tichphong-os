import { StateManager } from '../core/StateManager';
import { kernelEventBus } from '../core/EventBus';
import { AudioEvents } from '../core/types';
import { DSPGraph } from '../dsp/DSPGraph';
import { ParametricEQNode } from '../dsp/nodes/EQNode';
import { DynamicsNode } from '../dsp/nodes/DynamicsNode';
import { ReverbNode } from '../dsp/nodes/ReverbNode';
import { VirtualizerNode } from '../dsp/nodes/VirtualizerNode';
import { IThemePreset } from './interfaces';
import { PRESETS } from './presets';

/**
 * ThemeManager - Applies sound themes to DSP nodes
 * 
 * Orchestrates: EQ, Dynamics, Reverb (Ambience), Virtualizer (Spatial)
 * Handles: Basic Modes (432Hz, HD) and Advanced Themes (Dolby, etc.)
 */
export class ThemeManager {
    private stateManager: StateManager;
    private dspGraph: DSPGraph;

    // DSP Nodes
    private eqNode: ParametricEQNode;
    private dynNode: DynamicsNode;
    private reverbNode: ReverbNode;
    private virtualizerNode: VirtualizerNode;

    private currentThemeId: string = 'DEFAULT_ANCIENT';

    private readonly STORAGE_KEY = 'tp_audio_theme_preset';

    constructor(
        stateManager: StateManager,
        dspGraph: DSPGraph,
        eqNode: ParametricEQNode,
        dynNode: DynamicsNode,
        reverbNode: ReverbNode,
        virtualizerNode: VirtualizerNode
    ) {
        this.stateManager = stateManager;
        this.dspGraph = dspGraph;
        this.eqNode = eqNode;
        this.dynNode = dynNode;
        this.reverbNode = reverbNode;
        this.virtualizerNode = virtualizerNode;

        // Restore saved theme
        this.restoreTheme();
    }

    private restoreTheme() {
        try {
            const savedId = localStorage.getItem(this.STORAGE_KEY);
            if (savedId && PRESETS[savedId]) {
                console.log(`💾 [ThemeManager] Restoring saved theme: ${savedId}`);
                // Use setTimeout to ensure all nodes are fully ready, though usually synchronous in constructor is fine for audio nodes
                // But since we want to emit events and sync state, doing it next tick is safer
                setTimeout(() => {
                    this.applyTheme(savedId);
                }, 100);
            }
        } catch (e) {
            console.warn('[ThemeManager] Failed to restore theme', e);
        }
    }



    /**
     * Apply a theme by ID
     */
    public applyTheme(id: string): void {
        const preset = PRESETS[id];

        if (!preset) {
            console.warn(`[ThemeManager] Unknown theme: ${id}`);
            return;
        }

        console.log(`🎨 [ThemeManager] Applying Theme: ${preset.name} (${preset.category})`);

        // 1. Apply EQ
        // AI Auto EQ Logic (Mock for now)
        if (id === 'TP_AI_AUTO_EQ') {
            console.log('🤖 [ThemeManager] Running AI Auto EQ Analysis...');
            // In future: Analyze audio buffer and set curve
            this.eqNode.setGains([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Flat for now
        } else {
            this.eqNode.setGains(preset.eqGains);
        }

        // 2. Apply Dynamics (HD Audio, Night Mode, etc)
        this.dynNode.setAudiophileProfile(preset.dynamics);

        // 3. Apply Ambience (Reverb)
        this.reverbNode.setAmbienceConfig({
            ...preset.ambience,
            reverbType: preset.ambience.type
        });

        // 4. Apply Spatial (Virtualizer)
        this.virtualizerNode.setSpatialConfig(preset.spatial);

        // 5. Update State & Emit Events
        this.currentThemeId = id;
        this.stateManager.setDSPState({
            activePreset: id
        });

        // Save to LocalStorage
        try {
            localStorage.setItem(this.STORAGE_KEY, id);
        } catch (e) {
            // Ignore storage errors
        }

        // Notify Kernel/UI
        kernelEventBus.emit(AudioEvents.THEME_CHANGED, {
            id,
            preset, // Includes playbackRate info for Kernel to handle
            timestamp: Date.now()
        });
    }

    /**
     * Set Manual EQ Gains (10-band)
     */
    public setEQGains(gains: number[]): void {
        this.eqNode.setGains(gains);
        // We technically drift from the preset here, so we could set activePreset to 'CUSTOM'
        // But for now, just apply the gains.
    }

    /**
     * Get current theme state for UI
     */
    public getState(): { activePreset: string; eqGains: number[] } {
        const preset = PRESETS[this.currentThemeId];
        return {
            activePreset: this.currentThemeId,
            eqGains: preset ? preset.eqGains : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
    }

    /**
     * Get current theme ID
     */
    public getCurrentTheme(): string {
        return this.currentThemeId;
    }

    /**
     * Get all available themes
     */
    public getAvailableThemes(): IThemePreset[] {
        return Object.values(PRESETS);
    }

    /**
     * Get a specific preset by ID
     */
    public getPreset(id: string): IThemePreset | undefined {
        return PRESETS[id];
    }
}
