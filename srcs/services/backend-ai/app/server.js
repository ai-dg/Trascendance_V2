import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';
import { Ai } from './srcs/Ai.js';
import { vaultClient } from './srcs/vault.js';
import { setupMetrics } from '/monitoring/metrics.js';



await vaultClient.loadSecrets()
export const redisAuth = vaultClient.get('redis')

// HTTPS options
let httpsOptions = {};
try {
	const certPath = path.join('/certs', 'cert.pem');
	const keyPath = path.join('/certs', 'key.pem');
	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
		httpsOptions = {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath)
		};
	}
} catch (err) {
	console.log('HTTPS certs not found, running on HTTP');
}

const app = Fastify({https: httpsOptions});

// Redis clients
const redis = createClient({
	socket: {
		host: redisAuth.host,
		port: redisAuth.port
	},
	password: redisAuth.password
});

const redisSubscriber = createClient({
	socket: {
		host: redisAuth.host,
		port: redisAuth.port
	},
	password: redisAuth.password
});

// Store AI instances per game with last activity timestamp
const aiInstances = new Map();
const AI_INSTANCE_TTL = 10 * 60 * 1000; // 10 minutes

app.get('/', async () => {
	return { status: 'ok', service: 'backend-ai', activeGames: aiInstances.size };
});

// Setup Prometheus metrics
setupMetrics(app, 'backend-ai');

async function setupRedisSubscription() {
	try {
		await redis.connect();
		await redisSubscriber.connect();
		console.log('✅ Connected to Redis');

		// Subscribe to game state channels
		await redisSubscriber.pSubscribe('game:*:state', async (message, channel) => {
			try {
				const uuid = channel.split(':')[1];
				const gameState = JSON.parse(message);

				// Get or create AI instance
				let aiData = aiInstances.get(uuid);
				if (!aiData) {
					aiData = {
						ai: new Ai(gameState.difficulty || 'medium'),
						lastActivity: Date.now()
					};
					aiInstances.set(uuid, aiData);
					console.log(`Created AI for game ${uuid} (${gameState.difficulty || 'medium'})`);
				} else {
					aiData.lastActivity = Date.now();
				}

				// Calculate and publish AI move
				const paddle2Dir = aiData.ai.calculateMove(gameState.ball, gameState.paddle2);
				await redis.publish(`game:${uuid}:ai-input`, JSON.stringify({ paddle2Dir }));

			} catch (err) {
				console.error('Error processing game state:', err);
			}
		});

		// Subscribe to game end events for cleanup
		await redisSubscriber.pSubscribe('game:*:end', (message, channel) => {
			const uuid = channel.split(':')[1];
			if (aiInstances.has(uuid)) {
				aiInstances.delete(uuid);
				console.log(`Cleaned up AI for game ${uuid}`);
			}
		});

		console.log('✅ Subscribed to game channels');

		// Periodic cleanup of stale AI instances
		setInterval(() => {
			const now = Date.now();
			for (const [uuid, data] of aiInstances.entries()) {
				if (now - data.lastActivity > AI_INSTANCE_TTL) {
					aiInstances.delete(uuid);
					console.log(`Cleaned up stale AI for game ${uuid}`);
				}
			}
		}, 60 * 1000); // Check every minute

	} catch (err) {
		console.error('Redis connection error:', err);
		process.exit(1);
	}
}

const start = async () => {
	try {
		await setupRedisSubscription();
		await app.listen({ port: 3004, host: '0.0.0.0' });
		console.log('✅ Backend-AI service running on port 3004');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
