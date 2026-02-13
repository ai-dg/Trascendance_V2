
import { friend_request_route,
         friend_request_response_route,
         get_friends_route,
         get_pending_requests_route,
         add_friend,
         block_friend_route,
         remove_friend,
         get_blocked_users_route,
         unblock_user_route
} from "../controlers/controlers.js";

import {
    send_message_route,
    get_messages_route
} from "../controlers/messageControlers.js";

import {
    send_game_invite_route,
    respond_to_game_invite_route,
    join_game_route,
    update_game_state_route
} from "../controlers/gameInviteControlers.js";

export function routes(app, options)
{
    app.post('/friend-request', async (request, reply) => friend_request_route(request, reply));
    app.post('/friend-request-response', async (request, reply) => friend_request_response_route(request, reply));
    app.get('/get-friends', async (request, reply) => get_friends_route(request, reply));
    app.get('/pending-requests', async (request, reply) => get_pending_requests_route(request, reply));

    app.post('/add-friend', async (request, reply) => add_friend(request, reply));
    app.post('/block-friend', async (request, reply) => block_friend_route(request, reply));
    app.post('/remove-friend', async (request, reply) => remove_friend(request, reply));

    app.post('/send-message', async (request, reply) => send_message_route(request, reply));
    app.get('/get-messages', async (request, reply) => get_messages_route(request, reply));

    app.get('/blocked-users', async (request, reply) => get_blocked_users_route(request, reply));
    app.post('/unblock', async (request, reply) => unblock_user_route(request, reply));

    // --- Game Invite Routes ---
    app.post('/send-game-invite', async (request, reply) => send_game_invite_route(request, reply));
    app.post('/respond-to-game-invite', async (request, reply) => respond_to_game_invite_route(request, reply));
    app.post('/join-game', async (request, reply) => join_game_route(request, reply));
    app.post('/update-game-state', async (request, reply) => update_game_state_route(request, reply));
}
