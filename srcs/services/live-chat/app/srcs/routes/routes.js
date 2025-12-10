import { friend_request_route,
         friend_request_response_route,
         get_friends_route
 } from "../controlers/controlers.js";

export function routes(app, options)
{
    app.post('/friend-request', async (request, reply) => friend_request_route(request, reply));
    app.post('/friend-request-response', async (request, reply) => friend_request_response_route(request, reply));
    app.get('/get-friends', async (request, reply) => get_friends_route(request, reply));
}