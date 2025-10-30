import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import cors from '@fastify/cors';


export const app = Fastify({trustProxy: true});
const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"

export const redis = createClient({
	socket: {
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT
	},
	password: process.env.REDIS_PASSWORD
});

await redis.connect();


// await app.register(cors, {
// 	origin: `https://${base_url}`,
// 	credentials: true
// });


await app.register(cookie, {
	secret: process.env.COOKIE_SECRET,
	parseOptions: {}
});

app.register(websocket);
console.log("✅ WebSocket plugin enregistré");



const generalConnections = new Map();

async function isConnectedWSSHook(request, reply) {
	const isWebSocket = request.headers.upgrade === 'websocket';
	const token = request.cookies.token;
    if (!token)
	{
		console.log("no token found")
		if (isWebSocket)
			throw new Error("Unauthorised")
		return reply.code(401).send({ error: 'Non autorisé' });
	}
    try {
    	const val = jwt.decode(token, process.env.JWT_SECRET);
		console.log(val)
    	if (!val || !val.jti)
		{
			if (isWebSocket)
				throw new Error("Unauthorised")
			return reply.code(401).send({ error: 'Non autorisé' });
		}
		const exists = await redis.get(`jwt:${val.jti}`);
		if (!exists || exists === "not valid")
		{
			if (isWebSocket)
				throw new Error("Unauthorised")
			return reply.code(401).send({ error: 'Non autorisé' });
		}
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		console.log( "payload:", payload)
		request.user = payload;
    } catch (err) {
		console.log(err)
		if (isWebSocket)
			throw new Error("Unauthorised")
        return reply.code(401).send({ error: 'Non autorisé' });
    }	
	console.log("END OK CONNECTED WSSHOOK")
}


// app.get('/general', { websocket: true }, generalSocketHandler);


app.get('/', async () => {
	return { status: 'ok', service: 'remote-players' };
});



// app.addHook('onRequest', async (request, reply) => {
// 	if (request.method === "GET" && request.url.startsWith("/general"))
// 	{
// 		console.log("ok 1")
// 		await isConnectedWSSHook(request, reply)
// 		console.log("ok 2")
// 	}
// 	else 
// 	{
// 		console.log("nok")
// 		return reply.code(401).send({ error: 'Non autorisé' });
// 	}
// 	});


// app.get('/general', { websocket: true }, (socket, req) => {
//         console.log("🎯 🎯 🎯 HANDLER APPELÉ 🎯 🎯 🎯");
//         console.log("test1 in general Socket Handler")
// 	try
// 	{
// 		const userId = req.user
// 		console.log(userId)
// 		console.log(req)
// 		let ws = socket.socket;
// 		generalConnections.set(userId, ws)

	

// 	// connection.socket est le WebSocket


// 		redis.set(`online:${userId}`, 'true');
	
// 		// Exemple : recevoir des messages
// 		ws.on('message', message => {
// 			console.log('Message reçu du client :', message.toString());
// 		});
	
// 		// Exemple : envoyer un message au client
// 		ws.send(JSON.stringify({ type: 'welcome', payload: 'Bienvenue sur le canal global' }));
	
// 		// Gestion de la fermeture
// 		ws.on('close', () => {
// 			generalConnections.delete(userId);
// 			redis.del(`online:${userId}`);
// 			console.log('Connexion WebSocket fermée');
// 		});

// 	}
// 	catch(err){
// 		console.error(err);		
// 	}
//     })

app.register(async function (fastify) {
	console.log("🔧 Enregistrement du contexte WebSocket");
    fastify.get('/general', { websocket: true , preHandler: isConnectedWSSHook}, (socket, req) => {
        console.log("🎯 🎯 🎯 HANDLER APPELÉ 🎯 🎯 🎯");
        console.log("Type de socket:", typeof socket);
        console.log("req:", req.url);

        socket.send(JSON.stringify({ test: 'hello' }));
    });
	console.log("✅ Route /general enregistrée");
});



const start = async () => {
	try {
		 await app.listen({ port: 3003, host: '0.0.0.0' });
		console.log('Remote-player service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();



