import { Alert } from "./Alert";
import { Avatar } from "./Avatars";
import { ChatMessage } from "./ChatMessage";
import { Cross } from "./Cross";
import { MessageOptions } from "./MessageOptions";
import { Room } from "./Room";
import { Fold } from "./FoldElement";


export function registerElements(): void
{
    customElements.define('fold-element', Fold);
    customElements.define('cross-element', Cross);
    customElements.define('chat-room', Room);
    customElements.define('message-options', MessageOptions);
    customElements.define('chat-message', ChatMessage);
    customElements.define('alert-box', Alert);
    customElements.define('avatar-element', Avatar);
}


