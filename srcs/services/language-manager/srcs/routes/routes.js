import { 
        get_user_lang_route, 
        set_user_lang_route, 
        delete_user_lang_route, 
        create_user_lang_route 
} from "../controlers/controlers.js";


export function routes(app) {
    app.get('/get-lang', async (request, reply) => get_user_lang_route(request, reply));
    app.post('/create-lang', async (request, reply) => create_user_lang_route(request, reply));
    app.post('/set-lang', async (request, reply) => set_user_lang_route(request, reply));
    app.post('/delete-lang', async (request, reply) => delete_user_lang_route(request, reply));
}