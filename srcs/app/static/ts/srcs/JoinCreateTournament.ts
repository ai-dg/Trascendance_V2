import { initSocket } from "./Sockets";
import { User } from "./User";
import { display_game_message, display_game_stats } from "./GameNotifications";

let tournament_socket_is_ready = false
const active_tournaments: Record<string, WebSocket> = {};
export let tournament_socket_outside : WebSocket | null = null;


 export async function play_tournament(params:any){
    console.warn('TRACKING tournament_uid in params PLAY_TOURNAMENT : ', params.tournament_uid);
    let tournaments_socket_id: WebSocket | null = null;
    if (active_tournaments[params.tournament_uid])
    {
        tournaments_socket_id = active_tournaments[params.tournament_uid]
        tournament_socket_outside = tournaments_socket_id
        console.log("✅ Tournament WebSocket connected --- TOURNAMENT SOCKET ALREADY EXISTS - NO SOCKET IS CREATED")
    }
    else
    {
        tournaments_socket_id = initSocket(`/ws/pong/tournament/${params.tournament_uid}`);
        tournaments_socket_id.onopen = () => {
            console.log("✅ Tournament WebSocket connected!");
            tournament_socket_is_ready = true;           
        };
        tournaments_socket_id.onmessage = (event: MessageEvent) => run_tournament(event, tournaments_socket_id!);
        tournaments_socket_id.onerror = (event: Event) => console.log("❌ WebSocket error:", event);
        tournaments_socket_id.onclose = () => {
            console.log("🔴 Tournament WebSocket disconnected!");
            tournament_socket_is_ready = false;
            delete active_tournaments[params.tournament_uid]
            tournament_socket_outside = null;
        }
    } 
}


export function handle_tournament_end(data:any, tournaments_socket_id:WebSocket)
{
    let user = User.get();
    if (data.status == "end_game" ||   data.status == "tournament_over")
    {       
        if ((window as any).game_instance)
        {
            (window as any).game_instance.stop();
            (window as any).game_instance = null;} 

        if (data.status == "end_game")
        {
            let player1 = data.player1.name;
            let player2 = data.player2.name;
            if (data.winner === user && (data.winner === player1 || data.winner === player2))
                display_game_message("You win the game ! Please wait for your opponent")
            else if (data.winner != user && (user === player1 || user === player2))
                display_game_message(`Game Over, ${data.winner} win the game !`);
        }
        if (data.status == "tournament_over")
        {
            console.log("IN TOURNAMENT FUCKING CONDITIONNNNNN !!!!!");
            if (data.winner === user)
                display_game_message("You win the tournament !")
            else
                display_game_message(`Game Over, ${data.winner} win the tournament !`)
            setTimeout(()=>{
                tournaments_socket_id.close(1000)
                display_game_stats(data.stats)
            },10000)
        }
    }
}


export function run_tournament(event:MessageEvent, tournaments_socket_id:WebSocket)
{
    const data = JSON.parse(event.data)
    console.log("TOURNAMENT socket :");
    console.log(data);
    if (data.status)
        console.log("status", data.status)
  
    if (data.status == "end_game" || data.status == "tournament_over")
        handle_tournament_end(data, tournaments_socket_id);        
} 



