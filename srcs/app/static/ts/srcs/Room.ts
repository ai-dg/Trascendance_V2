export class Room extends HTMLElement{
    
    id: string = ""
    invited : string[] = []
    roomname : HTMLElement = document.createElement('div');

    constructor()
    {
        super()
        let title: string = this.getAttribute("room_name") as string;

        this.roomname.classList.add("room_name");
        if (title.length != 0)
            this.roomname.innerHTML +=title
        this.appendChild(this.roomname)
        let chatmessages = document.createElement('div');
        this.id = this.getAttribute("room_id") as string;
        this.roomname.innerHTML += `<cross-element target="${this.id}"></cross-element>`
        chatmessages.classList.add('chatmessages');
        chatmessages.id = 'chat_' + this.id;
        this.appendChild(chatmessages);
    }

    static get observedAttributes() {
        return ['room_id', 'id'];
    }

    connectedCallback(): void
    {       
    
    }

    attributeChangedCallback(name:string, oldValue: string, newValue: string): void
    {

    }

    disconnectedCallback(): void
    {
        // console.log("Disconnected room")
    }

    invite_user(user: string): void
    {
        this.invited.push(user)
    }

    remove_user(user: string): void
    {
        
    }
}