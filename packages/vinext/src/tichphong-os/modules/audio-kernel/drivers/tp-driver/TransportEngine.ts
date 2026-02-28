import { ITransportEngine } from './interfaces';
import { kernelEventBus } from '../../core/EventBus';

export class TransportEngine implements ITransportEngine {
    private audioEl: HTMLAudioElement;
    private _loop: boolean = false;
    private _preservePitch: boolean = true;
    private currentSrc: string | null = null;
    private enableCORS: boolean = false;

    constructor(enableCORS: boolean = false) {
        this.enableCORS = enableCORS;
        this.audioEl = new Audio();
        this.configureElement();
        this.setupEventListeners();
    }

    private configureElement(): void {
        this.audioEl.preload = 'auto';
        // HTML5 Audio specific settings
        this.updateCORS();
    }

    public updateCORS(enable: boolean = this.enableCORS): void {
        this.enableCORS = enable;

        // H5 FIX: Do not set crossOrigin for Blob URLs (local cache)
        // Setting it might cause the browser to treat it as opaque or tainted for Web Audio
        const isBlob = this.currentSrc?.startsWith('blob:');

        if (this.enableCORS && !isBlob) {
            this.audioEl.crossOrigin = 'anonymous';
        } else {
            this.audioEl.removeAttribute('crossOrigin');
        }
    }

    private setupEventListeners(): void {
        const el = this.audioEl;

        el.addEventListener('loadedmetadata', () => {
            console.log('💿 [Transport] Metadata loaded. Duration:', el.duration);
            kernelEventBus.emit('driver:loaded', {
                duration: el.duration,
                src: this.currentSrc
            });
        });

        el.addEventListener('durationchange', () => {
            console.log('⏱️ [Transport] Duration updated:', el.duration);
            kernelEventBus.emit('driver:durationchange', { duration: el.duration });
        });

        el.addEventListener('play', () => {
            kernelEventBus.emit('driver:playing');
        });

        el.addEventListener('pause', () => {
            if (!el.seeking && !el.ended) {
                kernelEventBus.emit('driver:paused');
            }
        });

        el.addEventListener('ended', () => {
            if (this._loop) {
                console.log('🔄 [Transport] Looping (Native)');
                el.currentTime = 0;
                el.play().catch(e => console.error('Loop Play Error:', e));
            } else {
                console.log('🏁 [Transport] Ended');
                kernelEventBus.emit('driver:ended');
            }
        });

        el.addEventListener('error', (e) => {
            console.error('❌ [Transport] Error:', el.error, e);
            kernelEventBus.emit('driver:error', el.error);
        });

        el.addEventListener('seeking', () => kernelEventBus.emit('driver:seeking'));
        el.addEventListener('seeked', () => kernelEventBus.emit('driver:seeked'));
        el.addEventListener('waiting', () => kernelEventBus.emit('driver:waiting'));
        el.addEventListener('stalled', () => kernelEventBus.emit('driver:stalled'));
        el.addEventListener('canplay', () => kernelEventBus.emit('driver:canplay'));
        el.addEventListener('timeupdate', () => {
            kernelEventBus.emit('driver:timeupdate', { currentTime: el.currentTime });
        });
    }

    public async load(src: string): Promise<void> {
        this.stop();
        this.currentSrc = src;

        // Reset
        this.audioEl.src = '';
        // Re-evaluate CORS based on new src
        this.updateCORS();

        // H5 FIX: Cache Busting for CORS
        // If we previously loaded this without CORS (e.g. preload or safe mode),
        // the browser has a "poisoned" opaque response in cache.
        // We must force a fresh request if CORS is enabled.
        let finalSrc = src;
        const isBlob = src.startsWith('blob:');

        if (this.enableCORS && !isBlob) {
            if (!src.includes('?')) {
                finalSrc = `${src}?cb=${Date.now()}`;
            } else {
                finalSrc = `${src}&cb=${Date.now()}`;
            }
        }

        this.audioEl.src = finalSrc;
        this.audioEl.load();

        return new Promise((resolve, reject) => {
            // Resolution logic same as before...
            if (this.audioEl.readyState >= 3) { // HAVE_FUTURE_DATA
                resolve();
                return;
            }

            const onCanPlay = () => {
                console.log('✅ [Transport] canplay event received. Resolving load promise.');
                cleanup();
                resolve();
            };
            const onError = () => {
                cleanup();
                const err = this.audioEl.error;
                console.error('❌ [Transport] Error during load:', err);
                reject(new Error(`Transport Load Error: ${err ? err.code + ' - ' + err.message : 'Unknown'}`));
            };
            const cleanup = () => {
                this.audioEl.removeEventListener('canplaythrough', onCanPlay); // Wait for through
                this.audioEl.removeEventListener('canplay', onCanPlay);
                this.audioEl.removeEventListener('error', onError);
                if (timeoutId) clearTimeout(timeoutId);
            };

            this.audioEl.addEventListener('canplay', onCanPlay);
            this.audioEl.addEventListener('error', onError);

            // Timeout safety (10s)
            const timeoutId = setTimeout(() => {
                console.warn('⚠️ [Transport] Load timeout (10s). Resolving anyway to prevent hang.');
                cleanup();
                resolve();
            }, 10000);
        });
    }

    public preload(src: string): void {
        if (!src) return;
        // H5 FIX: Match the CORS mode of the driver to avoid cache poisoning
        const mode = this.enableCORS ? 'cors' : 'no-cors';
        fetch(src, { mode, priority: 'low' } as RequestInit).catch(() => {
            // Ignore errors for preloading
        });
    }

    public async play(): Promise<void> {
        try {
            console.log(`▶️ [Transport] Calling native play(). ReadyState: ${this.audioEl.readyState}, Paused: ${this.audioEl.paused}, CurrentTime: ${this.audioEl.currentTime}`);
            const promise = this.audioEl.play();
            if (promise !== undefined) {
                await promise;
                console.log('✅ [Transport] Native play() resolved successfully');
            } else {
                console.log('⚠️ [Transport] Native play() returned undefined (older browser?)');
            }
        } catch (error) {
            console.error('❌ [Transport] Native play() rejected:', error);
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                console.warn('⚠️ [Transport] User Interaction Required (Autoplay Policy)');
            }
            throw error;
        }
    }

    public pause(): void {
        this.audioEl.pause();
    }

    public stop(): void {
        this.pause();
        this.audioEl.currentTime = 0;
    }

    public seek(time: number): void {
        if (Number.isFinite(time)) {
            this.audioEl.currentTime = time;
        }
    }

    public setVolume(volume: number): void {
        this.audioEl.volume = Math.max(0, Math.min(1, volume));
    }

    public setLoop(loop: boolean): void {
        this._loop = loop;
        this.audioEl.loop = loop;
    }

    public setPlaybackRate(rate: number): void {
        this.audioEl.playbackRate = rate;
    }

    public setPreservePitch(preserve: boolean): void {
        this._preservePitch = preserve;
        if ('preservesPitch' in this.audioEl) {
            // @ts-ignore
            this.audioEl.preservesPitch = preserve;
        } else if ('mozPreservesPitch' in this.audioEl) {
            // @ts-ignore
            this.audioEl.mozPreservesPitch = preserve;
        } else if ('webkitPreservesPitch' in this.audioEl) {
            // @ts-ignore
            this.audioEl.webkitPreservesPitch = preserve;
        }
    }

    public getElement(): HTMLAudioElement {
        return this.audioEl;
    }

    public getDuration(): number {
        return this.audioEl.duration || 0;
    }

    public dispose(): void {
        this.stop();
        this.audioEl.src = '';
        this.audioEl.load();
        // Event listeners are on the element, if we abandon the element they are GC'd with it unless we held refs.
        // Since we created the element, it's fine.
    }
}
