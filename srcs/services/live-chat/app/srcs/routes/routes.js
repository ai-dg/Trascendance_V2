import { friend_request_route,
         friend_request_response_route,
         get_friends_route,
         get_pending_requests_route,
         add_friend,
         block_friend_route,
         remove_friend
 } from "../controlers/controlers.js";

export function routes(app, options)
{
    app.post('/friend-request', async (request, reply) => friend_request_route(request, reply));
    app.post('/friend-request-response', async (request, reply) => friend_request_response_route(request, reply));
    app.get('/get-friends', async (request, reply) => get_friends_route(request, reply));
    app.get('/pending-requests', async (request, reply) => get_pending_requests_route(request, reply));

    app.post('/add-friend', async (request, reply) => add_friend(request, reply));
    app.post('/block-friend', async (request, reply) => block_friend_route(request, reply));
    app.post('/remove-friend', async (request, reply) => remove_friend(request, reply));

}