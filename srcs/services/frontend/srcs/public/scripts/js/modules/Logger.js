/**
 * Debug logger utility.
 * All console output is silenced by default.
 * Enable with: ?debug in URL, or window.__DEBUG__ = true in browser console.
 */
function isDebugEnabled() {
    if (typeof window !== 'undefined') {
        if (window.__DEBUG__)
            return true;
        if (window.location?.search?.includes('debug'))
            return true;
    }
    return false;
}
export const Logger = {
    log(...args) {
        if (isDebugEnabled())
            console.info('[LOG]', ...args);
    },
    warn(...args) {
        if (isDebugEnabled())
            console.info('[APP]', ...args);
    },
    error(...args) {
        if (isDebugEnabled())
            console.info('[APP]', ...args);
    },
    debug(...args) {
        if (isDebugEnabled())
            console.info('[DEBUG]', ...args);
    },
    info(...args) {
        if (isDebugEnabled())
            console.info('[APP]', ...args);
    }
};
