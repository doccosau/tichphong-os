import { ICapabilityDetector, DriverCapabilities } from './interfaces';

export class CapabilityDetector implements ICapabilityDetector {
    public detect(): DriverCapabilities {
        const hasAudioContext = typeof window !== 'undefined' &&
            (!!window.AudioContext || !!(window as any).webkitAudioContext);

        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        // Simple heuristic for latency
        let latency: 'low' | 'balanced' | 'high' = 'balanced';
        if (isMobile) latency = 'high';
        // Force low latency for desktops if context says so? Only retrievable after context creation.

        return {
            dspSupported: hasAudioContext,
            latencyProfile: latency,
            isMobile: isMobile,
            streamingOptimized: true // HTML5 Audio is generally streaming optimized
        };
    }
}
