import { DynamicsProfile } from '../dsp/nodes/DynamicsNode';

/**
 * IThemePreset - Definition for a sound theme
 */
export interface IThemePreset {
    id: string;
    name: string;
    description?: string;

    /** Category for UI grouping */
    category: 'basic' | 'advanced';

    /** Optional provider branding */
    provider?: 'TP_MI' | 'DOLBY' | 'MI_SOUND' | 'DTS_HPX' | 'SONY';

    /** 10-band EQ gains in dB */
    eqGains: number[];

    /** Dynamics compressor settings */
    dynamics: DynamicsProfile;

    /** Ambience (Reverb) settings */
    ambience: {
        enabled: boolean;
        type: string;
        wet: number;
        decay: number;
    };

    /** Spatial settings */
    spatial: {
        enabled: boolean;
        width: number;
        crossfeed: number;
        mode: 'stereo' | 'binaural' | 'surround';
    };

    /** Playback adjustments (for 432Hz mode) */
    playbackRate?: number;
    preservePitch?: boolean;
}
