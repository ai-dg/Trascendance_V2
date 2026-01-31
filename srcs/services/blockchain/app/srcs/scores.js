
import { time, timeStamp } from 'console';
import crypto from 'crypto'


 /**
    Tournament:
  - appId
  - name
  - winner
  - timestamp

Match (les "scores"):
  - tournamentId
  - player1 vs player2
  - score1 vs score2
  - timestamp
 
 */

  const pseudos = [
  "ShadowKnight", "PixelMaster", "NeonDragon", "CyberWolf", "ThunderStrike",
  "MysticRaven", "IronFist", "BlazeFury", "FrostByte", "StormBreaker",
  "PhantomBlade", "CrimsonHawk", "VoidWalker", "StarGazer", "EchoWarrior",
  "SilverArrow", "DarkPhoenix", "LunarEclipse", "FireStorm", "IceQueen",
  "NightHunter", "GoldenEagle", "VenomStrike", "CosmicRider", "WildCard",
  "AtomicAce", "VortexKing", "NovaBlast", "SteelTitan", "EmberSoul",
  "ZenMaster", "RogueNinja", "CrystalSage", "BlazeRunner", "FrostWarden",
  "ThunderClaw", "ShadowDancer", "NeonSamurai", "CyberPunk", "StormRider",
  "MysticPhoenix", "IronWill", "QuantumLeap", "VoidHunter", "StarCrusher",
  "SilverFang", "DarkMatter", "LunarWolf", "FireFox", "IceBear",
  "NightWing", "GoldenLion", "VenomFang", "CosmicDust", "WildFire",
  "AtomicBomb", "VortexMage", "NovaStar", "SteelHeart", "EmberWing",
  "ZenWarrior", "RogueAgent", "CrystalKnight", "BlazePhoenix", "FrostGiant",
  "ThunderGod", "ShadowMage", "NeonGhost", "CyberNinja", "StormChaser",
  "MysticDragon", "IronLegend", "QuantumRealm", "VoidLord", "StarSeeker",
  "SilverBullet", "DarkKnight", "LunarLight", "FireBall", "IceStorm",
  "NightShade", "GoldenSun", "VenomBite", "CosmicWave", "WildStorm",
  "AtomicFlash", "VortexLord", "NovaFlare", "SteelWing", "EmberBlade",
  "ZenSoul", "RogueStar", "CrystalWing", "BlazeDragon", "FrostFire",
  "ThunderBolt", "ShadowFox", "NeonRacer", "CyberKnight", "StormWolf"
];


export function randomTournamentResult(){
	const tournamentId = crypto.randomUUID();
	const ts = Math.floor(Date.now() / 1000)
	const getRandomPlayers = (count) => {
	const shuffled = [...pseudos].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
	};
	const players = getRandomPlayers(4)


	const tournament = {
		tournamentId,
		winner : players[1],
		players: players,
		timestamp : ts,
	}

	console.log(tournament)
	const matches = [{
			tournamentId,
			player1 : players[0],
			player2 : players[1],
			score1 : 5,
			score2 : 10,
			timestamp: ts - 800,
		}, {
			tournamentId,
			player1 : players[2],
			player2 : players[3],
			score1 : 5,
			score2 : 10,
			timestamp: ts -720,

		}, {
			tournamentId,
			player1 : players[3],
			player2 : players[1],
			score1 : 5,
			score2 : 10,
			timestamp: ts - 250,

		}, {
			tournamentId,
			player1 : players[0],
			player2 : players[2],
			score1 : 5,
			score2 : 10,
			timestamp: ts - 306,

		}]

		//console.log(matches)
		return { tournament, matches };
}