import {getCookieJSONValue, setCookieJSONValue} from "./Cookies";

export const smileys: Array<string> = [
    "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
    "😋", "😎", "😍", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩",
    "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
    "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯",
    "😳", "🥵", "🥶", "😶", "😐", "😑", "😬", "🙄", "🤥", "😌",
    "😔", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😵",
    "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😰", "😨", "😱", "😖",
    "😤", "😬", "🤯", "🥴", "🤩", "🤪", "😵", "🤡", "🥸", "💀",
    "👻", "😈", "👿", "🤠", "👽", "👾", "🤖", "🎃", "🎲"
];

export const RECENT_EMOJIS : string= "recentEmojis"

export const emojiShortcuts: Record<string, string> = {
    ":grinning:": "😀",
    ":grin:": "😁",
    ":joy:": "😂",
    ":rofl:": "🤣",
    ":smiley:": "😃",
    ":smile:": "😄",
    ":sweat_smile:": "😅",
    ":laughing:": "😆",
    ":wink:": "😉",
    ":blush:": "😊",
    ":yum:": "😋",
    ":sunglasses:": "😎",
    ":heart_eyes:": "😍",
    ":kissing_heart:": "😘",
    ":kissing:": "😗",
    ":kissing_smiling_eyes:": "😙",
    ":kissing_closed_eyes:": "😚",
    ":slight_smile:": "🙂",
    ":hugs:": "🤗",
    ":star_struck:": "🤩",
    ":smirk:": "😏",
    ":unamused:": "😒",
    ":disappointed:": "😞",
    ":pensive:": "😔",
    ":worried:": "😟",
    ":confused:": "😕",
    ":slight_frown:": "🙁",
    ":frowning:": "☹️",
    ":persevere:": "😣",
    ":confounded:": "😖",
    ":tired_face:": "😫",
    ":weary:": "😩",
    ":pleading_face:": "🥺",
    ":cry:": "😢",
    ":sob:": "😭",
    ":angry:": "😠",
    ":rage:": "😡",
    ":face_with_symbols_over_mouth:": "🤬",
    ":exploding_head:": "🤯",
    ":flushed:": "😳",
    ":hot_face:": "🥵",
    ":cold_face:": "🥶",
    ":no_mouth:": "😶",
    ":neutral_face:": "😐",
    ":expressionless:": "😑",
    ":grimacing:": "😬",
    ":roll_eyes:": "🙄",
    ":lying_face:": "🤥",
    ":relieved:": "😌",
    ":drooling_face:": "🤤",
    ":sleeping:": "😴",
    ":mask:": "😷",
    ":face_with_thermometer:": "🤒",
    ":face_with_head_bandage:": "🤕",
    ":nauseated_face:": "🤢",
    ":face_vomiting:": "🤮",
    ":sneezing_face:": "🤧",
    ":dizzy_face:": "😵",
    ":cowboy:": "🤠",
    ":partying_face:": "🥳",
    ":nerd_face:": "🤓",
    ":monocle_face:": "🧐",
    ":fearful:": "😨",
    ":scream:": "😱",
    ":clown:": "🤡",
    ":woozy_face:": "🥴",
    ":zany_face:": "🤪",
    ":robot:": "🤖",
    ":skull:": "💀",
    ":ghost:": "👻",
    ":smiling_imp:": "😈",
    ":imp:": "👿",
    ":alien:": "👽",
    ":space_invader:": "👾",
    ":jack_o_lantern:": "🎃"
};

export function emojisHandler()
{
    let selector: HTMLElement | null = document.querySelector(".emojiselector")
    let emojiwrapper: HTMLElement | null = document.querySelector(".emojiwrapper")
    if (selector)
        selector.addEventListener("click", (e)=>{
        if (emojiwrapper)
            emojiwrapper.style.display="flex";
        else
            console.error("emojisHandler : element with classname emojiwrapper not found");
        selector.addEventListener("mouseover", (e)=>{
            let len = smileys.length
            let index = Math.floor(Math.random() * len);
            selector.innerHTML = smileys[index]
        })
    })
    else
        console.error("emojisHandler : element with classname emojiselector not found");
    if (emojiwrapper)
        emojiwrapper.addEventListener("mouseleave", (e)=>{
        emojiwrapper.style.display="none"
    })
    else
        console.error("emojisHandler : element with classname emojiwrapper not found");
}

function updateRecentEmojis(){
    let element: HTMLElement | null = document.querySelector(".recentEmojis");
    if (element)
    {
        element.innerHTML = ""
        let smileySet: Array<string> = getRecentEmojis()
        smileySet.forEach((smiley:string) => addEmoji(smiley, element));
    }
    else 
        console.error("updateRecentEmojis : element with classname recentEmojis not found");
}

function addEmoji(emoji:string, element: HTMLElement){
    let emo: HTMLElement = document.createElement("div"); 
    emo.classList.add("emoji")
    emo.innerHTML = emoji
    element.appendChild(emo)
    emo.addEventListener('click',(e:Event)=>{
        let chat_txt : HTMLInputElement | null = document.getElementById('chat_text') as HTMLInputElement
        if (chat_txt)
        {
            let target = e.target as HTMLElement | null;
            if (target)
            {
                let emoji:string = target.innerHTML
                chat_txt.value += emoji
                setRecentEmojis(emoji)
                updateRecentEmojis();
            }
        }
    })
}

export function initEmojis()
{
    let wrapper = document.createElement("div");    
    wrapper.classList.add("emojiwrapper");
    wrapper.style.display = "none"
    let chatwrapper : HTMLElement = document.querySelector(".chatwrapper") as HTMLElement
    chatwrapper.appendChild(wrapper)
    let allEmojis = document.createElement("div");    
    allEmojis.classList.add("allEmojis");
    let recentEmojisWrapper = document.createElement("div")
    recentEmojisWrapper.classList.add("recentEmojis");  
    setEmojisElements(getRecentEmojis(), recentEmojisWrapper)
    setEmojisElements(smileys, allEmojis)
    emojisHandler()
}

function setEmojisElements(smileySet: Array<string>, element: HTMLElement): void
{
    let emojiWrapper: HTMLElement = document.querySelector(".emojiwrapper") as HTMLElement
    emojiWrapper.appendChild(element)
    smileySet.forEach((smiley : string) => addEmoji(smiley, element));
}

function setRecentEmojis(emoji: string): void
{
    setCookieJSONValue(RECENT_EMOJIS, emoji, {length: 8});
}

function getRecentEmojis(): Array<string>
{
    return getCookieJSONValue(RECENT_EMOJIS);
}