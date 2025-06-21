import { game_alert } from "./GameAlert";

export class Cross extends HTMLElement
{
    constructor(){
        super();
        let box: HTMLElement = document.createElement('div');
        box.classList.add('close-cross');
        this.appendChild(box)
        let line_top: HTMLElement = document.createElement('div')
        line_top.classList.add('line-cross', 'line-top');
        let line_bottom: HTMLElement = document.createElement('div')
        line_bottom.classList.add('line-cross', 'line-bottom');
        box.appendChild(line_top)
        box.appendChild(line_bottom)
        box.addEventListener('click', ()=>{
          let target_id:string = this.getAttribute("target") as string
          let target: HTMLElement = document.getElementById(target_id) as HTMLElement
          if (!target)
            target = document.querySelector(`chat-room[room_id='${target_id}']`) as HTMLElement
          if (target.classList.contains("d-none"))
            target.classList.remove("d-none");
          else
          {
            target.classList.add("d-none");
            if (target_id == "chatbox")
              game_alert?.classList.add("d-none");

          }
        })
    }

  connectedCallback() {
    
  }

  disconnectedCallback() {

  }

  attributeChangedCallback(name:string, oldValue:string, newValue:string) {
    // console.log(`Attribute ${name} has changed.`);
  }

}