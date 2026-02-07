import Fastify from 'fastify';
import mysql from 'mysql2/promise';
import 'dotenv/config';
import { compare, hash } from 'bcryptjs';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { createClient } from 'redis';
import validator from 'validator';
import { ethers } from 'ethers';
import { randomTournamentResult } from './srcs/scores.js';
import fs from 'fs';
import path from 'path';
import { setupMetrics } from '/monitoring/metrics.js';



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
setupMetrics(app, 'blockchain');

const provider = new ethers.JsonRpcProvider(
  'https://api.avax-test.network/ext/bc/C/rpc'
);

// Vérifier la connexion
const blockNumber = await provider.getBlockNumber();
console.log('Block actuel:', blockNumber);



app.get("/", (request, reply) => {

	reply.send({message: "ok", status : "up"})

})


app.post('/game', (request, reply) => {
	console.log(request)

})

app.post('/tournament', (request, reply) => {
	console.log(request)

})


const start = async () => {
	try {
		const port = 4000;
		randomTournamentResult();

		await app.listen({ port: port, host: '0.0.0.0'});
		console.log(`blockchain service running on port ${port}`);

		
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
