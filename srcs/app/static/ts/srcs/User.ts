import { getUrl } from "./Urls";
import { Message_data } from "./IMessage_data";
import { moveElement, MouseMove, selectImage, getDefaultAvatar, getAvatarFromUser} from "./Avatars";
import { get_banned_for_user } from "./testApi";
import { chat_socket } from "./RegisterSockets";

export class User {
    static #rooms: { [roomId: string]: string } = {};
    static #user: string;
    static #banned_user: string[] = [];
    static #users: string[] = [];


    static #set(data: Message_data): void {
        User.#rooms[data.room_id] = data.sender
    }

    static setConnectedUsers(data: string[]): void {
      User.#users = data;
    }

    static getConnectedUsers(): string[] {
      return User.#users;
    }

    static same(data: Message_data): boolean {
        if (data.sender === User.#rooms[data.room_id])
            return true
        User.#set(data)
        return false
    }

    static async setUser() {
        try {
            let res = await fetch(getUrl("getuser/"), { method: 'GET', credentials: 'include' });
            let data = await res.json();
            User.#user = data.username;
        } catch (err) {
            console.error('User not authenticated');
        }
    }

    static async setBanned(banned:string[]){
        User.#banned_user = [];      
        banned.forEach((element :any) => {
          User.#banned_user.push(element.username)          
        }); 
    }

    static getBanned(): string[]{
      return User.#banned_user
    }

    static get(): string {
        return User.#user
    }
}


export async function get_user(): Promise<string | null>
{
    try {
        let url = getUrl("getuser/")
        const response = await fetch(getUrl("getuser/"), {method:'GET',credentials: 'include'});
        if (! response.ok)
            throw new Error('User not authenticated');
        const data = await response.json();
        return data.username;
   }
   catch (err: unknown){
        console.error(err)
        return null
   }
}

export function initUserInfo()
{
    const load_avatar:HTMLInputElement = document.getElementById("avatar") as HTMLInputElement;
    const userDetailsWrapper: HTMLElement = document.getElementById("userDetailsWrapper") as HTMLElement;
    const change_avatar_btn = document.querySelector('#change-avatar-btn') as HTMLElement;

    const avatar_preview = document.querySelector(".avatar-preview") as HTMLInputElement
    getAvatarFromUser(User.get(), avatar_preview, {height:128, width:128, size:null})
    change_avatar_btn.addEventListener("click", (e) => {
      userDetailsWrapper.classList.add("d-none")
      console.log("change avatar btn pressed")
      const old_avatar_image = document.getElementById('avatar_image') as HTMLElement;
      if (old_avatar_image)
        old_avatar_image.classList.add("d-none");
    })
    
    load_avatar.addEventListener("change", (event:Event)=>{
    const avatarCropWrapper = document.getElementById("avatarCropWrapper") as HTMLElement
    let image:HTMLElement = document.querySelector(".avatar-view") as HTMLElement
    avatarCropWrapper.classList.remove("d-none");
    if (load_avatar.files && load_avatar.files.length > 0)
    {
      let imageUrl = URL.createObjectURL(load_avatar.files[0]);
      let element = new Image();
      element.src = imageUrl;
      element.id ="loadedimage"
      
      element.onload = ()=>
      {
        let img_width = element.naturalWidth
        let img_height = element.naturalHeight

        if (img_height > img_width)
        {
          let height = avatarCropWrapper.offsetHeight * 90 / 100
          element.style.height = `${height}px`
          element.style.width = "auto"  
        }
        else
        {
          let width = avatarCropWrapper.offsetWidth * 90 / 100
          element.style.height = "auto"
          element.style.width = `${width}px`
        }

        image.innerHTML = "";
        image.appendChild(element);

              
        const crop_box: HTMLCanvasElement = document.createElement("canvas");
        crop_box.id = "crop_box"
        crop_box.width = 128;
        crop_box.height = 128;
        image.appendChild(crop_box)
        const initialRect = crop_box.getBoundingClientRect();
        MouseMove.setDistance({ x: 0, y: 0 }); 
        moveElement({
          clientX: initialRect.left,
          clientY: initialRect.top
        } as MouseEvent);
              
        crop_box.addEventListener("mousedown", (mdevent)=>{let rect = crop_box.getBoundingClientRect();
          let offsetX: number = mdevent.clientX - rect.left;
          let offsetY: number = mdevent.clientY - rect.top;
          MouseMove.setDistance({x: offsetX, y: offsetY})          
          document.addEventListener("mousemove", moveElement)
        })
      
        document.addEventListener("mouseup", (muevent)=>{             
          document.removeEventListener("mousemove", moveElement)      
        })
              
        document.addEventListener("mouseleave", (muevent)=>{
          document.removeEventListener("mousemove", moveElement)
        })

        const crop_btn: HTMLElement = document.getElementById("crop-button") as HTMLElement;

        crop_btn.addEventListener("click", function(e) {          
          selectImage(e);
          avatarCropWrapper.classList.add("d-none")
          userDetailsWrapper.classList.remove("d-none")
        });
        URL.revokeObjectURL(imageUrl)
      }
            
    }
    else
      console.log("fail choosing a file")
  })       
}

export async function setRemoteAvatar(blob_image:Blob) {
  let formdata = new FormData()
  let url = getUrl("accounts/update/")
  formdata.append("avatar", blob_image, `${User.get()}_avatar.png`)

  let csrfToken: string = (document.querySelector("input[name='csrfmiddlewaretoken']") as HTMLInputElement).value 
  try
  {
    let res = await fetch(url,
      {
          method: "POST",
          headers: {
              "X-CSRFToken": csrfToken
          },
          credentials: "include",
          body: formdata
      })
    if (!res.ok)
        return;
    let data = await res.json()
    console.log(data)
    chat_socket.send(JSON.stringify({action:"account_update", user: User.get()}))  

  }
  catch(err)
  {
    console.error(err)
  } 
}



export async function updateUser()
{
  let url = getUrl("accounts/update/")
  const pseudofield = document.getElementById("pseudo") as HTMLInputElement
  const avatar_img = document.getElementById("avatar_image") as HTMLImageElement

  let avatar = "default"
  let blob : Blob | null = null;  
  let formdata = new FormData()
  if (pseudofield && pseudofield.value != "") {
    formdata.append("pseudo", pseudofield.value)
  }
  if (avatar_img)
  {
    blob = await (await fetch(avatar_img.src)).blob();
    if (blob)
      formdata.append("avatar", blob, `${User.get()}_avatar.png`)

  }
  
  let csrfToken: string = (document.querySelector("input[name='csrfmiddlewaretoken']") as HTMLInputElement).value 
      fetch(url,
          {
              method: "POST",
              headers: {
                  "X-CSRFToken": csrfToken
              },
              credentials: "include",
              body: formdata
          }).then(res =>
            {
              res.json();
              chat_socket.send(JSON.stringify({action:"account_update", user: User.get()}))  
            } 
        
        )         
          .catch(err => console.error(err))
}