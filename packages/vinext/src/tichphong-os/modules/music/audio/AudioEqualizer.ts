/**
 * TichPhong Core 5.1.1 - Audio Equalizer Engine
 * Safe implementation with proper error handling
 */

import { EQ_FREQUENCIES, EQ_PRESETS, EQPresetKey } from './eqPresets';

/**
 * @deprecated This class is superseded by ThemeManager in the audio-kernel module.
 * Use `audioKernel.theme` instead. Kept for legacy compatibility only.
 */
class AudioEqualizer {
    private audioContext: AudioContext | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private filters: BiquadFilterNode[] = [];
    private gainNode: GainNode | null = null;
    private compressorNode: DynamicsCompressorNode | null = null;
    private makeupGainNode: GainNode | null = null;
    private connected: boolean = false;
    private currentPreset: EQPresetKey = 'flat';
    private customGains: number[] = [0, 0, 0, 0, 0];
    private hdEnabled: boolean = false;
    private pitch432Enabled: boolean = false;
    private autoEQEnabled: boolean = false;

    private currentAudioElement: HTMLAudioElement | null = null;

    // 432Hz tuning: 432/440 = 0.9818 → -31.77 cents
    private static readonly PITCH_432_CENTS = -31.77;
    private static readonly STORAGE_KEY = 'tichphong_eq_settings';

    /**
     * Safely initialize EQ with an audio element
     */
    connect(audioElement: HTMLAudioElement): boolean {
        // If getting same element, we are good
        if (this.connected && this.currentAudioElement === audioElement) {
            return true;
        }

        // If getting a NEW element but already connected, we need to swap the source
        if (this.connected && this.currentAudioElement !== audioElement) {
            console.log('🎛️ Audio Element changed, reconnecting EQ...');
            try {
                // Disconnect old source
                if (this.sourceNode) {
                    this.sourceNode.disconnect();
                }

                // Create new source
                if (this.audioContext) {
                    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
                    this.currentAudioElement = audioElement;

                    // Connect new source to the first filter (start of the chain)
                    if (this.filters.length > 0) {
                        this.sourceNode.connect(this.filters[0]);
                    } else if (this.compressorNode && this.makeupGainNode) {
                        // Fallback if no filters
                        this.sourceNode.connect(this.compressorNode);
                    } else if (this.gainNode) {
                        // Fallback if no compressor
                        this.sourceNode.connect(this.gainNode);
                    } else {
                        // Fallback if nothing else
                        this.sourceNode.connect(this.audioContext.destination);
                    }

                    return true;
                }
            } catch (error) {
                console.error('Failed to reconnect new audio element:', error);
                return false;
            }
        }

        try {
            // Create audio context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported');
                return false;
            }

            this.audioContext = new AudioContextClass();

            // Create source from audio element
            this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
            this.currentAudioElement = audioElement;

            // Create gain node for master volume
            this.gainNode = this.audioContext.createGain();

            // Create compressor node for HD Audio
            this.compressorNode = this.audioContext.createDynamicsCompressor();
            // Default to transparent (OFF)
            this.compressorNode.threshold.value = 0;
            this.compressorNode.ratio.value = 1;

            // Create makeup gain node for HD compensation (prevents volume drop)
            this.makeupGainNode = this.audioContext.createGain();
            this.makeupGainNode.gain.value = 1.0;

            // Create 5 biquad filters
            this.filters = EQ_FREQUENCIES.map((freq, index) => {
                const filter = this.audioContext!.createBiquadFilter();

                // First and last are shelving, middle are peaking
                if (index === 0) {
                    filter.type = 'lowshelf';
                } else if (index === EQ_FREQUENCIES.length - 1) {
                    filter.type = 'highshelf';
                } else {
                    filter.type = 'peaking';
                    filter.Q.value = 1.4;
                }

                filter.frequency.value = freq;
                filter.gain.value = 0;

                return filter;
            });

            // Chain: source -> filters -> compressor
            let previousNode: AudioNode = this.sourceNode;

            for (const filter of this.filters) {
                previousNode.connect(filter);
                previousNode = filter;
            }

            // Connect last filter to compressor
            previousNode.connect(this.compressorNode);

            // Connect compressor to makeup gain
            this.compressorNode.connect(this.makeupGainNode);

            // Connect makeup gain to master gain
            this.makeupGainNode.connect(this.gainNode);

            // Master to Destination
            this.gainNode.connect(this.audioContext.destination);

            this.connected = true;
            console.log('🎛️ AudioEqualizer connected safely');

            // Restore saved settings to the new nodes
            this.loadSettings();

            // Re-apply gains
            if (this.customGains) {
                this.setGains(this.customGains);
            }

            // Re-apply HD Mode
            if (this.hdEnabled) {
                this.setHDMode(true);
            }

            // Re-apply 432Hz Mode
            if (this.pitch432Enabled) {
                this.set432Mode(true);
            }

            return true;
        } catch (error) {
            console.error('Failed to connect AudioEqualizer:', error);
            this.connected = false;
            return false;
        }
    }

    /**
     * Resume audio context (required after user interaction)
     */
    async resume(): Promise<void> {
        if (this.audioContext?.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.warn('Failed to resume audio context:', e);
            }
        }
    }

    /**
     * Toggle HD Audio Mode (Cổ Phong Tuned)
     */
    setHDMode(enabled: boolean): void {
        if (!this.compressorNode || !this.audioContext) return;

        this.resume();
        this.hdEnabled = enabled;
        const now = this.audioContext.currentTime;

        if (enabled) {
            // "Audiophile Cổ Phong" Mode (High Fidelity, No Distortion)
            // Ratio 1.25: Extremely gentle compression (barely touches dynamics)
            // Threshold -30dB: Deep but gentle, bringing up low-level details
            // Attack 0.005 (5ms): Instant but smooth transient handling
            // Knee 30: Soft knee for invisible operation
            this.compressorNode.threshold.setTargetAtTime(-30, now, 0.1);
            this.compressorNode.knee.setTargetAtTime(30, now, 0.1);
            this.compressorNode.ratio.setTargetAtTime(1.25, now, 0.1);
            this.compressorNode.attack.setTargetAtTime(0.005, now, 0.1);
            this.compressorNode.release.setTargetAtTime(0.25, now, 0.1);

            // Makeup Gain: +3dB (1.4x) to compensate for gentle compression and add "presence"
            if (this.makeupGainNode) {
                this.makeupGainNode.gain.setTargetAtTime(1.4, now, 0.1);
            }
            console.log('✨ HD Audio (High-Res Mode) ON');
        } else {
            // Transparent OFF
            this.compressorNode.threshold.setTargetAtTime(0, now, 0.1);
            this.compressorNode.ratio.setTargetAtTime(1, now, 0.1);

            if (this.makeupGainNode) {
                this.makeupGainNode.gain.setTargetAtTime(1.0, now, 0.1);
            }
            console.log('✨ HD Audio OFF');
        }
        this.saveSettings();
    }

    /**
     * Toggle 432Hz Tuning Mode
     * Shifts pitch from 440Hz (standard) to 432Hz (healing frequency)
     * Uses playbackRate adjustment with tempo compensation
     */
    set432Mode(enabled: boolean): void {
        if (!this.currentAudioElement) {
            console.warn('432Hz Mode: No audio element connected');
            this.pitch432Enabled = enabled;
            return;
        }

        this.resume();
        // Strict Exclusivity: Turn off other modes if enabling this one
        if (enabled) {
            if (this.hdEnabled) this.setHDMode(false);
            if (this.autoEQEnabled) this.setAutoEQ(false);
        }

        this.pitch432Enabled = enabled;

        if (enabled) {
            // "True 432Hz" requires exact physics: 432 / 440 ≈ 0.98181818...
            // We use the exact ratio for maximum precision.
            const ratio = 432 / 440;

            // CRITICAL: Force "Analog Mode" (preservesPitch = false)
            // This treats the audio like a vinyl record/tape slowing down.
            // This is the ONLY way to change pitch without digital artifacts (phase/wobble distortion).
            const element = this.currentAudioElement as any;
            if ('preservesPitch' in element) element.preservesPitch = false;
            else if ('mozPreservesPitch' in element) element.mozPreservesPitch = false;
            else if ('webkitPreservesPitch' in element) element.webkitPreservesPitch = false;

            this.currentAudioElement.playbackRate = ratio;
            console.log(`🎵 432Hz Mode: Pure Analog Tuning (Rate: ${ratio.toFixed(6)})`);
        } else {
            // Restore Standard 440Hz
            // Re-enable pitch preservation for other speed changes (like 1.5x speed features)
            const element = this.currentAudioElement as any;
            if ('preservesPitch' in element) element.preservesPitch = true;
            else if ('mozPreservesPitch' in element) element.mozPreservesPitch = true;
            else if ('webkitPreservesPitch' in element) element.webkitPreservesPitch = true;

            this.currentAudioElement.playbackRate = 1.0;
            console.log('🎵 432Hz Mode OFF (Standard 440Hz)');
        }
        this.saveSettings();
    }

    /**
     * Get 432Hz mode status
     */
    is432ModeEnabled(): boolean {
        return this.pitch432Enabled;
    }

    /**
     * Apply a preset safely
     */
    applyPreset(presetKey: EQPresetKey): void {
        try {
            const preset = EQ_PRESETS?.[presetKey];
            if (!preset) {
                console.warn(`Unknown EQ preset: ${presetKey}`);
                return;
            }

            this.resume();
            this.currentPreset = presetKey;
            this.setGains(preset.gains);
            this.saveSettings();
            console.log(`🎛️ Applied EQ preset: ${preset.nameZh} (${preset.name})`);
        } catch (e) {
            console.error('Failed to apply EQ preset:', e);
        }
    }

    /**
     * Set individual band gains safely
     */
    setGains(gains: number[]): void {
        try {
            if (!Array.isArray(gains) || gains.length !== 5) {
                console.warn('EQ requires exactly 5 gain values');
                return;
            }

            if (!this.connected || this.filters.length === 0) {
                this.customGains = gains;
                return;
            }

            this.customGains = gains;
            const currentTime = this.audioContext?.currentTime || 0;

            this.filters.forEach((filter, index) => {
                const targetGain = gains[index] ?? 0;
                filter.gain.setTargetAtTime(targetGain, currentTime, 0.05);
            });
        } catch (e) {
            console.error('Failed to set EQ gains:', e);
        }
    }

    /**
     * Set a single band gain
     */
    setBandGain(bandIndex: number, gain: number): void {
        if (bandIndex < 0 || bandIndex >= 5) return;

        const newGains = [...this.customGains];
        newGains[bandIndex] = gain;
        this.setGains(newGains);
    }

    /**
     * Get current state
     */
    getState(): { preset: EQPresetKey; gains: number[]; connected: boolean; hdEnabled: boolean; pitch432Enabled: boolean; autoEQEnabled: boolean } {
        return {
            preset: this.currentPreset,
            gains: [...this.customGains],
            connected: this.connected,
            hdEnabled: this.hdEnabled,
            pitch432Enabled: this.pitch432Enabled,
            autoEQEnabled: this.autoEQEnabled
        };
    }

    /**
     * Toggle Auto-EQ mode (AI-based preset selection)
     */
    setAutoEQ(enabled: boolean): void {
        this.autoEQEnabled = enabled;
        this.saveSettings();
        console.log(`🤖 Auto-EQ ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Check if Auto-EQ is enabled
     */
    isAutoEQEnabled(): boolean {
        return this.autoEQEnabled;
    }

    /**
     * Save current settings to localStorage
     */
    saveSettings(): void {
        try {
            const settings = {
                preset: this.currentPreset,
                gains: this.customGains,
                hdEnabled: this.hdEnabled,
                pitch432Enabled: this.pitch432Enabled,
                autoEQEnabled: this.autoEQEnabled
            };
            localStorage.setItem(AudioEqualizer.STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save EQ settings:', e);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings(): void {
        try {
            const stored = localStorage.getItem(AudioEqualizer.STORAGE_KEY);
            if (!stored) return;

            const settings = JSON.parse(stored);

            if (settings.preset && EQ_PRESETS[settings.preset as EQPresetKey]) {
                this.currentPreset = settings.preset;
                this.setGains(EQ_PRESETS[settings.preset as EQPresetKey].gains);
            }

            if (Array.isArray(settings.gains) && settings.gains.length === 5) {
                this.customGains = settings.gains;
            }

            if (typeof settings.hdEnabled === 'boolean') {
                this.hdEnabled = settings.hdEnabled;
                if (this.hdEnabled) this.setHDMode(true);
            }

            if (typeof settings.pitch432Enabled === 'boolean') {
                this.pitch432Enabled = settings.pitch432Enabled;
                if (this.pitch432Enabled) this.set432Mode(true);
            }

            if (typeof settings.autoEQEnabled === 'boolean') {
                this.autoEQEnabled = settings.autoEQEnabled;
            }

            console.log('🎵 EQ settings loaded from storage');
        } catch (e) {
            console.warn('Failed to load EQ settings:', e);
        }
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        try {
            if (this.sourceNode) {
                this.sourceNode.disconnect();
            }
            if (this.audioContext) {
                this.audioContext.close();
            }
            this.filters = [];
            this.connected = false;
        } catch (e) {
            console.warn('Error during EQ disconnect:', e);
        }
    }
}

// Singleton export
export const audioEqualizer = new AudioEqualizer();
export default AudioEqualizer;
