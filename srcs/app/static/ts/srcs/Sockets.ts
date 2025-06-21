import { Message_data } from "./IMessage_data";

export const wsProtocol:string = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

function default_logger(msg:Message_data):void
{
    // console.log(msg.message)
}

export function initSocket(
    endpoint:string, 
    handle: (msg: Message_data) => void = default_logger
): WebSocket {    
    const sock: WebSocket = new WebSocket(wsProtocol + '//' + window.location.host + endpoint, []);
    sock.onerror = function(error) {
        console.error('Erreur WebSocket:', error);
    };
    sock.onopen = () => console.log("✅ Connected on websocket", endpoint, " !!!!")
    sock.onmessage = (msg: MessageEvent) =>{
    let data: Message_data = JSON.parse(msg.data as string)
        handle(data)
    }
    return sock
}
