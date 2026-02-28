/**
 * EventBus - Lightweight pub/sub system for kernel-internal communication
 * 
 * Design:
 * - Typed events for safety
 * - Supports multiple listeners per event
 * - Off returns unsubscribe function for cleanup
 */

type EventCallback<T = any> = (data: T) => void;

class EventBus {
    public id: string = Math.random().toString(36).substring(7);
    private listeners: Map<string, Set<EventCallback>> = new Map();

    /**
     * Subscribe to an event
     * @returns Unsubscribe function
     */
    public on<T = any>(event: string, callback: EventCallback<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     */
    public off<T = any>(event: string, callback: EventCallback<T>): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit an event to all subscribers
     */
    public emit<T = any>(event: string, data?: T): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`[EventBus] Error in listener for "${event}":`, err);
                }
            });
        }
    }

    /**
     * Remove all listeners (cleanup)
     */
    public clear(): void {
        this.listeners.clear();
    }
}

// Singleton instance for kernel
export const kernelEventBus = new EventBus();
