export function getBaseUrl() {
    const element = document.querySelector("meta[name='api-base-url']");
    const baseUrl = element?.getAttribute('content') ?? '';
    return baseUrl;
}
export function getUrl(endpoint) {
    if (endpoint[0] != '/')
        endpoint = '/' + endpoint;
    return window.location.protocol + '//' + getBaseUrl() + endpoint;
}
function getWebSocketProtocol() {
    return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
}
export function getWebSocketUrl(path) {
    if (path[0] !== '/')
        path = '/' + path;
    return getWebSocketProtocol() + '//' + getBaseUrl() + path;
}
