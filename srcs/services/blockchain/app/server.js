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
import contractABI from './srcs/contract-abi.json' assert { type: 'json' };



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

const rpcUrl = process.env.RPC_URL
const contractAddress = process.env.CONTRACT_ADDRESS
const private_key = process.env.BC_PK

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(private_key, provider);
  
  console.log('Adresse du wallet:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', balance.toString(), 'wei');
  console.log('Balance AVAX:', Number(balance) / 1e18, 'AVAX');


// Vérifier la connexion
const blockNumber = await provider.getBlockNumber();
console.log('Block actuel:', blockNumber);

const contract = new ethers.Contract(contractAddress, contractABI, wallet);


app.get("/", (request, reply) => {

	reply.send({message: "ok", status : "up"})

})


app.get('/game', async (request, reply) =>{
	const game = await contract.retrieveGame(0);
	console.log('Game:', game);
})


app.get('/tournament', async (request, reply) =>{
	const game = await contract.retrieveTournament(0);
	console.log('Game:', game);
})


app.get('/game-dev', async (request, reply) => {
	const {matches} = randomTournamentResult();
	console.log("GAME::::::", matches[1]);
	const tx = await contract.storeGame(matches[1]);
	console.log('Transaction envoyée:', tx.hash);
	await tx.wait();
	console.log('Transaction confirmée !');
})


app.get('/tournament-dev', async (request, reply) => {
	const {tournament} = randomTournamentResult();
	console.log("TOUNAMENT::::::", tournament)
	const tx = await contract.storeTournament(tournament);
	console.log('Transaction envoyée:', tx.hash);
	await tx.wait();
	console.log('Transaction confirmée !');
})


app.post('/game', async (request, reply) => {
	const {matches} = randomTournamentResult();
	console.log("GAME::::::", matches[1]);
	const tx = await contract.storeGame(matches[1]);
	console.log('Transaction envoyée:', tx.hash);

	await tx.wait();
	console.log('Transaction confirmée !');

})

app.post('/tournament', async (request, reply) => {
	const {tournament} = randomTournamentResult();
	console.log(tournament)

	const tx = await contract.storeTournament(tournament);
	console.log('Transaction envoyée:', tx.hash);

	await tx.wait();
	console.log('Transaction confirmée !');

})

const start = async () => {
	try {
		const port = 4000;


		await app.listen({ port: port, host: '0.0.0.0'});
		console.log(`blockchain service running on port ${port}`);

		
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
