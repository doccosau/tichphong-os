/**
 * Audio Kernel — Module Manifest
 * Constitution §6: Subsystem Architecture Standard
 */
import type { ModuleManifest } from '../..//core/types';

export const audioKernelManifest: ModuleManifest = {
    id: 'audio-kernel',
    name: 'Audio Subsystem',
    version: '2.0.0',
    description: 'Zero-latency audio playback engine with DSP, spatial audio, and theme support.',
    author: 'TichPhong Team',
    type: 'custom',

    // Constitution §3: Authority = Client (AudioContext)
    routes: [],
    adminPages: [],

    onEnable: () => {
        console.log('[Audio Kernel] Enabled');
    },
    onDisable: () => {
        console.log('[Audio Kernel] Disabled');
    },
};

export default audioKernelManifest;
