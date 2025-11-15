import { friend_request_route } from "../controlers/controlers.js";

export function routes(app, options)
{
    app.post('/friend-request', async (request, reply) => friend_request_route(request, reply));

}