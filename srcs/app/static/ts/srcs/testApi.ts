import { getCSRFToken } from "./Security";
import { getUrl } from "./Urls";
import { User } from "./User";
import { setOnlineUsers, updateRooms } from "./Chat";
import { chat_socket } from "./RegisterSockets";


export async function get_banned_for_user() {
    const user:string = User.get();
    if (user) {
        const data = {
            "username": user,
        };        
        try {
            const res = await fetch(getUrl("chat/get_banned"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken(),
                },
                body: JSON.stringify(data),
                credentials: "include"
            });
            
            if (!res.ok) {
                throw new Error(`Ban failed! Status: ${res.status}`);
            }
            const bannedUsers = await res.json();


            return bannedUsers;
        } catch (err) {
            console.error("Error while fetching banned users:", err);
            return [];
        }
    }
}


// export async function ban(ban:string)
// {
//     const user:string = User.get();
//     if (user && ban)
//     {
//         const data = {
//             "banned" : ban
//         }
//         fetch(getUrl("chat/ban"),
//         {
//             method: "POST",
//             headers:{ "X-CSRFToken" : getCSRFToken(),
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(data),
//             credentials: "include"
//         }).then(res=>{
//             User.setBanned()
//             setOnlineUsers(User.getConnectedUsers())
//             updateRooms();
//         })
//         .catch(err=> console.error(err))
//     }
// }


// export async function unban(ban:string)
// {
//     const user:string = User.get();
//     if (user && ban)
//     {
//         const data = {
//             "unbanned" : ban
//         }
     
//         fetch(getUrl("chat/unban"),
//         {
//             method: "POST",
//             headers:{ "X-CSRFToken" : getCSRFToken(),
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(data),
//             credentials: "include"
//         }).then(res=>{
//             User.setBanned();
//             setOnlineUsers(User.getConnectedUsers())//// find a solution...
//             updateRooms();


//         })
//         .catch(err=> console.error(err))
//     }
// }

