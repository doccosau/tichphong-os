/**
 * Kernel Logger - Production-safe logging for TPAudioKernel
 * 
 * In production: Only errors and warnings are logged.
 * In development: All logs are shown with module tags.
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class KernelLogger {
    private module: string;

    constructor(module: string) {
        this.module = module;
    }

    /** Debug log — dev only */
    debug(...args: unknown[]): void {
        if (isDev) console.log(`[${this.module}]`, ...args);
    }

    /** Info log — dev only */
    info(...args: unknown[]): void {
        if (isDev) console.log(`[${this.module}]`, ...args);
    }

    /** Warning — always shows */
    warn(...args: unknown[]): void {
        console.warn(`⚠️ [${this.module}]`, ...args);
    }

    /** Error — always shows */
    error(...args: unknown[]): void {
        console.error(`❌ [${this.module}]`, ...args);
    }
}

/**
 * Create a scoped logger for a kernel module.
 * 
 * @example
 * const log = createLogger('PlaybackManager');
 * log.info('Track loaded'); // Only in dev
 * log.error('Failed to load'); // Always
 */
export function createLogger(module: string): KernelLogger {
    return new KernelLogger(module);
}

export default KernelLogger;
