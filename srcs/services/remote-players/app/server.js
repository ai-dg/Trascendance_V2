/**
 * ============================================
 * SERVICE REMOTE-PLAYERS
 * ============================================
 * 
 * Ce service gère la logique des parties de Pong côté serveur.
 * Architecture : Fastify (HTTP) + Socket.IO (WebSocket en temps réel)
 * 
 * Fonctionnalités :
 * - Authentification JWT via cookies
 * - Création et gestion de parties multiples simultanées
 * - Calcul de la physique du jeu à 60 FPS
 * - Synchronisation en temps réel avec les clients
 */

import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { GameManager } from './srcs/GameManager.js';

// ============================================
// CONFIGURATION DU SERVEUR
// ============================================

// Serveur Fastify avec proxy de confiance (pour nginx/traefik)
export const app = Fastify({trustProxy: true});

// Détection de l'environnement (PROD ou DEV)
const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

// Instance Socket.IO (initialisée après le démarrage de Fastify)
let socketio = null;

// ============================================
// CONNEXION REDIS
// ============================================
// Redis sert à valider les JWT (stockage des JTI)
export const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD
});

// Connexion à Redis
await redis.connect();

// ============================================
// PLUGINS FASTIFY
// ============================================
// Plugin pour gérer les cookies (nécessaire pour l'auth JWT)
await app.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {}
});

// ============================================
// STOCKAGE EN MÉMOIRE
// ============================================
// Map des connexions actives (userId -> socket)
const generalConnections = new Map();

// Map des parties en cours (UUID -> GameManager)
// Chaque partie a son propre GameManager qui gère sa logique
const runningGames = new Map();

// ============================================
// ROUTES HTTP
// ============================================
// Route de santé pour vérifier que le service est en ligne
app.get('/', async () => {
    return { status: 'ok', service: 'remote-players' };
});

// ============================================
// CONFIGURATION SOCKET.IO
// ============================================

/**
 * Configure Socket.IO avec authentification
 * Namespace /general pour les parties générales (local, AI, etc.)
 */
function setupSocketIO(){
	const io = socketio;
	
	// Applique le middleware d'authentification JWT
	io.of('/general').use(socketAuthMiddleware)
	
	// Écoute les nouvelles connexions sur le namespace /general
	io.of('/general').on('connection',  (socket) => setupGeneralGameSocket(socket));
}

/**
 * Configure les événements pour une connexion Socket.IO authentifiée
 * @param {Socket} socket - Socket du client connecté
 */
function setupGeneralGameSocket(socket){
	console.log('✅ Utilisateur authentifié:', socket.userId);
	
	// Envoie un message de bienvenue au client
	socket.emit("welcome", {message : "welcome !", userId: socket.userId, user: socket.user})
	
	// Informe les autres utilisateurs qu'un nouveau joueur s'est connecté
	socket.broadcast.emit("user-joined", {userId: socket.id});
	
	// Écoute la demande de nouvelle partie (ancienne méthode, peut être obsolète)
	socket.on("new-game", (data) => newGameSocket(socket, data))
	
	// Écoute la demande de création de partie (méthode actuelle)
	socket.on("game-request", (data) => requestGameUID(socket, data))
}

function requestGameUID(socket, data){
	let uuid = crypto.randomUUID()
	if (data.type === "local")
	{
		console.log("data: ", data, "uuid : ", uuid)
		
		runningGames[uuid] = new GameManager(socket, {
			uuid: uuid,
			type: data.type
		});
		
		socket.on(uuid, (eventData) => gameHandler(uuid, eventData));
		
		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
}

function gameHandler(uuid, data){
	const game = runningGames[uuid];
	
	if (!game) {
		console.error(`Game ${uuid} not found!`);
		return;
	}
	
	if (data.action === "player-ready") {
		game.setPlayerReady(data.player);
	}

	if (data.state) {
		game.updatePlayerMove(data.state.paddle1, data.state.paddle2);
	}
}

function newGameSocket(socket, data){
	console.log("data : ", data);
}

async function socketAuthMiddleware(socket, next) {
  try {

    const cookies = socket.handshake.headers.cookie;    
    if (!cookies) {
		   console.log("E")
      return next(new Error('No cookies'));
    }
    const token = parseCookie(cookies, 'token');
    
    if (!token) {
		   console.log("D")
      return next(new Error('No token'));
    }

    const val = jwt.decode(token, process.env.JWT_SECRET);
    
    if (!val || !val.jti) {
		   console.log("C")
      return next(new Error('Invalid token'));
    }
    
    const exists = await redis.get(`jwt:${val.jti}`);
    
    if (!exists || exists === "not valid") {
	   console.log("B")
      return next(new Error('Token not valid in Redis'));
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    socket.userId = payload.user_id;
    socket.user = payload.pseudo;
	console.log("payload : ", payload)
    console.log("A")
    next();
    
  } catch (err) {
    console.error('Auth error:', err);
    next(new Error('Authentication failed'));
  }
}


function parseCookie(cookieString, name) {
  const cookies = cookieString.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

const start = async () => {
	try {
		console.log(app.printRoutes());
		 await app.listen({ port: 3003, host: '0.0.0.0' });

		socketio = new Server(app.server, {
		path: '/socket.io/',
		cors: { origin: true, credentials: true }
		});

		console.log('Socket.IO path:', '/socket.io/');
		setupSocketIO();
		console.log('✅ Remote-player service running on port 3003 with Socket.IO');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

