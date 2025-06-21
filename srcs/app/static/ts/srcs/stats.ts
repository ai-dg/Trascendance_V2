import { User } from "../srcs/User";
import { close_windows, notification_message } from "../srcs/uitools";
import { loadPlayerStatistics, loadPlayerHistory } from "../app";


export function get_user_stats(event:Event)
{
    const el : HTMLElement = event.target as HTMLElement
    const username : String = el.getAttribute("username") as String;
    
    let target: HTMLElement = document.getElementById("BestScoreWrapper") as HTMLElement
    if (target.classList.contains("d-none"))
    {
        close_windows();
        (async () => {
            console.log("Loading stats for " + username);
            loadPlayerStatistics(username);
            loadPlayerHistory(username);
        })();
        target.classList.remove("d-none");
        let titlebestscore : HTMLElement = document.getElementById("bestScoreTitle") as HTMLElement;
        titlebestscore.innerText = "Best Score of " + username;
    }
}