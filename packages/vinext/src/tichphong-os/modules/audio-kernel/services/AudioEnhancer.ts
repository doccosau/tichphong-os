/**
 * AudioEnhancer - Advanced Audio Processing Features
 * 
 * Includes:
 * - 432Hz Mode (Healing frequency)
 * - Audio Normalization
 * - Crossfade settings
 * - Gapless playback config
 */
import { kernelEventBus } from '../core/EventBus';

export interface EnhancerSettings {
    is432HzEnabled: boolean;
    normalizationEnabled: boolean;
    normalizationTarget: number;  // dB, typically -14 LUFS
    crossfadeDuration: number;    // ms
    gaplessEnabled: boolean;
    preloadNext: boolean;
}

/**
 * 432Hz Mode Explanation:
 * 
 * Standard tuning: A4 = 440 Hz
 * 432Hz tuning: A4 = 432 Hz
 * 
 * Ratio: 432/440 = 0.98181818...
 * 
 * To convert 440Hz audio to 432Hz, we slow down playback by this ratio.
 * The pitch drops by ~32 cents (about 1/3 of a semitone).
 */
export const FREQUENCY_RATIO_432 = 432 / 440;  // ≈ 0.9818

export class AudioEnhancer {
    private settings: EnhancerSettings;
    private onPlaybackRateChange?: (rate: number) => void;

    constructor() {
        this.settings = {
            is432HzEnabled: false,
            normalizationEnabled: false,
            normalizationTarget: -14,
            crossfadeDuration: 0,
            gaplessEnabled: true,
            preloadNext: true
        };

        console.log('🔧 [AudioEnhancer] Initialized');
    }

    /**
     * Register callback for playback rate changes
     */
    public onRateChange(callback: (rate: number) => void): void {
        this.onPlaybackRateChange = callback;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 432Hz MODE
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enable/disable 432Hz healing frequency mode
     */
    public set432HzEnabled(enabled: boolean): void {
        this.settings.is432HzEnabled = enabled;

        const rate = enabled ? FREQUENCY_RATIO_432 : 1.0;

        if (this.onPlaybackRateChange) {
            this.onPlaybackRateChange(rate);
        }

        kernelEventBus.emit('enhancer:432HzChanged', { enabled, rate });
        console.log(`🎵 [AudioEnhancer] 432Hz Mode: ${enabled ? 'ON' : 'OFF'} (rate: ${rate.toFixed(4)})`);
    }

    public is432HzEnabled(): boolean {
        return this.settings.is432HzEnabled;
    }

    public get432HzRate(): number {
        return this.settings.is432HzEnabled ? FREQUENCY_RATIO_432 : 1.0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // NORMALIZATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enable/disable audio normalization
     * 
     * When enabled, tracks are played at consistent perceived loudness.
     * Requires ReplayGain or similar metadata.
     */
    public setNormalizationEnabled(enabled: boolean): void {
        this.settings.normalizationEnabled = enabled;
        kernelEventBus.emit('enhancer:normalizationChanged', enabled);
        console.log(`📊 [AudioEnhancer] Normalization: ${enabled ? 'ON' : 'OFF'}`);
    }

    public setNormalizationTarget(dbLufs: number): void {
        this.settings.normalizationTarget = dbLufs;
        kernelEventBus.emit('enhancer:normalizationTargetChanged', dbLufs);
    }

    /**
     * Calculate gain adjustment for a track
     * 
     * @param trackLoudness - The track's integrated loudness in LUFS
     * @returns Gain multiplier to apply
     */
    public calculateNormalizationGain(trackLoudness: number): number {
        if (!this.settings.normalizationEnabled) return 1.0;

        const targetLufs = this.settings.normalizationTarget;
        const diff = targetLufs - trackLoudness;

        // Convert dB difference to linear gain
        return Math.pow(10, diff / 20);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CROSSFADE
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Set crossfade duration in milliseconds
     */
    public setCrossfadeDuration(ms: number): void {
        this.settings.crossfadeDuration = Math.max(0, Math.min(12000, ms));
        kernelEventBus.emit('enhancer:crossfadeChanged', this.settings.crossfadeDuration);
        console.log(`🔀 [AudioEnhancer] Crossfade: ${this.settings.crossfadeDuration}ms`);
    }

    public getCrossfadeDuration(): number {
        return this.settings.crossfadeDuration;
    }

    public isCrossfadeEnabled(): boolean {
        return this.settings.crossfadeDuration > 0;
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAPLESS PLAYBACK
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Enable/disable gapless playback
     * 
     * When enabled, the next track is preloaded and starts immediately
     * when the current track ends (no silence gap).
     */
    public setGaplessEnabled(enabled: boolean): void {
        this.settings.gaplessEnabled = enabled;
        kernelEventBus.emit('enhancer:gaplessChanged', enabled);
        console.log(`🔗 [AudioEnhancer] Gapless: ${enabled ? 'ON' : 'OFF'}`);
    }

    public isGaplessEnabled(): boolean {
        return this.settings.gaplessEnabled;
    }

    /**
     * Enable/disable preloading next track
     */
    public setPreloadNextEnabled(enabled: boolean): void {
        this.settings.preloadNext = enabled;
        kernelEventBus.emit('enhancer:preloadChanged', enabled);
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════

    public getSettings(): EnhancerSettings {
        return { ...this.settings };
    }

    public applySettings(settings: Partial<EnhancerSettings>): void {
        if (settings.is432HzEnabled !== undefined) {
            this.set432HzEnabled(settings.is432HzEnabled);
        }
        if (settings.normalizationEnabled !== undefined) {
            this.setNormalizationEnabled(settings.normalizationEnabled);
        }
        if (settings.normalizationTarget !== undefined) {
            this.setNormalizationTarget(settings.normalizationTarget);
        }
        if (settings.crossfadeDuration !== undefined) {
            this.setCrossfadeDuration(settings.crossfadeDuration);
        }
        if (settings.gaplessEnabled !== undefined) {
            this.setGaplessEnabled(settings.gaplessEnabled);
        }
        if (settings.preloadNext !== undefined) {
            this.setPreloadNextEnabled(settings.preloadNext);
        }
    }
}
