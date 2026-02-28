export { audioKernel } from './core/Kernel';
export { kernelEventBus } from './core/EventBus';
export { KernelStatus } from './core/LifecycleManager';
export type { KernelState, DSPState, SyncState, ThemeState, UserAudioPreference } from './core/StateManager';

// Default export for convenience
import { audioKernel } from './core/Kernel';
export default audioKernel;
