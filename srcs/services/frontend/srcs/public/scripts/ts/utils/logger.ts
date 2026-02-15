
// Use global loglevel (window.log) for static hosting
// @ts-ignore
// @ts-ignore
const log = window.log;
const storedLevel = window.localStorage.getItem('logLevel') || 'silent';
log.setLevel(storedLevel);

// Test log to verify logger is working
log.debug('logger is initialized and working!');

export default log;
