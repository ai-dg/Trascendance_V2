/**
 * Debug logger utility.
 * All console output is silenced by default.
 * Enable with: ?debug in URL, or window.__DEBUG__ = true in browser console.
 */

declare global {
    interface Window {
        __DEBUG__: boolean;
    }
}

function isDebugEnabled(): boolean {
    if (typeof window !== 'undefined') {
        if (window.__DEBUG__) return true;
        if (window.location?.search?.includes('debug')) return true;
    }
    return false;
}

export const Logger = {
    log(...args: any[]) {
        if (isDebugEnabled()) console.log(...args);
    },
    warn(...args: any[]) {
        if (isDebugEnabled()) console.warn(...args);
    },
    error(...args: any[]) {
        if (isDebugEnabled()) console.error(...args);
    },
    debug(...args: any[]) {
        if (isDebugEnabled()) console.debug(...args);
    },
    info(...args: any[]) {
        if (isDebugEnabled()) console.info(...args);
    }
};
