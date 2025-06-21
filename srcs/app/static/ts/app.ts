import { Game } from "./srcs/Game";
import { initChatRoom} from "./srcs/Chat";
import { User } from "./srcs/User";
import { initUserInfo, updateUser } from "./srcs/User";
import { registerElements } from "./srcs/RegisterElemets";
import { socket_game } from "./srcs/RegisterSockets"
import { update_game_lobby, play, update_lobbies, update_tournament_lobby, update_tournament_display, unset_game_listeners, game_socket_outside} from "./srcs/JoinCreateGame";
import { cancel_timeout, display_game_message } from "./srcs/GameNotifications";
import { close_windows, color_canvas, count_child_nodes, hide_pill, notification_message, PILLS, show_pill } from "./srcs/uitools";
import { play_tournament, tournament_socket_outside, handle_tournament_end } from "./srcs/JoinCreateTournament";
import { remove_game } from "./srcs/JoinCreateGame";
import { default_map, invited_map, invited_inverted_map } from "./srcs/key_map";
import { getCSRFToken } from "./srcs/Security";
import { formatDate } from "./srcs/Date";
import { cancel_countdown } from "./srcs/JoinCreateGame";
import { game_alert } from "./srcs/GameAlert";
import { update_game_alert } from "./srcs/Chat";


registerElements();


let status: boolean = false; // not used yet...
let data_game: any = null;
(window as any).gameInstance = null;
let lastUpdate: number = Date.now();
export let isSocketReady: boolean = false;

const join_tournament_list : HTMLElement = document.getElementById("tournament_list") as HTMLElement;
const join_game_list : HTMLElement = document.getElementById("joingame_list") as HTMLElement;

/// a chaque chargement de page
/// a chaque remove

export function updatePills()
{
  let avail_tournaments: number = count_child_nodes(join_tournament_list)
  let avail_games: number = count_child_nodes(join_game_list)
  let all:number = avail_tournaments + avail_games
  if (avail_tournaments)
    show_pill(PILLS.TOURNAMENTS, avail_tournaments);
  else
    hide_pill(PILLS.TOURNAMENTS);
  if (avail_games)
    show_pill(PILLS.GAMES, avail_games);
  else
    hide_pill(PILLS.GAMES);
  if (all)
    show_pill(PILLS.ALLGAMES, all);
  else
    hide_pill(PILLS.ALLGAMES);


}

socket_game.onopen = () => {
    console.log("✅ [app.ts] WebSocket (Game) connected!");
    isSocketReady = true;
};

let GAMES: any = [];
let TOURNAMENTS: any = [];
let MY_GAMES: any = [];

let player_statistics: any = {
  total_games_played: 0,
  total_games_wons: 0,
  total_points_scored: 0,
  total_points_conceded: 0,
  total_tournaments_played: 0,
  total_tournaments_won: 0,
}


socket_game.onmessage = (event: MessageEvent) => {
  let now: number = Date.now();
  let response  = JSON.parse(event.data);
  console.log(`socket GAME_LOBBY data receive : ${event.data}`);


  if (response.status==="disconnect")
  {
    if ((window as any).gameInstance)
    {
      (window as any).gameInstance.stop();
        (window as any).gameInstance = null
    }
    cancel_countdown()
    unset_game_listeners()
    /*
    if (game_socket_outside)
      game_socket_outside.close(1000)*/

    display_game_message(`Your opponent leaved the game ! Please wait !`)
  }

  if (response.status==="game_paused")
      update_game_alert("A neu game is ready ! Please join the arena")

  if (response.status === "init_lobby"){
    update_lobbies(response);
    updatePills()
  }


  if (response.status === "game_created") {
    if (!game_socket_outside)
      display_game_message("A new game is available") 
    update_game_lobby([response], true)
    updatePills()

  }
  if (response.status === "tournament_created") {
    if (!game_socket_outside)
      display_game_message("A new tournament is available")
    update_tournament_lobby([response], true) 
    updatePills()     
  }


  if (response.status === "join_tournament") {
    update_tournament_display([response])
  }

  if (response.status === "tournament_ready") {
    remove_game(response.tournament_uid) 
    play_tournament(response);
  }

  if (response.type === "send_game_announcement")
  {
      if (response.created_by === User.get())
      {
        display_game_message(response.message)
      }
  }

  if (response.status === "game_deleted" || response.status === "tournament_deleted" || response.status ==="remove_game" || response.status ==="tournament_game")
  {
    remove_game(response.game_uid)      
  }

  if (response.status === "game_ready" || response.status === "in_progress" )
  {
      remove_game(response.game_uid)  
      play(response)
  }

};

socket_game.onerror = (event: Event) => console.log("❌ [app.ts] WebSocket error:", event);
socket_game.onclose = () => {
    console.log("🔴 [app.ts] WebSocket disconnected!");
    isSocketReady = false;
};


document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 DOM loaded, initializing the game...");

  const logoutButton = document.querySelector("#logout");
  const stopGameButton = document.getElementById("stop_game");
  const newGameButton: HTMLElement = document.getElementById("new_game") as HTMLElement;
  const joinGameButton: HTMLElement = document.getElementById("join_game") as HTMLElement;
  const BestScoreButton: HTMLElement = document.getElementById("best_scores") as HTMLElement;
  const chatButton: HTMLElement = document.getElementById("chat") as HTMLElement;
  const accountButton : HTMLElement = document.getElementById("account") as HTMLElement;
  const submitUserInfosButton : HTMLElement = document.getElementById("submit-user-infos") as HTMLElement;
  color_canvas();
  if (newGameButton) {
    newGameButton.addEventListener("click", () => {
        let target: HTMLElement = document.getElementById("NewGameWrapper") as HTMLElement
        if (target.classList.contains("d-none"))
        {
          close_windows();
          target.classList.remove("d-none");
        }
        else
          target.classList.add("d-none");
    });
  }

  if (BestScoreButton) {
    BestScoreButton.addEventListener("click", () => {
      let target: HTMLElement = document.getElementById("BestScoreWrapper") as HTMLElement
      if (target.classList.contains("d-none"))
      {
        close_windows();
        (async () => {
          loadPlayerStatistics(User.get());
          loadPlayerHistory(User.get());
        })();
        target.classList.remove("d-none");
        let titlebestscore : HTMLElement = document.getElementById("bestScoreTitle") as HTMLElement;
        titlebestscore.innerText = "Best Score";
      } 
      else
          target.classList.add("d-none");
    });
  }

  if (joinGameButton) {
    joinGameButton.addEventListener("click", () => {
      let target: HTMLElement = document.getElementById("JoinGameWrapper") as HTMLElement
      if (target.classList.contains("d-none"))
      {
        // UpdateGameList(GAMES);
        close_windows();
        target.classList.remove("d-none");

        const join_game_list : HTMLElement = document.getElementById("joingame_list") as HTMLElement;
        if (join_game_list.childElementCount <= 0) {
          no_games_text.classList.remove("d-none");
          no_games_text.innerHTML = "No games available";
        } else {
          no_games_text.classList.add("d-none");
        }
      }
      else
        target.classList.add("d-none");
    });
  }

  let keyboardButton: HTMLElement = document.getElementById("keyboard") as HTMLElement
  if (keyboardButton) {
    keyboardButton.addEventListener("click", () => {
      let target: HTMLElement = document.getElementById("KeyboardWrapper") as HTMLElement
      if (target.classList.contains("d-none"))
      {
        close_windows();
        target.classList.remove("d-none");
        loadKeyButtons();
      }
        else
          target.classList.add("d-none");
    }); 
  }

  // JOIN PART FILTER BUTTON 
  const player_vs_player_filter_btn : HTMLElement = document.getElementById("btnradio2") as HTMLElement;
  const tournament_filter_btn : HTMLElement = document.getElementById("btnradio3") as HTMLElement;
  const join_tournament_list : HTMLElement = document.getElementById("tournament_list") as HTMLElement;
  const join_game_list : HTMLElement = document.getElementById("joingame_list") as HTMLElement;
  
  const history_game_btn : HTMLElement = document.getElementById("historybtn") as HTMLElement;
  const history_container : HTMLElement = document.getElementById("history_games") as HTMLElement;
  const player_statistics_container : HTMLElement = document.getElementById("player_stats") as HTMLElement;
  const no_games_text : HTMLElement = document.getElementById("no-games") as HTMLElement;
  
  if (history_game_btn) {
    history_game_btn.addEventListener("click", () => {
      if ( history_container.classList.contains("d-none")) {
        player_statistics_container.classList.add("d-none");
        history_container.classList.remove("d-none");
        history_game_btn.textContent = "Hide game history";
        }
      else {
        player_statistics_container.classList.remove("d-none");
        history_container.classList.add("d-none");
        history_game_btn.textContent = "Show game history";
      }
    });
  }

  if (player_vs_player_filter_btn) {
    player_vs_player_filter_btn.addEventListener("click", () => {
      join_tournament_list.classList.add("d-none")
      join_game_list.classList.remove("d-none")
      if (join_game_list.childElementCount <= 0) {
        no_games_text.classList.remove("d-none");
        no_games_text.innerHTML = "No games available";
      } else {
        no_games_text.classList.add("d-none");
      }
    });
  }
  if (tournament_filter_btn) {
    tournament_filter_btn.addEventListener("click", () => {
      join_game_list.classList.add("d-none")
      join_tournament_list.classList.remove("d-none")
      if (join_tournament_list.childElementCount <= 0) {
        no_games_text.classList.remove("d-none");
        no_games_text.innerHTML = "No tournaments available";
      } else {
        no_games_text.classList.add("d-none");
      }
    });
  }

  if (stopGameButton) {
      stopGameButton.addEventListener("click", () => {
          console.log("🟢 'Stop Game' button clicked, sending STOP command...");
          sendStopCommand();
      });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => window.location.href = "accounts/logout/");
  }

  
  submitUserInfosButton.addEventListener("click", async (event)=>{
    try{
      await updateUser()
      let target: HTMLElement = document.getElementById("userDetailsWrapper") as HTMLElement
      target.classList.add("d-none");
    }
    catch
    {
      console.error("User Update error")
    }
  })


    // SETTINGS GAME PART
    const easy : HTMLElement = document.getElementById("easy") as HTMLElement;
    const medium : HTMLElement = document.getElementById("medium") as HTMLElement;
    const hard : HTMLElement = document.getElementById("hard") as HTMLElement;
    const impossible : HTMLElement = document.getElementById("impossible") as HTMLElement;

    let old_btn_difficulty = hard;

    let difficulty = 'hard';
    easy.addEventListener("click", (event: Event) => {
      difficulty = 'easy'
      if (old_btn_difficulty) {
        if ( old_btn_difficulty.classList.contains("btn_selected"))
          old_btn_difficulty.classList.remove("btn_selected");
      }

      if (!easy.classList.contains("btn_selected"))
        easy.classList.add("btn_selected");
      old_btn_difficulty = easy
    });

    medium.addEventListener("click", (event: Event) => {
      difficulty = 'medium'
      if (old_btn_difficulty) {
        if ( old_btn_difficulty.classList.contains("btn_selected"))
          old_btn_difficulty.classList.remove("btn_selected");
      }

      if (!medium.classList.contains("btn_selected"))
        medium.classList.add("btn_selected");
      old_btn_difficulty = medium
    });

    hard.addEventListener("click", (event: Event) => {
      difficulty = 'hard'
      if (old_btn_difficulty) {
        if ( old_btn_difficulty.classList.contains("btn_selected"))
          old_btn_difficulty.classList.remove("btn_selected");
      }

      if (!hard.classList.contains("btn_selected"))
        hard.classList.add("btn_selected");
      old_btn_difficulty = hard
    });

    impossible.addEventListener("click", (event: Event) => {
      difficulty = 'impossible'
      if (old_btn_difficulty) {
        if ( old_btn_difficulty.classList.contains("btn_selected")) {
          old_btn_difficulty.classList.remove("btn_selected");
        }
      }

      if (!impossible.classList.contains("btn_selected"))
        impossible.classList.add("btn_selected");
      old_btn_difficulty = impossible
    });

  accountButton.addEventListener("click", (event: Event) =>{
    let target: HTMLElement = document.getElementById("userDetailsWrapper") as HTMLElement
    if (target.classList.contains("d-none"))
    {
      close_windows();
      target.classList.remove("d-none");
    }
    else
      target.classList.add("d-none");
  }) 


  chatButton.addEventListener("click", (event: Event) => {
    let target: HTMLElement = document.querySelector(".chatbox") as HTMLElement;
    if (target.classList.contains("d-none"))
    {
      close_windows();
      target.classList.remove("d-none");
      game_alert?.classList.remove("d-none");
    }
    else {
      target.classList.add("d-none");
      game_alert?.classList.add("d-none");
    }

  });


const maxpts_input = document.getElementById("input-maxpts") as HTMLInputElement;
const wincondition_input = document.getElementById("win-condition") as HTMLInputElement;

let max_pts_value = maxpts_input.value;
let wincondition_value = wincondition_input.value;

function sendCreateCommand(action: string) {
    if (isSocketReady && socket_game.readyState === WebSocket.OPEN) {
        let data:any = { action,  user :User.get()}
        switch(action)
        {
            case NEWGAME: data["game_param"] = { opponent: "remote", player: 2, max_pts:max_pts_value, win_condition: wincondition_value, level:"none"}; break
            case NEWAIGAME: data["game_param"] = { opponent: "ai", player: 2, max_pts:max_pts_value, win_condition: wincondition_value, level: difficulty}; break
            case NEWINVITEDGAME:data["game_param"] = { opponent: "invited", player: 2, max_pts:max_pts_value, win_condition: wincondition_value, level: "none"}; break
            case NEWTOURNAMENT: console.log("tournament......"); data["game_param"] = { opponent: "remote", player: 4, max_pts:max_pts_value, win_condition: wincondition_value, level: "none"}; break;
            default : data["game_params"] = {}; console.log("invalid game creation request"); return // 
        }
        socket_game.send(JSON.stringify(data));
    }
}



  // NEW GAME PART

  const NEWGAME = "new_game"
  const NEWAIGAME = "new_ai_game"
  const NEWINVITEDGAME = "new_invited_game"
  const NEWTOURNAMENT = "new_tournament"



  const player_vs_ia : HTMLElement = document.getElementById("gm_btn_1") as HTMLElement;
  const player_vs_player : HTMLElement = document.getElementById("gm_btn_2") as HTMLElement;
  const tournament : HTMLElement = document.getElementById("gm_btn_3") as HTMLElement;
  const player_vs_invited : HTMLElement = document.getElementById("gm_btn_4") as HTMLElement;
  const create_game : HTMLElement = document.getElementById("create_game") as HTMLElement;
  const iasettings : HTMLElement = document.querySelector(".aisettings") as HTMLElement;
  let old_btn = player_vs_ia;

  let gamemode_selected = 1
  player_vs_ia.addEventListener("click", (event: Event) => {
    gamemode_selected = 1
    if (old_btn) {
      if ( old_btn.classList.contains("btn_selected"))
        old_btn.classList.remove("btn_selected");
    }
    
    if (iasettings.classList.contains("d-none"))
      iasettings.classList.remove("d-none")
    if (!player_vs_ia.classList.contains("btn_selected"))
      player_vs_ia.classList.add("btn_selected");
    old_btn = player_vs_ia    
  });

  player_vs_player.addEventListener("click", (event: Event) => {
    gamemode_selected = 2
    if (old_btn) {
      if ( old_btn.classList.contains("btn_selected"))
        old_btn.classList.remove("btn_selected");
    }

    if (!player_vs_player.classList.contains("btn_selected"))
      player_vs_player.classList.add("btn_selected");
    old_btn = player_vs_player
    iasettings.classList.add("d-none")
  });

  tournament.addEventListener("click", (event: Event) => {
    gamemode_selected = 3
    if (old_btn) {
      if ( old_btn.classList.contains("btn_selected"))
        old_btn.classList.remove("btn_selected");
    }

    if (!tournament.classList.contains("btn_selected"))
      tournament.classList.add("btn_selected");
    old_btn = tournament
    iasettings.classList.add("d-none")
  });

  player_vs_invited.addEventListener("click", (event: Event) => {
    gamemode_selected = 4

    if (old_btn) {
      if ( old_btn.classList.contains("btn_selected"))
        old_btn.classList.remove("btn_selected");
    }

    if (!player_vs_invited.classList.contains("btn_selected"))
    {
      player_vs_invited.classList.add("btn_selected");
    }
    old_btn = player_vs_invited
    iasettings.classList.add("d-none")
  });

  function verify_gameoptions(maxpts_input:any, wincondition_input:any) {
    const maxptsinput_int = parseInt(maxpts_input);
    const win_condition_int = parseInt(wincondition_input);
    
    if (isNaN(maxptsinput_int) || isNaN(win_condition_int))
      return false;
    if (maxptsinput_int < 1 || win_condition_int < 1)
      return false;
    return true
  }

  let loop_id:null | number = null;
  create_game.addEventListener("click", (event: Event) => {
    if (isSocketReady && socket_game.readyState === WebSocket.OPEN) {
      let action = "new_ai_game"
      close_windows()
      switch(gamemode_selected)
      {
          case 1: action = "new_ai_game"; break
          case 2: action = "new_game"; break
          case 3: action = "new_tournament"; break
          case 4: action = "new_invited_game"; break
          default : action = "new_ai_game"; console.log("invalid gamemode"); return 
      }
      max_pts_value = maxpts_input.value;
      wincondition_value = wincondition_input.value; 
      if (!verify_gameoptions(max_pts_value, wincondition_value))
      {
        notification_message("Invalid input")
        return;
      }
      sendCreateCommand(action);
      if (loop_id)
          clearTimeout(loop_id)
      loop_id = null;
    } else {
        console.warn("⚠️ WebSocket not ready");

    }
  });


  
});




function sendStartCommand() {
    if (isSocketReady && socket_game.readyState === WebSocket.OPEN) {
        console.log("🚀 Sending START command to the server...");
        socket_game.send(JSON.stringify({ "command": "start" }));
    } else {
        console.warn("⚠️ WebSocket not ready, waiting...");
        setTimeout(sendStartCommand, 500);
    }
}

function sendStopCommand() {
    if (isSocketReady && socket_game.readyState === WebSocket.OPEN) {
        console.log("🚀 Sending STOP command to the server...");
        socket_game.send(JSON.stringify({ "command": "stop" }));
    } else {
        console.warn("⚠️ WebSocket is not ready yet, retrying...");
        setTimeout(sendStopCommand, 500);
    }
}

function getKeyMaps() {
  fetch("/accounts/keymap/?user=" + User.get())
    .then(response => response.json())
    .then(data => {
      if (data.default_map) {
        for (const key in default_map)
          delete default_map[key as keyof typeof default_map];
        Object.assign(default_map, data.default_map);
      }
      if (data.invited_map) {
        for (const key in invited_map)
          delete invited_map[key as keyof typeof invited_map];
        Object.assign(invited_map, data.invited_map);
      }
      if (data.invited_inverted_map) {
        for (const key in invited_inverted_map)
          delete invited_inverted_map[key as keyof typeof invited_inverted_map];
        Object.assign(invited_inverted_map, data.invited_inverted_map);
      }
    });
}

function saveKeyMaps() {
  const data = {
    default_map: default_map,
    invited_map: invited_map,
    invited_inverted_map: invited_inverted_map,
  };

  fetch("/accounts/keymap/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify(data)
  })
  .then(async response => {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      getKeyMaps();

    } catch (e) {
      console.error("Invalid JSON returned by server:", e);
    }
  })
  .catch(error => {
    console.error("Error saving key maps:", error);
  });

}

// load player history
export function loadPlayerHistory(user:String) {
  const history_container: HTMLElement = document.getElementById("history_games") as HTMLElement;

  if (history_container === null) {
    console.error("History container not found");
    return;
  }

  history_container.innerHTML = ""; 
  fetch("/getusersessions/?user=" + user)
  .then(response => response.json())
  .then(data => {
    console.log("Player history data received:", data);
    for (let i = 0; i < data.length; i++) {
      let game = data[i];
      if (game === undefined || game === null)
        continue;
      let container_game: HTMLElement = document.createElement('div');
      container_game.classList.add("container-fluid", "d-flex", "justify-content-center", "border", "border-light", "rounded-3", "mt-3");
      history_container.appendChild(container_game);

      let container_player_1: HTMLElement = document.createElement('div');
      container_player_1.classList.add("container", "d-flex","flex-column", "justify-content-center","text-light", "p-3");
      container_game.appendChild(container_player_1);

      let game_container_info: HTMLElement = document.createElement('div');
      game_container_info.classList.add("container", "d-flex", "flex-column", "text-light", "p-3");
      container_game.appendChild(game_container_info);

      let EndAt: HTMLElement = document.createElement('span');
      EndAt.classList.add("text-info", "fs-8", "align-self-center", "mx-3");
      EndAt.innerHTML = "EndAt: " + formatDate(game.ended_at);
      game_container_info.appendChild(EndAt);

      let vsText: HTMLElement = document.createElement('span');
      vsText.innerHTML = "VS";
      vsText.classList.add("text-light", "fs-3", "align-self-center", "mx-3");
      game_container_info.appendChild(vsText);

      let Winner: HTMLElement = document.createElement('span');
      Winner.classList.add("text-warning", "fs-6", "align-self-center", "mx-3");
      if (game.winner === null || game.winner === undefined)
        game.winner = "AI";
      Winner.innerHTML = "Winner: " + game.winner;
      game_container_info.appendChild(Winner);

      let container_player_2: HTMLElement = document.createElement('div');
      container_player_2.classList.add("container", "d-flex", "flex-column", "justify-content-center", "text-light", "p-3");
      container_game.appendChild(container_player_2);

      let player_1: HTMLElement = document.createElement('h6');
      player_1.innerHTML = game.player1;
      player_1.classList.add("text-success", "fs-5");
      container_player_1.appendChild(player_1);

      let player1_score: HTMLElement = document.createElement('h6');
      player1_score.innerHTML = game.player1_score + " pts";
      player1_score.classList.add("text-success", "fs-6");
      container_player_1.appendChild(player1_score);

      let player_2: HTMLElement = document.createElement('h6');
      player_2.classList.add("text-danger", "fs-5");
      if (game.is_multiplayer === false)
        player_2.innerHTML = "AI";
      else
        player_2.innerHTML = game.player2;
      container_player_2.appendChild(player_2);

      let player2_score: HTMLElement = document.createElement('h6');
      player2_score.innerHTML = game.player2_score + " pts";
      player2_score.classList.add("text-danger", "fs-6");
      container_player_2.appendChild(player2_score);
    }
  });

}

// load player statistics
export function loadPlayerStatistics(user:String) {
  fetch("/getuserstats/?user=" + user)
    .then(response => response.json())
    .then(data => {
      player_statistics.total_games_played = data.total_games_played || 0;
      player_statistics.total_games_wons = data.total_games_won || 0;
      player_statistics.total_points_scored = data.total_points_scored || 0;
      player_statistics.total_points_conceded = data.total_points_conceded || 0;
      player_statistics.total_tournaments_played = data.total_tournaments_played || 0;
      player_statistics.total_tournaments_won = data.total_tournaments_won || 0;

      const total_games_played : HTMLElement = document.getElementById("total_games_played") as HTMLElement;
      const total_games_wons : HTMLElement = document.getElementById("total_games_won") as HTMLElement;
      const total_points_scored : HTMLElement = document.getElementById("total_points_scored") as HTMLElement;
      const total_points_conceded : HTMLElement = document.getElementById("total_points_conceded") as HTMLElement;
      const total_tournaments_played : HTMLElement = document.getElementById("total_tournaments_played") as HTMLElement;
      const total_tournaments_won : HTMLElement = document.getElementById("total_tournaments_won") as HTMLElement;
      
      total_games_played.innerHTML = player_statistics.total_games_played.toString();
      total_games_wons.innerHTML = player_statistics.total_games_wons.toString();
      total_points_scored.innerHTML = player_statistics.total_points_scored.toString();
      total_points_conceded.innerHTML = player_statistics.total_points_conceded.toString();
      total_tournaments_played.innerHTML = player_statistics.total_tournaments_played.toString();
      total_tournaments_won.innerHTML = player_statistics.total_tournaments_won.toString();      
    });
}

(async () => {
  await User.setUser();  
  initChatRoom()
  initUserInfo();
  getKeyMaps();
  loadPlayerStatistics(User.get());
  loadPlayerHistory(User.get());
})();








// KEYBOARD SETTINGS PART

let toucheActive: string | null = null;
let KeyinnerText : string = "" as string;

function loadKeyButtons() {
  const container_all_keys: HTMLElement = document.getElementById("keys_container") as HTMLElement;
  container_all_keys.innerHTML = ""; // Clear previous buttons
  
  for (const key in default_map) {
      if (default_map[key as keyof typeof default_map]?.[1] == "noaction")
        continue;
      // add element text
      let container_key: HTMLElement = document.createElement('div');
      container_key.classList.add("w-50", "p-3", "text-center");
      container_all_keys.appendChild(container_key);

      let action_text: HTMLElement = document.createElement('span');
      action_text.classList.add("text-light", "fs-6", "me-1");
      action_text.textContent = default_map[key as keyof typeof default_map]?.[0];
      container_key.appendChild(action_text);

      let button: HTMLElement = document.createElement('button');
      button.classList.add("btn", "btn-outline-primary");
      button.id = key;
      button.textContent = key;
      button.addEventListener("click", () => {
        KeyinnerText = button.textContent || "" as string;
        toucheActive = key;
        console.log("Touche active:", toucheActive, KeyinnerText);
        button.textContent = "Appuyez sur une touche...";
      });
      container_key.appendChild(button);
  }
}

document.addEventListener("keydown", (event) => {
    if (toucheActive) {
      const touche = event.key; 
    const KeyActive : HTMLElement = document.getElementById(toucheActive) as HTMLElement;
    
    // save to default_map
    if ((default_map as any)[KeyinnerText]) {
      const actions = (default_map as any)[KeyinnerText];
      delete (default_map as any)[KeyinnerText];
      (default_map as any)[touche] = actions;
    }

    // save to invited_map
    if ((invited_map as any)[KeyinnerText]) {
      const actions = (invited_map as any)[KeyinnerText];
      delete (invited_map as any)[KeyinnerText];
      (invited_map as any)[touche] = actions;
    }

    // save to invited_inverted_map
    if ((invited_inverted_map as any)[KeyinnerText]) {
      const actions = (invited_inverted_map as any)[KeyinnerText];
      delete (invited_inverted_map as any)[KeyinnerText];
      (invited_inverted_map as any)[touche] = actions;
    }

    KeyActive.textContent = touche;
    toucheActive = null;
    saveKeyMaps();
  }
});